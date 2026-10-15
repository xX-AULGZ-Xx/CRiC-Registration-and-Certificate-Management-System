'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Award,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkInstallStatus();
    loadEvents();
  }, []);

  const checkInstallStatus = async () => {
    try {
      const res = await fetchApi('/api/v1/install/status');
      if (res.success && res.data?.is_installed === false) {
        window.location.href = '/install';
      }
    } catch {
      // ignore
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/api/v1/events/public');
      if (res.success) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/certificates/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4 text-amber-300" />
            ระบบลงทะเบียน ประเมินผล และออกเกียรติบัตรออนไลน์ครบวงจร
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            ลงทะเบียนร่วมกิจกรรม & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
              รับเกียรติบัตรออนไลน์ทันที
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            สะดวกรวดเร็ว เข้าร่วมกิจกรรม เช็คชื่อด้วย QR Code ประเมินความพึงพอใจ พร้อมดาวน์โหลดเกียรติบัตรฉบับดิจิทัลที่มีระบบตรวจสอบความถูกต้องได้ตลอด 24 ชั่วโมง
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-white/20"
          >
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเกียรติบัตรด้วย เบอร์โทร หรือ เลขบัตรประชาชน..."
              className="w-full px-3 py-2.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition active:scale-95 whitespace-nowrap cursor-pointer"
            >
              ค้นหา
            </button>
          </form>

          {/* Feature Highlights */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">ลงทะเบียนง่าย</div>
                <div className="text-slate-300">กรอกข้อมูลรับ QR ทันที</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">รับเกียรติบัตรทันใจ</div>
                <div className="text-slate-300">ดาวน์โหลด PDF คมชัดสูง</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">ตรวจความถูกต้องได้</div>
                <div className="text-slate-300">สแกน QR ยืนยันเอกสารจริง</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events List Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              กิจกรรมและการอบรมที่เปิดรับ
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              เลือกกิจกรรมที่ต้องการเพื่อลงทะเบียนหรือทำแบบประเมินความพึงพอใจ
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">ยังไม่มีกิจกรรมที่เปิดรับในขณะนี้</h3>
            <p className="text-slate-400 text-sm mt-1">กรุณากลับมาตรวจสอบใหม่อีกครั้งในภายหลัง</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Banner or Header */}
                <div className="h-36 bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 p-5 flex flex-col justify-between text-white relative">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                      {evt.event_code || 'EVENT'}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        evt.status === 'OPEN'
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-slate-700/80 text-slate-200'
                      }`}
                    >
                      {evt.status === 'OPEN' ? 'เปิดรับลงทะเบียน' : 'ปิดรับสมัคร'}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-blue-100 font-medium line-clamp-1">
                      {evt.organizer?.organization || 'วิทยาลัยอาชีวศึกษาเชียงราย'}
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-2">
                      {evt.title}
                    </h3>

                    {evt.description && (
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      {evt.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>วันที่: {formatDate(evt.start_date)}</span>
                        </div>
                      )}
                      {evt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="line-clamp-1">{evt.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>
                          ผู้ลงทะเบียน: {evt._count?.attendees || 0}
                          {evt.max_attendees > 0 ? ` / ${evt.max_attendees}` : ''} คน
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Link
                      href={`/events/${evt.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white transition group-hover:bg-blue-700 group-hover:text-white"
                    >
                      <span>รายละเอียด & ลงทะเบียน</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
