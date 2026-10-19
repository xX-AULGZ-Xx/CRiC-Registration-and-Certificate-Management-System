'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Award,
  CheckCircle2,
  Plus,
  ArrowRight,
  Settings,
  Trash2,
  ExternalLink,
  ClipboardList,
  Sparkles,
  Search,
  User,
  Clock,
  BarChart2,
  Star,
  FileText,
  MapPin,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function DashboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Portal Mode: 'register' | 'evaluation'
  const [portalMode, setPortalMode] = useState<'register' | 'evaluation'>('register');

  // New Event Form (Register Mode)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectRefCode, setProjectRefCode] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('16:30');
  const [regStart, setRegStart] = useState('');
  const [regEnd, setRegEnd] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('100');
  const [certPrefix, setCertPrefix] = useState('วอศ.ชร-2569');

  // New Survey Form (Evaluation Mode only)
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [surveyProjectRefCode, setSurveyProjectRefCode] = useState('');
  const [surveyTargetResponses, setSurveyTargetResponses] = useState('50');
  const [surveyStartDate, setSurveyStartDate] = useState('');
  const [surveyEndDate, setSurveyEndDate] = useState('');
  const [surveyTemplate, setSurveyTemplate] = useState<'standard' | 'blank'>('standard');

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const modeParam = searchParams.get('mode');
      if (modeParam === 'evaluation') {
        setPortalMode('evaluation');
      } else if (modeParam === 'register') {
        setPortalMode('register');
      } else {
        const saved = localStorage.getItem('portal_mode');
        if (saved === 'evaluation' || saved === 'register') {
          setPortalMode(saved);
        }
      }
    }

    const handleModeChange = (e: any) => {
      if (e.detail && (e.detail === 'register' || e.detail === 'evaluation')) {
        setPortalMode(e.detail);
      }
    };
    window.addEventListener('portal-mode-changed', handleModeChange);

    loadEvents();

    return () => window.removeEventListener('portal-mode-changed', handleModeChange);
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/api/v1/events');
      if (res.success) {
        setEvents(res.data);
      }
    } catch (err: any) {
      if (err?.message?.includes('เซสชันหมดอายุ') || err?.message?.includes('401')) {
        return;
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    try {
      const res = await fetchApi('/api/v1/events', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          project_ref_code: projectRefCode.trim() || undefined,
          location: location.trim() || undefined,
          start_date: startDate ? new Date(startDate).toISOString() : undefined,
          end_date: endDate ? new Date(endDate).toISOString() : undefined,
          start_time: startTime.trim() || undefined,
          end_time: endTime.trim() || undefined,
          registration_start: regStart ? new Date(regStart).toISOString() : undefined,
          registration_end: regEnd ? new Date(regEnd).toISOString() : undefined,
          max_attendees: parseInt(maxAttendees) || 0,
          certificate_config: {
            certificate_no_prefix: certPrefix.trim() || 'CERT-2569',
            require_check_in: true,
            require_evaluation: true,
          },
        }),
      });

      if (res.success) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setProjectRefCode('');
        setLocation('');
        setStartDate('');
        setEndDate('');
        setStartTime('09:00');
        setEndTime('16:30');
        setRegStart('');
        setRegEnd('');
        loadEvents();
      }
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถสร้างกิจกรรมได้');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTitle.trim()) return;

    setCreating(true);
    try {
      const res = await fetchApi('/api/v1/events', {
        method: 'POST',
        body: JSON.stringify({
          title: surveyTitle.trim(),
          description: surveyDescription.trim() || undefined,
          project_ref_code: surveyProjectRefCode.trim() || undefined,
          start_date: surveyStartDate ? new Date(surveyStartDate).toISOString() : undefined,
          end_date: surveyEndDate ? new Date(surveyEndDate).toISOString() : undefined,
          max_attendees: 0,
          certificate_config: {
            require_check_in: false,
            require_evaluation: true,
          },
        }),
      });

      if (res.success && res.data) {
        const createdEventId = res.data.id;

        const standardSections = [
          {
            title: 'ตอนที่ 1: ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม',
            description: 'กรุณากรอกข้อมูลตามความเป็นจริง',
            order_index: 1,
            questions: [
              {
                question_text: 'สถานะของผู้ตอบแบบประเมิน',
                question_type: 'RADIO',
                options: ['นักเรียน / นักศึกษา', 'ครู / อาจารย์', 'บุคลากรทางการศึกษา', 'บุคคลทั่วไป'],
                order_index: 1,
                is_required: true,
              },
              {
                question_text: 'เพศ',
                question_type: 'RADIO',
                options: ['ชาย', 'หญิง', 'ไม่ระบุ'],
                order_index: 2,
                is_required: false,
              },
            ],
          },
          {
            title: 'ตอนที่ 2: ความพึงพอใจต่อการดำเนินโครงการ',
            description: 'ระดับความพึงพอใจ 5 = มากที่สุด, 4 = มาก, 3 = ปานกลาง, 2 = น้อย, 1 = น้อยที่สุด',
            order_index: 2,
            questions: [
              {
                question_text: 'วิทยากรมีความรู้ความเชี่ยวชาญและการถ่ายทอดที่เข้าใจง่าย',
                question_type: 'RATING_5',
                order_index: 1,
                is_required: true,
              },
              {
                question_text: 'เนื้อหาและกิจกรรมมีความเหมาะสมและเป็นประโยชน์',
                question_type: 'RATING_5',
                order_index: 2,
                is_required: true,
              },
              {
                question_text: 'ความพร้อมของสถานที่ อุปกรณ์ และสิ่งอำนวยความสะดวก',
                question_type: 'RATING_5',
                order_index: 3,
                is_required: true,
              },
              {
                question_text: 'ระยะเวลาและการดำเนินงานมีความเหมาะสม',
                question_type: 'RATING_5',
                order_index: 4,
                is_required: true,
              },
              {
                question_text: 'ความพึงพอใจในภาพรวมต่อการจัดโครงการ',
                question_type: 'RATING_5',
                order_index: 5,
                is_required: true,
              },
            ],
          },
          {
            title: 'ตอนที่ 3: ข้อเสนอแนะและความคิดเห็นเพิ่มเติม',
            description: 'เพื่อนำไปพัฒนาและปรับปรุงการดำเนินงานในครั้งต่อไป',
            order_index: 3,
            questions: [
              {
                question_text: 'ข้อคิดเห็นหรือข้อเสนอแนะเพิ่มเติมสำหรับการจัดกิจกรรมครั้งต่อไป',
                question_type: 'TEXT',
                order_index: 1,
                is_required: false,
              },
            ],
          },
        ];

        try {
          await fetchApi(`/api/v1/evaluation/events/${createdEventId}/form`, {
            method: 'POST',
            body: JSON.stringify({
              title: surveyTitle.trim(),
              description: surveyDescription.trim() || undefined,
              target_responses: parseInt(surveyTargetResponses) || 50,
              is_active: true,
              sections: surveyTemplate === 'standard' ? standardSections : [],
            }),
          });
        } catch {
          // ignore
        }

        setShowCreateModal(false);
        setSurveyTitle('');
        setSurveyDescription('');
        setSurveyProjectRefCode('');
        setSurveyStartDate('');
        setSurveyEndDate('');

        // Redirect directly to questionnaire management tab
        window.location.href = `/dashboard/events/${createdEventId}?tab=evaluation`;
      }
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถสร้างแบบสอบถามได้');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบไปด้วย')) return;

    try {
      await fetchApi(`/api/v1/events/${id}`, { method: 'DELETE' });
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Stats calculation
  const totalEvents = events.length;
  const totalAttendees = events.reduce((sum, e) => sum + (e._count?.attendees || 0), 0);
  const totalSurveyResponses = events.reduce(
    (sum, e) => sum + (e.evaluation_form?._count?.responses || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {portalMode === 'evaluation'
                ? 'ระบบจัดการแบบประเมินความพึงพอใจ'
                : 'ระบบจัดการกิจกรรมและเกียรติบัตร'}
            </h1>
            {currentUser && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                portalMode === 'evaluation'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                  : 'bg-blue-50 text-blue-700 border-blue-200/80'
              }`}>
                {currentUser.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name || currentUser.username}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>{currentUser.full_name || currentUser.username}</span>
                <span className="text-[10px] opacity-75 font-medium">
                  ({currentUser.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้จัด'})
                </span>
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {portalMode === 'evaluation'
              ? 'สร้างและออกแบบแบบสอบถาม ติดตามจำนวนผู้ตอบ และรายงานผลการประเมินโครงการ'
              : 'สร้างกิจกรรม จัดการผู้ลงทะเบียน เช็คชื่อหน้างาน และออกแบบเกียรติบัตร'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {currentUser?.role === 'ADMIN' && (
            <Link
              href="/dashboard/admin/settings"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer shrink-0"
              title="ตั้งค่าระบบส่วนกลาง"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>ตั้งค่าระบบ</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer shrink-0 ${
              portalMode === 'evaluation'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{portalMode === 'evaluation' ? 'สร้างแบบสอบถามใหม่' : 'สร้างกิจกรรมใหม่'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {portalMode === 'evaluation' ? (
          <>
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">แบบสอบถามทั้งหมด</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{totalEvents}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">ผู้ตอบแบบสอบถามรวม</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{totalSurveyResponses} คน</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">สถานะระบบแบบประเมิน</div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> พร้อมเปิดรับคำตอบ 100%
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">กิจกรรมทั้งหมด</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{totalEvents}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">ผู้ลงทะเบียนรวมทุกโครงการ</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{totalAttendees} คน</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">ระบบเกียรติบัตร</div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> พร้อมใช้งาน 100%
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {portalMode === 'evaluation' ? 'รายการแบบสอบถามของคุณ' : 'รายการกิจกรรมของคุณ'}
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {events.length} {portalMode === 'evaluation' ? 'แบบสอบถาม' : 'กิจกรรม'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            {portalMode === 'evaluation' ? 'กำลังโหลดรายการแบบสอบถาม...' : 'กำลังโหลดรายการกิจกรรม...'}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            {portalMode === 'evaluation' ? (
              <>
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="text-base font-bold text-slate-700">ยังไม่มีแบบสอบถามที่สร้าง</div>
                <p className="text-xs text-slate-400">คลิกที่ปุ่ม &quot;สร้างแบบสอบถามใหม่&quot; เพื่อเริ่มต้น</p>
              </>
            ) : (
              <>
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="text-base font-bold text-slate-700">ยังไม่มีกิจกรรมที่สร้าง</div>
                <p className="text-xs text-slate-400">คลิกที่ปุ่ม &quot;สร้างกิจกรรมใหม่&quot; เพื่อเริ่มต้น</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-6 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                      portalMode === 'evaluation'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {evt.event_code}
                    </span>
                    {evt.project_ref_code && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        โครงการ: {evt.project_ref_code}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        portalMode === 'evaluation'
                          ? 'bg-indigo-100 text-indigo-800'
                          : evt.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {portalMode === 'evaluation'
                        ? 'เปิดรับคำตอบ'
                        : evt.status === 'OPEN'
                        ? 'เปิดรับลงทะเบียน'
                        : 'ปิดรับสมัคร'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    <Link
                      href={portalMode === 'evaluation' ? `/dashboard/events/${evt.id}?tab=evaluation` : `/dashboard/events/${evt.id}`}
                      className={`transition ${portalMode === 'evaluation' ? 'hover:text-indigo-700' : 'hover:text-blue-700'}`}
                    >
                      {evt.title}
                    </Link>
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-y-1.5 gap-x-4">
                    {portalMode === 'evaluation' ? (
                      <>
                        <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                          <BarChart2 className="w-3.5 h-3.5" />
                          ผู้ตอบแบบสอบถาม: {evt.evaluation_form?._count?.responses || 0} คน
                        </span>
                        {evt.start_date && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(evt.start_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                            {evt.end_date && ` - ${new Date(evt.end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {evt.start_date && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {new Date(evt.start_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                            {evt.end_date && ` - ${new Date(evt.end_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                          </span>
                        )}
                        {evt.start_time && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {evt.start_time}{evt.end_time ? ` - ${evt.end_time}` : ''} น.
                          </span>
                        )}
                        {evt.location && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {evt.location}
                          </span>
                        )}
                        <span>ผู้ลงทะเบียน: {evt._count?.attendees || 0} คน</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={portalMode === 'evaluation' ? `/surveys/${evt.id}` : `/events/${evt.id}`}
                    target="_blank"
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                    title={portalMode === 'evaluation' ? 'เปิดหน้าแบบประเมินสาธารณะ' : 'เปิดหน้าลงทะเบียนสาธารณะ'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <Link
                    href={portalMode === 'evaluation' ? `/dashboard/events/${evt.id}?tab=evaluation` : `/dashboard/events/${evt.id}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs transition ${
                      portalMode === 'evaluation'
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-blue-700 hover:bg-blue-800'
                    }`}
                  >
                    {portalMode === 'evaluation' ? (
                      <>
                        <ClipboardList className="w-4 h-4" />
                        <span>ออกแบบคำถาม</span>
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4" />
                        <span>จัดการกิจกรรม</span>
                      </>
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteEvent(evt.id, e)}
                    className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                    title="ลบรายการ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {portalMode === 'evaluation'
                    ? 'สร้างแบบสอบถามประเมินความพึงพอใจ'
                    : 'สร้างกิจกรรม / การอบรมใหม่'}
                </h3>
                {portalMode === 'evaluation' && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    กำหนดหัวข้อโครงการและเลือกชุดคำถามเริ่มต้นสำหรับแบบสอบถามออนไลน์
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {portalMode === 'evaluation' ? (
              /* ========================================================
                  EVALUATION MODE: CREATE QUESTIONNAIRE FORM ONLY
              ======================================================== */
              <form onSubmit={handleCreateSurvey} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ชื่อแบบสอบถาม / โครงการที่ประเมิน *</label>
                  <input
                    type="text"
                    required
                    value={surveyTitle}
                    onChange={(e) => setSurveyTitle(e.target.value)}
                    placeholder="เช่น แบบประเมินความพึงพอใจ โครงการพัฒนาทักษะวิชาชีพดิจิทัล"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">คำอธิบายและวัตถุประสงค์แบบสอบถาม</label>
                  <textarea
                    rows={2}
                    value={surveyDescription}
                    onChange={(e) => setSurveyDescription(e.target.value)}
                    placeholder="เช่น เพื่อประเมินผลความพึงพอใจและนำข้อเสนอแนะไปปรับปรุงการจัดโครงการ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">รหัสโครงการอ้างอิง (ถ้ามี)</label>
                    <input
                      type="text"
                      value={surveyProjectRefCode}
                      onChange={(e) => setSurveyProjectRefCode(e.target.value)}
                      placeholder="เช่น PRJ-2569-001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">เป้าหมายจำนวนผู้ตอบ (คน)</label>
                    <input
                      type="number"
                      value={surveyTargetResponses}
                      onChange={(e) => setSurveyTargetResponses(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Survey Period */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>กำหนดการเปิดและปิดรับแบบสอบถาม</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">วันที่เริ่มเปิดรับ</label>
                      <input
                        type="date"
                        value={surveyStartDate}
                        onChange={(e) => setSurveyStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">วันที่สิ้นสุดการประเมิน</label>
                      <input
                        type="date"
                        value={surveyEndDate}
                        onChange={(e) => setSurveyEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Question Template Choice */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-700">เลือกชุดคำถามเริ่มต้น</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        surveyTemplate === 'standard'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value="standard"
                        checked={surveyTemplate === 'standard'}
                        onChange={() => setSurveyTemplate('standard')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">ชุดมาตรฐาน 3 ตอน</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          ข้อมูลทั่วไป, ความพึงพอใจ 5 ด้าน, ข้อเสนอแนะ
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        surveyTemplate === 'blank'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value="blank"
                        checked={surveyTemplate === 'blank'}
                        onChange={() => setSurveyTemplate('blank')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">แบบฟอร์มว่าง</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          เพิ่มและออกแบบข้อคำถามเองทั้งหมด
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    {creating ? 'กำลังสร้างแบบสอบถาม...' : 'สร้างและเริ่มออกแบบคำถาม'}
                  </button>
                </div>
              </form>
            ) : (
              /* ========================================================
                  REGISTER MODE: CREATE EVENT FORM
              ======================================================== */
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ชื่อกิจกรรม / หลักสูตรอบรม *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น โครงการอบรมการประยุกต์ใช้ AI ในการทำงาน"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">คำอธิบายกิจกรรมแบบย่อ</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ระบุวัตถุประสงค์หรือรายละเอียดกิจกรรมสั้นๆ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">รหัสโครงการอ้างอิง (ถ้ามี)</label>
                    <input
                      type="text"
                      value={projectRefCode}
                      onChange={(e) => setProjectRefCode(e.target.value)}
                      placeholder="เช่น PRJ-69-001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">จำนวนรับสูงสุด (0 = ไม่จำกัด)</label>
                    <input
                      type="number"
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">สถานที่จัดกิจกรรม</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="เช่น ห้องประชุมชงโค อาคารวิทยบริการ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">คำนำหน้าเลขที่เกียรติบัตร</label>
                    <input
                      type="text"
                      value={certPrefix}
                      onChange={(e) => setCertPrefix(e.target.value)}
                      placeholder="เช่น วอศ.ชร-2569"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Event Date & Time */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>กำหนดการวันและเวลาจัดกิจกรรม</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">วันที่เริ่มกิจกรรม *</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">วันที่สิ้นสุด (ถ้าจัดหลายวัน)</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">เวลาเริ่มกิจกรรม</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">เวลาสิ้นสุดกิจกรรม</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Period (Optional) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>ช่วงเวลารับลงทะเบียน (ทางเลือก)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">เปิดรับลงทะเบียนตั้งแต่</label>
                      <input
                        type="datetime-local"
                        value={regStart}
                        onChange={(e) => setRegStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">ปิดรับลงทะเบียนเมื่อ</label>
                      <input
                        type="datetime-local"
                        value={regEnd}
                        onChange={(e) => setRegEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    {creating ? 'กำลังบันทึก...' : 'สร้างกิจกรรม'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
