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
import {
  normalizeRegistrationConfig,
  getRegistrationTheme,
} from '@/lib/registration-config';

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
  const [customData, setCustomData] = useState<Record<string, any>>({});

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

  const handleCheckboxToggle = (fieldId: string, option: string) => {
    setCustomData((prev) => {
      const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      const exists = current.includes(option);
      return {
        ...prev,
        [fieldId]: exists
          ? current.filter((item: string) => item !== option)
          : [...current, option],
      };
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const regConfig = normalizeRegistrationConfig(eventData?.registration_config);
    const std = regConfig.standardFields;

    if (!fullName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    const stdChecks: Array<{ key: keyof typeof std; val: string; fallbackLabel: string }> = [
      { key: 'title_name', val: titleName, fallbackLabel: 'คำนำหน้า' },
      { key: 'position', val: position, fallbackLabel: 'ตำแหน่ง' },
      { key: 'organization', val: organization, fallbackLabel: 'สังกัด / หน่วยงาน' },
      { key: 'phone', val: phone, fallbackLabel: 'เบอร์โทรศัพท์' },
      { key: 'email', val: email, fallbackLabel: 'อีเมล' },
      { key: 'citizen_id', val: citizenId, fallbackLabel: 'เลขประจำตัวประชาชน' },
    ];

    for (const item of stdChecks) {
      const cfg = std[item.key];
      if (cfg.enabled && cfg.required && !item.val.trim()) {
        setErrorMsg(`กรุณากรอก${cfg.label || item.fallbackLabel}`);
        return;
      }
    }

    for (const cf of regConfig.customFields) {
      if (cf.required) {
        const ans = customData[cf.id];
        const isEmpty =
          ans === undefined ||
          ans === null ||
          (typeof ans === 'string' && !ans.trim()) ||
          (Array.isArray(ans) && ans.length === 0);
        if (isEmpty) {
          setErrorMsg(`กรุณากรอกหรือเลือก "${cf.label}"`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/register`, {
        method: 'POST',
        body: JSON.stringify({
          title_name: std.title_name.enabled ? titleName : null,
          full_name: fullName.trim(),
          position: std.position.enabled ? position.trim() : null,
          organization: std.organization.enabled ? organization.trim() : null,
          phone: std.phone.enabled ? phone.trim() : null,
          email: std.email.enabled ? email.trim() : null,
          citizen_id: std.citizen_id.enabled ? citizenId.trim() : null,
          custom_data: customData,
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

  const regConfig = normalizeRegistrationConfig(eventData?.registration_config);
  const theme = getRegistrationTheme(regConfig.themeColorId);
  const std = regConfig.standardFields;
  const showCertSidebar =
    eventData?.certificate_config?.has_certificate !== false &&
    regConfig.showCertificateSidebar !== false;

  return (
    <div className="min-h-screen bg-slate-50/70 py-4 sm:py-10">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* Standalone Header */}
        <div className="flex items-center justify-between pb-1 sm:pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้ารวมกิจกรรม</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Award className={`w-4 h-4 ${theme.accentTextClass}`} />
            <span className="hidden sm:inline">ระบบลงทะเบียนและออกเกียรติบัตรออนไลน์</span>
          </div>
        </div>

      {/* Event Header Banner Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        {eventData.banner_url && (
          <div className="w-full bg-slate-100 overflow-hidden">
            <img
              src={eventData.banner_url}
              alt={eventData.title}
              className="w-full h-auto block"
            />
          </div>
        )}
        <div className={`bg-gradient-to-r ${theme.headerGradient} p-4 sm:p-10 text-white relative`}>
          <div className="space-y-3 sm:space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 text-[11px] sm:text-xs font-semibold backdrop-blur-md">
                รหัสกิจกรรม: {eventData.event_code}
              </span>
              {eventData.project_ref_code && (
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 text-[11px] sm:text-xs font-semibold backdrop-blur-md">
                  รหัสโครงการ: {eventData.project_ref_code}
                </span>
              )}
              <span
                className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${
                  eventData.is_registration_open
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {eventData.is_registration_open ? 'เปิดรับลงทะเบียน' : 'ปิดรับลงทะเบียน'}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold leading-snug">
              {eventData.title}
            </h1>

            {eventData.description && (
              <p className="text-slate-200 text-xs sm:text-base leading-relaxed">
                {eventData.description}
              </p>
            )}
          </div>
        </div>

        {/* Event Quick Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-3 sm:p-6 bg-slate-50/50">
          <div className="flex items-start gap-2.5 sm:gap-3 p-2 sm:p-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">วันจัดกิจกรรม</div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 truncate">
                {formatDate(eventData.start_date) || 'ตามกำหนดการ'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 sm:gap-3 p-2 sm:p-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">เวลาจัดกิจกรรม</div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 truncate">
                {eventData.start_time
                  ? `${eventData.start_time}${eventData.end_time ? ` - ${eventData.end_time}` : ''} น.`
                  : 'ตามกำหนดการ'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 sm:gap-3 p-2 sm:p-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">สถานที่จัดกิจกรรม</div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 truncate">
                {eventData.location || 'วิทยาลัยอาชีวศึกษาเชียงราย'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 sm:gap-3 p-2 sm:p-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-teal-100 text-teal-700 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">จำนวนผู้ลงทะเบียน</div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 truncate">
                {eventData.current_attendees}
                {eventData.max_attendees > 0 ? ` / ${eventData.max_attendees}` : ''} คน
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Registration Form & Evaluation / Certificate Link */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Registration Form */}
        <div
          className={`${
            showCertSidebar ? 'lg:col-span-2' : 'lg:col-span-3'
          } bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-8 space-y-5 sm:space-y-6`}
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className={`w-5 h-5 ${theme.accentTextClass}`} />
              <span>{regConfig.headerTitle?.trim() || 'แบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม'}</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 whitespace-pre-line">
              {regConfig.instructions?.trim() ||
                'กรุณาระบุข้อมูลสำหรับการบันทึกเวลาเข้าร่วมและจัดทำเกียรติบัตร'}
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
              <h3 className="font-bold text-slate-700">ปิดรับลงทะเบียนเข้าร่วมกิจกรรม</h3>
              <p className="text-slate-500 text-xs">
                ผู้ที่ลงทะเบียนแล้วสามารถทำแบบประเมินหรือค้นหาเกียรติบัตรได้จากรายการด้านล่าง
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {std.title_name.enabled && (
                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {std.title_name.label || 'คำนำหน้า'}{' '}
                      {std.title_name.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      value={titleName}
                      required={std.title_name.required}
                      onChange={(e) => setTitleName(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 ${theme.ringClass} focus:outline-none`}
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
                )}

                <div className={`${std.title_name.enabled ? 'sm:col-span-3' : 'sm:col-span-4'} space-y-1.5`}>
                  <label className="text-xs font-bold text-slate-700">
                    {std.full_name.label || 'ชื่อ - นามสกุล (สำหรับพิมพ์บนเกียรติบัตร)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${theme.ringClass} focus:outline-none`}
                  />
                </div>
              </div>

              {(std.position.enabled || std.organization.enabled) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {std.position.enabled && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {std.position.label || 'ตำแหน่ง / บทบาท'}{' '}
                        {std.position.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        required={std.position.required}
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="เช่น ครู, นักเรียน, บุคลากร"
                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${theme.ringClass} focus:outline-none`}
                      />
                    </div>
                  )}

                  {std.organization.enabled && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {std.organization.label || 'สังกัด / หน่วยงาน'}{' '}
                        {std.organization.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        required={std.organization.required}
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="เช่น แผนกวิชาคอมพิวเตอร์ธุรกิจ"
                        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${theme.ringClass} focus:outline-none`}
                      />
                    </div>
                  )}
                </div>
              )}

              {std.phone.enabled && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {std.phone.label || 'หมายเลขโทรศัพท์ (ใช้สำหรับสืบค้นเกียรติบัตร)'}{' '}
                    {std.phone.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="tel"
                    required={std.phone.required}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 0812345678"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${theme.ringClass} focus:outline-none`}
                  />
                </div>
              )}

              {std.email.enabled && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {std.email.label || 'อีเมล'}{' '}
                    {std.email.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="email"
                    required={std.email.required}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@crvc.ac.th"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${theme.ringClass} focus:outline-none`}
                  />
                </div>
              )}

              {std.citizen_id.enabled && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {std.citizen_id.label || 'เลขประจำตัวประชาชน 13 หลัก'}{' '}
                    {std.citizen_id.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={std.citizen_id.required}
                    maxLength={13}
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder="กรอกเลขประจำตัวประชาชน 13 หลัก"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${theme.ringClass} focus:outline-none`}
                  />
                </div>
              )}

              {/* Dynamic Custom Questions */}
              {regConfig.customFields.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  {regConfig.customFields.map((cf) => (
                    <div key={cf.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                      </label>

                      {cf.type === 'text' && (
                        <input
                          type="text"
                          required={cf.required}
                          value={customData[cf.id] || ''}
                          onChange={(e) =>
                            setCustomData((prev) => ({ ...prev, [cf.id]: e.target.value }))
                          }
                          placeholder={cf.placeholder || ''}
                          className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${theme.ringClass} focus:outline-none`}
                        />
                      )}

                      {cf.type === 'textarea' && (
                        <textarea
                          rows={3}
                          required={cf.required}
                          value={customData[cf.id] || ''}
                          onChange={(e) =>
                            setCustomData((prev) => ({ ...prev, [cf.id]: e.target.value }))
                          }
                          placeholder={cf.placeholder || ''}
                          className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${theme.ringClass} focus:outline-none`}
                        />
                      )}

                      {cf.type === 'select' && (
                        <select
                          required={cf.required}
                          value={customData[cf.id] || ''}
                          onChange={(e) =>
                            setCustomData((prev) => ({ ...prev, [cf.id]: e.target.value }))
                          }
                          className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 ${theme.ringClass} focus:outline-none`}
                        >
                          <option value="">-- กรุณาเลือก --</option>
                          {(cf.options || []).map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {cf.type === 'radio' && (
                        <div className="space-y-2 pt-1">
                          {(cf.options || []).map((opt, idx) => (
                            <label
                              key={idx}
                              className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`cf_${cf.id}`}
                                value={opt}
                                checked={customData[cf.id] === opt}
                                onChange={() =>
                                  setCustomData((prev) => ({ ...prev, [cf.id]: opt }))
                                }
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {cf.type === 'checkbox' && (
                        <div className="space-y-2 pt-1">
                          {(cf.options || []).map((opt, idx) => {
                            const selectedList = Array.isArray(customData[cf.id])
                              ? customData[cf.id]
                              : [];
                            return (
                              <label
                                key={idx}
                                className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedList.includes(opt)}
                                  onChange={() => handleCheckboxToggle(cf.id, opt)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-base shadow-md hover:shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer ${theme.buttonClass}`}
                >
                  {submitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการลงทะเบียน'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar: Registration & Certificate Guide */}
        {showCertSidebar && (
        <div className="space-y-6">
          {/* Workflow Guide Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>ขั้นตอนการเข้าร่วมและรับเกียรติบัตร</span>
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
                  <div className="text-slate-500 mt-0.5">แสดง QR Code ให้ผู้จัดสแกนเช็คชื่อเข้าร่วม</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-slate-800">รับเกียรติบัตรออนไลน์</div>
                  <div className="text-slate-500 mt-0.5">ค้นหาและดาวน์โหลดเกียรติบัตรดิจิทัลฉบับสมบูรณ์</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Link to Certificate Search */}
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl border border-blue-100 p-6 space-y-3">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>ค้นหาและรับเกียรติบัตร</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              สำหรับผู้ที่เคยลงทะเบียนหรือเข้าร่วมกิจกรรมเรียบร้อยแล้ว สามารถค้นหาเกียรติบัตรออนไลน์ด้วยเบอร์โทรศัพท์ได้ทันที
            </p>
            <Link
              href="/certificates/search"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition"
            >
              <span>ค้นหาเกียรติบัตรของคุณ</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        )}
      </div>

      {/* Standalone Simple Footer */}
      <div className="pt-6 pb-4 text-center text-xs text-slate-400 space-y-1">
        <p>© ระบบลงทะเบียนและออกเกียรติบัตรออนไลน์ • ขับเคลื่อนด้วยระบบดิจิทัล</p>
      </div>
    </div>
  </div>
);
}
