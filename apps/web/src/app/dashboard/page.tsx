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
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function DashboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // New Event Form
  const [title, setTitle] = useState('');
  const [projectRefCode, setProjectRefCode] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('100');
  const [certPrefix, setCertPrefix] = useState('วอศ.ชร-2569');

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
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/api/v1/events');
      if (res.success) {
        setEvents(res.data);
      }
    } catch (err) {
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
          project_ref_code: projectRefCode.trim() || undefined,
          location: location.trim() || undefined,
          start_date: startDate ? new Date(startDate).toISOString() : undefined,
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
        setProjectRefCode('');
        setLocation('');
        loadEvents();
      }
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถสร้างกิจกรรมได้');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมนี้? ข้อมูลผู้ลงทะเบียนทั้งหมดจะถูกลบไปด้วย')) return;

    try {
      await fetchApi(`/api/v1/events/${id}`, { method: 'DELETE' });
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบกิจกรรม');
    }
  };

  // Stats calculation
  const totalEvents = events.length;
  const totalAttendees = events.reduce((sum, e) => sum + (e._count?.attendees || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              ระบบจัดการกิจกรรมและเกียรติบัตร
            </h1>
            {currentUser && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                <User className="w-3.5 h-3.5" />
                <span>{currentUser.full_name || currentUser.username}</span>
                <span className="text-[10px] text-blue-500 font-medium">
                  ({currentUser.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้จัด'})
                </span>
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            สร้างกิจกรรม จัดการผู้ลงทะเบียน เช็คชื่อหน้างาน และออกแบบเกียรติบัตร
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {currentUser?.role === 'ADMIN' && (
            <Link
              href="/dashboard/admin/settings"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer shrink-0"
              title="ตั้งค่าระบบส่วนกลาง"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span>ตั้งค่าระบบ</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างกิจกรรมใหม่</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
      </div>

      {/* Events Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">รายการกิจกรรมของคุณ</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {events.length} กิจกรรม
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">กำลังโหลดรายการกิจกรรม...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-base font-bold text-slate-700">ยังไม่มีกิจกรรมที่สร้าง</div>
            <p className="text-xs text-slate-400">คลิกที่ปุ่ม &quot;สร้างกิจกรรมใหม่&quot; เพื่อเริ่มต้น</p>
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
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                      {evt.event_code}
                    </span>
                    {evt.project_ref_code && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        โครงการ: {evt.project_ref_code}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        evt.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {evt.status === 'OPEN' ? 'เปิดรับลงทะเบียน' : 'ปิดรับสมัคร'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    <Link
                      href={`/dashboard/events/${evt.id}`}
                      className="hover:text-blue-700 transition"
                    >
                      {evt.title}
                    </Link>
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4">
                    {evt.location && <span>สถานที่: {evt.location}</span>}
                    <span>ผู้ลงทะเบียน: {evt._count?.attendees || 0} คน</span>
                    <span>ผู้ตอบแบบประเมิน: {evt.evaluation_form?._count?.responses || 0} คน</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/events/${evt.id}`}
                    target="_blank"
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                    title="เปิดหน้าลงทะเบียนสาธารณะ"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/dashboard/events/${evt.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    <Settings className="w-4 h-4" />
                    <span>จัดการกิจกรรม</span>
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteEvent(evt.id, e)}
                    className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                    title="ลบกิจกรรม"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">สร้างกิจกรรม / การอบรมใหม่</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">วันที่จัดกิจกรรม</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
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

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition"
                >
                  {creating ? 'กำลังบันทึก...' : 'สร้างกิจกรรม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
