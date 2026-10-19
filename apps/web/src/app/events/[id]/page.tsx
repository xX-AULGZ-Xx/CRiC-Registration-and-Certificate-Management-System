'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  Award,
  CheckCircle2,
  Clock,
  ClipboardList,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [titleName, setTitleName] = useState('นาย');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [citizenId, setCitizenId] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/public-info`);
      if (res.success) {
        setEventData(res.data.event);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถโหลดข้อมูลกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/register`, {
        method: 'POST',
        body: JSON.stringify({
          title_name: titleName,
          full_name: fullName.trim(),
          position: position.trim(),
          organization: organization.trim(),
          phone: phone.trim(),
          email: email.trim(),
          citizen_id: citizenId.trim(),
        }),
      });

      if (res.success) {
        const attendeeId = res.data.attendee.id;
        router.push(`/events/${eventId}/ticket?attendee_id=${attendeeId}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลกิจกรรม...</p>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">ไม่พบกิจกรรมที่ระบุ</h2>
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-semibold mt-4">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้ารวมกิจกรรม
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Standalone Header */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้ารวมกิจกรรม</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">ระบบลงทะเบียนและออกเกียรติบัตรออนไลน์</span>
          </div>
        </div>

      {/* Event Header Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-teal-700 p-6 sm:p-10 text-white relative">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
                รหัสกิจกรรม: {eventData.event_code}
              </span>
              {eventData.project_ref_code && (
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
                  รหัสโครงการ: {eventData.project_ref_code}
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  eventData.is_registration_open
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {eventData.is_registration_open ? 'เปิดรับลงทะเบียน' : 'ปิดรับลงทะเบียน'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug">
              {eventData.title}
            </h1>

            {eventData.description && (
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {eventData.description}
              </p>
            )}
          </div>
        </div>

        {/* Event Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-6 bg-slate-50/50">
          <div className="flex items-start gap-3 p-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold">วันจัดกิจกรรม</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {formatDate(eventData.start_date) || 'ตามกำหนดการ'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold">เวลาจัดกิจกรรม</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {eventData.start_time
                  ? `${eventData.start_time}${eventData.end_time ? ` - ${eventData.end_time}` : ''} น.`
                  : 'ตามกำหนดการ'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold">สถานที่จัดกิจกรรม</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5 line-clamp-1">
                {eventData.location || 'วิทยาลัยอาชีวศึกษาเชียงราย'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3">
            <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold">จำนวนผู้ลงทะเบียน</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {eventData.current_attendees}
                {eventData.max_attendees > 0 ? ` / ${eventData.max_attendees}` : ''} คน
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Registration Form & Evaluation / Certificate Link */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <span>แบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              กรุณากรอกข้อมูลเพื่อใช้ในการเช็คชื่อและออกเกียรติบัตรที่ถูกต้อง
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!eventData.is_registration_open ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <Clock className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-700">กิจกรรมนี้ปิดรับลงทะเบียนแล้ว</h3>
              <p className="text-slate-500 text-xs">
                หากท่านเคยลงทะเบียนไว้แล้ว สามารถค้นหาเกียรติบัตรหรือทำแบบประเมินได้จากเมนูด้านล่าง
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">คำนำหน้า *</label>
                  <select
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ดร.">ดร.</option>
                    <option value="ผศ.">ผศ.</option>
                    <option value="รศ.">รศ.</option>
                    <option value="">(ไม่ระบุ)</option>
                  </select>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    ชื่อ - นามสกุล (สำหรับพิมพ์บนเกียรติบัตร) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">ตำแหน่ง / บทบาท</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="เช่น ครู, นักเรียน, บุคลากร"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">สังกัด / หน่วยงาน</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="เช่น แผนกวิชาคอมพิวเตอร์ธุรกิจ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ (ใช้ค้นหาเกียรติบัตร) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">อีเมล (ถ้ามี)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@crvc.ac.th"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-base shadow-md hover:shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการลงทะเบียน'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar: Evaluation & Certificate Flow Guide */}
        <div className="space-y-6">
          {/* Workflow Guide Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>ขั้นตอนการรับเกียรติบัตร</span>
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-slate-800">ลงทะเบียนล่วงหน้า</div>
                  <div className="text-slate-500 mt-0.5">กรอกข้อมูลและบันทึก QR Code ประจำตัว</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-slate-800">เช็คชื่อหน้างาน</div>
                  <div className="text-slate-500 mt-0.5">แสดง QR Code ให้ผู้จัดสแกนเช็คชื่อ</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-slate-800">ทำแบบประเมินความพึงพอใจ</div>
                  <div className="text-slate-500 mt-0.5">ตอบแบบประเมินโครงการหลังจบกิจกรรม</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  4
                </div>
                <div>
                  <div className="font-bold text-slate-800">ดาวน์โหลดเกียรติบัตรทันที</div>
                  <div className="text-slate-500 mt-0.5">รับเกียรติบัตรดิจิทัลพร้อม QR ยืนยันเอกสารจริง</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Link to Evaluation Survey */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100 p-6 space-y-3">
            <div className="font-bold text-indigo-950 text-sm">
              เข้าร่วมกิจกรรมแล้วใช่หรือไม่?
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              สำหรับผู้ที่เช็คชื่อเข้าร่วมกิจกรรมแล้ว สามารถทำแบบประเมินความพึงพอใจเพื่อรับเกียรติบัตรได้ทันที
            </p>
            <Link
              href={`/surveys/${eventData.id}`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
            >
              <span>ไปยังหน้าแบบประเมินความพึงพอใจ</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Standalone Simple Footer */}
      <div className="pt-6 pb-4 text-center text-xs text-slate-400 space-y-1">
        <p>© ระบบลงทะเบียนและออกเกียรติบัตรออนไลน์ • ขับเคลื่อนด้วยระบบดิจิทัล</p>
      </div>
    </div>
  </div>
);
}
