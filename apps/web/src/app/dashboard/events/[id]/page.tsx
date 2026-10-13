'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Award,
  CheckCircle2,
  Settings,
  ArrowLeft,
  Search,
  Check,
  Upload,
  Move,
  RefreshCw,
  ExternalLink,
  Copy,
  BarChart2,
  QrCode,
  FileText,
  Clock,
  Sparkles,
  UserCheck,
  AlertCircle,
  Download,
  Printer,
  Sliders,
} from 'lucide-react';
import CertificateRenderer, {
  BlockStyle,
  CertificateConfig,
  FONT_FAMILIES,
} from '@/components/certificate/CertificateRenderer';
import EvaluationFormEditor from '@/components/evaluation/EvaluationFormEditor';
import { fetchApi } from '@/lib/api';

export default function EventManagePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'certificate' | 'evaluation'>('overview');
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Attendees state
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);

  // Certificate Designer state
  const [certConfig, setCertConfig] = useState<CertificateConfig>({});
  const [selectedBlock, setSelectedBlock] = useState<'name' | 'course' | 'cert_no'>('name');
  const [savingCert, setSavingCert] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evaluation summary state
  const [evalSummary, setEvalSummary] = useState<any>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);

  const handleExportCsv = () => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/evaluation/events/${eventId}/export-csv?token=${token || ''}`;
    window.open(url, '_blank');
  };

  const handlePrintReport = () => {
    window.print();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/v1/events/${eventId}`);
      if (res.success) {
        setEvent(res.data);
        setCertConfig(res.data.certificate_config || {});
      }
      loadAttendees();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendees = async () => {
    try {
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/attendees`);
      if (res.success) {
        setAttendees(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadEvalSummary = async () => {
    try {
      setLoadingEval(true);
      const res = await fetchApi(`/api/v1/evaluation/events/${eventId}/summary`);
      if (res.success) {
        setEvalSummary(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEval(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'evaluation') {
      loadEvalSummary();
    }
  }, [activeTab]);

  // Check-in handler
  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInInput.trim()) return;

    try {
      const cleanInput = checkInInput.trim();
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({
          phone: cleanInput,
          citizen_id: cleanInput,
          attendee_id: isNaN(Number(cleanInput)) ? undefined : cleanInput,
        }),
      });

      if (res.success) {
        setCheckInFeedback(`✅ เช็คชื่อสำเร็จ: ${res.data.full_name}`);
        setCheckInInput('');
        loadAttendees();
        setTimeout(() => setCheckInFeedback(null), 4000);
      }
    } catch (err: any) {
      setCheckInFeedback(`❌ ${err.message || 'ไม่พบข้อมูลผู้ลงทะเบียน'}`);
      setTimeout(() => setCheckInFeedback(null), 4000);
    }
  };

  const handleCheckInSingle = async (attendeeId: string) => {
    try {
      const res = await fetchApi(`/api/v1/registration/events/${eventId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ attendee_id: attendeeId }),
      });
      if (res.success) {
        loadAttendees();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssueSingle = async (attendeeId: string) => {
    try {
      const res = await fetchApi(`/api/v1/certificates/attendees/${attendeeId}/issue`, {
        method: 'POST',
      });
      if (res.success) {
        loadAttendees();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssueAll = async () => {
    if (!confirm('ยืนยันการออกเกียรติบัตรให้แก่ผู้เข้าร่วมที่เช็คชื่อแล้วทุกคน?')) return;
    try {
      const res = await fetchApi(`/api/v1/certificates/events/${eventId}/issue-all`, {
        method: 'POST',
        body: JSON.stringify({ only_checked_in: true }),
      });
      if (res.success) {
        alert(res.message);
        loadAttendees();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Certificate block style change
  const handleBlockChange = (blockKey: 'name' | 'course' | 'cert_no', updated: BlockStyle) => {
    setCertConfig((prev) => ({
      ...prev,
      [`${blockKey}_block`]: updated,
    }));
  };

  const handleSaveCertConfig = async () => {
    try {
      setSavingCert(true);
      const res = await fetchApi(`/api/v1/certificates/events/${eventId}/config`, {
        method: 'PUT',
        body: JSON.stringify({ certificate_config: certConfig }),
      });
      if (res.success) {
        alert('บันทึกรูปแบบเกียรติบัตรเรียบร้อยแล้ว');
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSavingCert(false);
    }
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('background', file);

    try {
      setUploadingBg(true);
      const res = await fetch(`/api/v1/certificates/events/${eventId}/upload-bg`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setCertConfig((prev) => ({ ...prev, bg_image_url: data.data.bg_image_url }));
        alert('อัปโหลดภาพพื้นหลังเกียรติบัตรสำเร็จ');
      } else {
        alert(data.message || 'ไม่สามารถอัปโหลดภาพได้');
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setUploadingBg(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('คัดลอกลิงก์เรียบร้อยแล้ว');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลการจัดการกิจกรรม...</p>
      </div>
    );
  }

  if (!event) return null;

  const currentBlockStyle: BlockStyle =
    selectedBlock === 'name'
      ? { x: 50, y: 47, fontSize: 34, color: '#0f172a', fontFamily: 'charm', ...(certConfig.name_block || {}) }
      : selectedBlock === 'course'
      ? { x: 50, y: 62, fontSize: 22, color: '#1e293b', fontFamily: 'sarabun', ...(certConfig.course_block || {}) }
      : { x: 90, y: 11, fontSize: 11, color: '#475569', fontFamily: 'sarabun', showQr: true, ...(certConfig.cert_no_block || {}) };

  const filteredAttendees = attendees.filter((a) => {
    if (!attendeeSearch.trim()) return true;
    const q = attendeeSearch.toLowerCase();
    return (
      a.full_name?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.citizen_id?.includes(q) ||
      a.organization?.toLowerCase().includes(q) ||
      a.certificate_no?.toLowerCase().includes(q)
    );
  });

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicRegUrl = `${appOrigin}/events/${eventId}`;
  const publicSurveyUrl = `${appOrigin}/surveys/${eventId}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back and Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-700 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> กลับสู่แดชบอร์ด
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 shrink-0">
              {event.event_code}
            </span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 truncate max-w-full">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Status Toggle & Public Link */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/events/${eventId}`}
            target="_blank"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>หน้าลงทะเบียน</span>
          </Link>

          <Link
            href={`/surveys/${eventId}`}
            target="_blank"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>หน้าแบบประเมิน</span>
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth pb-px -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>ภาพรวม & ลิงก์</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendees')}
          className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
            activeTab === 'attendees'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>ผู้ลงทะเบียน ({attendees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('certificate')}
          className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
            activeTab === 'certificate'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>ออกแบบเกียรติบัตร</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evaluation')}
          className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
            activeTab === 'evaluation'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span>แบบประเมิน & สถิติ</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: OVERVIEW & SHARABLE LINKS
      ======================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Share Links Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                ลิงก์และ QR Code สำหรับประชาสัมพันธ์
              </h2>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                  <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                    <span>ลิงก์ลงทะเบียนเข้าร่วมกิจกรรม (Public Registration)</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(publicRegUrl)}
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> คัดลอก
                    </button>
                  </div>
                  <div className="font-mono text-xs text-blue-800 break-all select-all">
                    {publicRegUrl}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                    <span>ลิงก์แบบประเมินความพึงพอใจ (Evaluation Survey)</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(publicSurveyUrl)}
                      className="inline-flex items-center gap-1 text-indigo-700 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> คัดลอก
                    </button>
                  </div>
                  <div className="font-mono text-xs text-indigo-800 break-all select-all">
                    {publicSurveyUrl}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Settings Details */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">รายละเอียดโครงการ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-slate-500">สถานที่:</span> {event.location || '-'}
                </div>
                <div>
                  <span className="font-bold text-slate-500">รหัสโครงการอ้างอิง:</span> {event.project_ref_code || '-'}
                </div>
                <div>
                  <span className="font-bold text-slate-500">จำนวนรับสูงสุด:</span> {event.max_attendees > 0 ? `${event.max_attendees} คน` : 'ไม่จำกัด'}
                </div>
                <div>
                  <span className="font-bold text-slate-500">คำนำหน้าเลขที่เกียรติบัตร:</span> {certConfig.certificate_no_prefix || 'CERT-2569'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-6 text-white space-y-4 shadow-md">
              <h3 className="font-bold text-sm text-blue-200">สถิติภาพรวมกิจกรรม</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">ผู้ลงทะเบียนทั้งหมด</span>
                  <span className="text-lg font-black">{attendees.length} คน</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-300">เช็คชื่อเข้าร่วมแล้ว</span>
                  <span className="text-lg font-black text-emerald-400">
                    {attendees.filter((a) => a.status === 'checked_in').length} คน
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">ออกเกียรติบัตรแล้ว</span>
                  <span className="text-lg font-black text-amber-300">
                    {attendees.filter((a) => a.certificate_no).length} ฉบับ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ATTENDEES & CHECK-IN
      ======================================================== */}
      {activeTab === 'attendees' && (
        <div className="space-y-6">
          {/* Quick Check-in Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>จุดเช็คชื่อผู้เข้าร่วมหน้างาน (Quick Check-in)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  กรอกเบอร์โทร, เลขบัตรประชาชน, รหัส ID หรือสแกน QR บัตรผู้ลงทะเบียน
                </p>
              </div>

              {/* Batch issue certificates button */}
              <button
                type="button"
                onClick={handleIssueAll}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer w-full sm:w-auto shrink-0"
              >
                <Award className="w-4 h-4" />
                <span>ออกเกียรติบัตรทุกคนที่เช็คชื่อแล้ว</span>
              </button>
            </div>

            <form onSubmit={handleQuickCheckIn} className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <input
                type="text"
                value={checkInInput}
                onChange={(e) => setCheckInInput(e.target.value)}
                placeholder="กรอกเบอร์โทร / เลขบัตร 13 หลัก / ID..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer shrink-0"
              >
                เช็คชื่อทันที
              </button>
            </form>

            {checkInFeedback && (
              <div className="text-xs font-bold text-slate-800 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                {checkInFeedback}
              </div>
            )}
          </div>

          {/* Attendees List & Search */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">รายชื่อผู้ลงทะเบียน</h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {filteredAttendees.length} ท่าน
                </span>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ, เบอร์โทร, สังกัด..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                    <th className="py-3 px-4">ตำแหน่ง / สังกัด</th>
                    <th className="py-3 px-4">สถานะเช็คชื่อ</th>
                    <th className="py-3 px-4">เลขที่เกียรติบัตร</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        ไม่พบรายชื่อผู้ลงทะเบียน
                      </td>
                    </tr>
                  ) : (
                    filteredAttendees.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {a.title_name || ''}{a.full_name}
                        </td>
                        <td className="py-3 px-4 font-mono">{a.phone || '-'}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {a.organization || a.position || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {a.status === 'checked_in' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> เช็คชื่อแล้ว
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCheckInSingle(a.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition cursor-pointer"
                            >
                              กดเช็คชื่อ
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {a.certificate_no || (
                            <span className="text-slate-400 font-normal text-[11px]">
                              ยังไม่ได้ออก
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {!a.certificate_no ? (
                            <button
                              type="button"
                              onClick={() => handleIssueSingle(a.id)}
                              className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition cursor-pointer"
                            >
                              ออกเกียรติบัตร
                            </button>
                          ) : (
                            <Link
                              href={`/certificates/${a.id}/view`}
                              target="_blank"
                              className="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition inline-block"
                            >
                              ดูเกียรติบัตร
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: CERTIFICATE DESIGNER
      ======================================================== */}
      {activeTab === 'certificate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Canvas Preview (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-blue-700">คำแนะนำ:</span> คลิกที่บล็อกข้อความบนเกียรติบัตรเพื่อปรับขนาด สี หรือลากเพื่อจัดตำแหน่ง (Drag & Drop)
              </div>
              <button
                type="button"
                onClick={handleSaveCertConfig}
                disabled={savingCert}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {savingCert ? 'กำลังบันทึก...' : 'บันทึกรูปแบบเกียรติบัตร'}
              </button>
            </div>

            <CertificateRenderer
              attendee={{
                full_name: 'นายสมชาย รักเรียน',
                event_title: event.title,
                certificate_no: `${certConfig.certificate_no_prefix || 'CERT-2569'}-0001`,
              }}
              config={certConfig}
              isEditable={true}
              selectedBlock={selectedBlock}
              onSelectBlock={setSelectedBlock}
              onBlockChange={handleBlockChange}
              showActions={false}
            />
          </div>

          {/* Right Controls Panel (1 col) */}
          <div className="space-y-6">
            {/* Background Upload Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>ภาพพื้นหลังเกียรติบัตร (A4 แนวนอน)</span>
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUploadBg}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingBg}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingBg ? 'กำลังอัปโหลด...' : 'เลือกไฟล์ภาพพื้นหลัง (PNG/JPG)'}</span>
              </button>
            </div>

            {/* Block Inspector */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">ปรับแต่งบล็อกที่เลือก</h3>
                <div className="flex gap-1">
                  {(['name', 'course', 'cert_no'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBlock(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedBlock === b
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {b === 'name' ? 'ชื่อ' : b === 'course' ? 'กิจกรรม' : 'เลขที่/QR'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">รูปแบบฟอนต์</label>
                <select
                  value={currentBlockStyle.fontFamily || 'sarabun'}
                  onChange={(e) =>
                    handleBlockChange(selectedBlock, { ...currentBlockStyle, fontFamily: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Object.entries(FONT_FAMILIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.thaiName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">ขนาดตัวอักษร</span>
                  <span className="font-mono text-slate-500">{currentBlockStyle.fontSize || 24}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={currentBlockStyle.fontSize || 24}
                  onChange={(e) =>
                    handleBlockChange(selectedBlock, {
                      ...currentBlockStyle,
                      fontSize: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Font Color */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">สีตัวอักษร</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentBlockStyle.color || '#0f172a'}
                    onChange={(e) =>
                      handleBlockChange(selectedBlock, { ...currentBlockStyle, color: e.target.value })
                    }
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={currentBlockStyle.color || '#0f172a'}
                    onChange={(e) =>
                      handleBlockChange(selectedBlock, { ...currentBlockStyle, color: e.target.value })
                    }
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* QR Code toggles if cert_no selected */}
              {selectedBlock === 'cert_no' && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentBlockStyle.showQr !== false}
                      onChange={(e) =>
                        handleBlockChange('cert_no', {
                          ...currentBlockStyle,
                          showQr: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span>แสดง QR Code สำหรับสแกนตรวจสอบ</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: EVALUATION & STATISTICAL ANALYSIS
      ======================================================== */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {/* Top Actions Bar for Evaluation */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                การประเมินความพึงพอใจและสถิติ (Evaluation & Analytics)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                กำหนดคำถาม ธีมหน้าประเมิน เงื่อนไขการรับเกียรติบัตร และวิเคราะห์ผลค่าเฉลี่ย (x̄/S.D.)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowFormEditor(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>ตั้งค่าแบบประเมิน (Form Builder)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                title="ส่งออกผลการประเมินรายคนเป็นไฟล์ CSV / Excel พร้อมภาษาไทยสมบูรณ์"
              >
                <Download className="w-4 h-4 text-slate-600 shrink-0" />
                <span>ส่งออก CSV / Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrintReport}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
                title="พิมพ์หน้ารายงานสรุปผลสถิติเป็นเอกสารสรุปโครงการ PDF"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>พิมพ์รายงานสรุปผล</span>
              </button>
            </div>
          </div>

          {/* Form Editor Modal */}
          {showFormEditor && (
            <EvaluationFormEditor
              eventId={eventId}
              onClose={() => {
                setShowFormEditor(false);
                loadEvalSummary();
              }}
              onSaved={() => {
                setShowFormEditor(false);
                loadEvalSummary();
              }}
            />
          )}

          {loadingEval ? (
            <div className="text-center py-16 text-slate-400">กำลังประมวลผลข้อมูลสถิติแบบประเมิน...</div>
          ) : !evalSummary ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              ยังไม่มีข้อมูลการตอบแบบประเมิน
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="text-xs font-bold text-slate-500">จำนวนผู้ตอบแบบประเมิน</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {evalSummary.total_responses} คน
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    เป้าหมาย {evalSummary.target_responses} คน ({evalSummary.completion_rate}%)
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="text-xs font-bold text-slate-500">ค่าเฉลี่ยความพึงพอใจโดยรวม (x̄)</div>
                  <div className="text-2xl font-black text-blue-700 mt-1">
                    {evalSummary.overall?.mean || 0} / 5.00
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    S.D. = {evalSummary.overall?.sd || 0}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="text-xs font-bold text-slate-500">ระดับผลการประเมิน</div>
                  <div className="text-xl font-black text-emerald-600 mt-1">
                    {evalSummary.overall?.level || '-'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    แปลผลตามเกณฑ์คะแนนเฉลี่ย Likert Scale
                  </div>
                </div>
              </div>

              {/* Question Breakdown by Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <h3 className="font-bold text-slate-900 text-lg">
                  รายงานผลการประเมินรายข้อ (Statistical Report)
                </h3>

                {evalSummary.sections?.map((sec: any) => (
                  <div key={sec.id} className="space-y-4 pt-4 border-t border-slate-100 first:border-t-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">{sec.title}</h4>
                      {sec.stats?.count > 0 && (
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                          ค่าเฉลี่ยตอน: {sec.stats.mean} (ระดับ {sec.stats.level})
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {sec.questions?.map((q: any) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                        >
                          <div className="font-medium text-slate-800 flex-1">
                            {q.question_text}
                          </div>

                          {q.question_type === 'RATING_5' && q.stats && (
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <div className="font-mono font-bold text-slate-900">
                                  x̄ = {q.stats.mean}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  S.D. = {q.stats.sd}
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                                {q.stats.level}
                              </span>
                            </div>
                          )}

                          {q.question_type === 'TEXT' && q.text_answers && (
                            <div className="text-slate-500 italic">
                              มีข้อเสนอแนะ {q.text_answers.length} รายการ
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
