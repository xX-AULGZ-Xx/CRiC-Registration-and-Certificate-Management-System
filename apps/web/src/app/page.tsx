'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Award,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  ChevronRight,
  User,
  X,
  Loader2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Search suggestion state
  const [suggestions, setSuggestions] = useState<{ events: any[]; certificates: any[] }>({
    events: [],
    certificates: [],
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkInstallStatus();
    loadEvents();
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions({ events: [], certificates: [] });
      setLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const res = await fetchApi(`/api/v1/certificates/suggestions?query=${encodeURIComponent(searchQuery.trim())}`);
        if (res.success && res.data) {
          setSuggestions(res.data);
          setShowSuggestions(true);
        }
      } catch {
        // ignore suggestion fetch error
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

          {/* Search Box with Autocomplete Suggestions */}
          <div ref={searchContainerRef} className="relative max-w-xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-white/20 relative z-20"
            >
              <div className="pl-3 text-slate-400">
                {loadingSuggestions ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!showSuggestions && e.target.value.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                placeholder="ค้นหาเกียรติบัตรด้วย เบอร์โทร หรือ เลขบัตรประชาชน..."
                className="w-full px-3 py-2.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions({ events: [], certificates: [] });
                    setShowSuggestions(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition active:scale-95 whitespace-nowrap cursor-pointer"
              >
                ค้นหา
              </button>
            </form>

            {/* Suggestions Dropdown Panel */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-30 text-left max-h-[440px] overflow-y-auto divide-y divide-slate-100">
                {/* Events Suggestions */}
                {suggestions.events && suggestions.events.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>กิจกรรมที่เกี่ยวข้อง ({suggestions.events.length})</span>
                    </div>
                    <div className="space-y-0.5">
                      {suggestions.events.map((evt: any) => (
                        <Link
                          key={evt.id}
                          href={`/events/${evt.id}`}
                          onClick={() => setShowSuggestions(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 transition group text-slate-800"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 truncate">
                              {evt.title}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-slate-400 font-medium">{evt.event_code}</span>
                              {evt.start_date && (
                                <>
                                  <span>•</span>
                                  <span>{formatDate(evt.start_date)}</span>
                                </>
                              )}
                              {evt.location && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{evt.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                            <span>ดูข้อมูล</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificates Suggestions */}
                {suggestions.certificates && suggestions.certificates.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>เกียรติบัตรที่พบ ({suggestions.certificates.length})</span>
                    </div>
                    <div className="space-y-0.5">
                      {suggestions.certificates.map((cert: any) => (
                        <Link
                          key={cert.id}
                          href={`/certificates/${cert.id}/view`}
                          onClick={() => setShowSuggestions(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/70 transition group text-slate-800"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="text-sm font-bold text-slate-900 group-hover:text-amber-800 truncate flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{cert.title_name || ''}{cert.full_name}</span>
                              {cert.organization && (
                                <span className="text-xs font-normal text-slate-400 truncate">({cert.organization})</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-amber-700 font-semibold">{cert.certificate_no}</span>
                              {cert.event?.title && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[220px] text-slate-400">{cert.event.title}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-700 opacity-0 group-hover:opacity-100 transition">
                            <span>เปิดเกียรติบัตร</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State / Search Fallback */}
                {suggestions.events?.length === 0 && suggestions.certificates?.length === 0 && !loadingSuggestions && (
                  <div className="p-4 text-center text-xs text-slate-500">
                    ไม่พบคำแนะนำตรงตัวสำหรับ <span className="font-semibold text-slate-800">&quot;{searchQuery}&quot;</span>
                  </div>
                )}

                {/* Action: Search all certificates */}
                <div className="p-2 bg-slate-50/90">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuggestions(false);
                      window.location.href = `/certificates/search?q=${encodeURIComponent(searchQuery.trim())}`;
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-100/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" />
                      <span>ค้นหาเกียรติบัตรทั้งหมดด้วย: &quot;{searchQuery}&quot;</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

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
                      {evt.start_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            เวลา: {evt.start_time}
                            {evt.end_time ? ` - ${evt.end_time}` : ''} น.
                          </span>
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
