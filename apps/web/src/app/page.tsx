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
  Star,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getRegistrationTheme } from '@/lib/registration-config';

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  // Portal Mode: 'register' | 'evaluation'
  const [portalMode, setPortalMode] = useState<'register' | 'evaluation'>('register');

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

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const modeParam = searchParams.get('mode');
      if (modeParam === 'evaluation') {
        setPortalMode('evaluation');
        loadEvents('evaluation');
      } else if (modeParam === 'register') {
        setPortalMode('register');
        loadEvents('register');
      } else {
        const saved = localStorage.getItem('portal_mode');
        if (saved === 'evaluation' || saved === 'register') {
          setPortalMode(saved);
          loadEvents(saved);
        } else {
          loadEvents('register');
        }
      }
    } else {
      loadEvents();
    }

    const handleModeChange = (e: any) => {
      if (e.detail && (e.detail === 'register' || e.detail === 'evaluation')) {
        setPortalMode(e.detail);
        loadEvents(e.detail, true);
      }
    };
    window.addEventListener('portal-mode-changed', handleModeChange);
    return () => window.removeEventListener('portal-mode-changed', handleModeChange);
  }, []);

  // Detect ?logout=1 and show toast notification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('logout') === '1') {
        setShowLogoutToast(true);
        params.delete('logout');
        const remainingQuery = params.toString() ? `?${params.toString()}` : '';
        window.history.replaceState(null, '', window.location.pathname + remainingQuery);
        const timer = setTimeout(() => {
          setShowLogoutToast(false);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
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
        const res = await fetchApi(`/api/v1/certificates/suggestions?mode=${portalMode}&query=${encodeURIComponent(searchQuery.trim())}`);
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
  }, [searchQuery, portalMode]);

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

  const loadEvents = async (targetMode?: string, silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const m = targetMode || portalMode;
      const res = await fetchApi(`/api/v1/events/public?mode=${m}`);
      if (res.success) {
        setEvents(res.data);
      }
    } catch (err) {
      console.warn('Could not load events:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const displayedEvents = events.filter((evt) => {
    const regCfg = evt.registration_config || {};
    const certCfg = evt.certificate_config || {};
    const isEvalOnly = regCfg.is_evaluation_only === true || regCfg.has_registration === false;
    const hasReg = !isEvalOnly;
    const hasEval = !!evt.evaluation_form || certCfg.require_evaluation === true || regCfg.has_evaluation === true;

    if (portalMode === 'evaluation') {
      return hasEval;
    } else {
      return hasReg;
    }
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (portalMode === 'register') {
        window.location.href = `/certificates/search?q=${encodeURIComponent(searchQuery.trim())}`;
      } else {
        setShowSuggestions(false);
      }
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
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-slate-900 text-white pt-8 pb-10 sm:pt-16 sm:pb-20 px-3 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,var(--color-primary),transparent_60%)] opacity-30" />
        <div className="relative max-w-5xl mx-auto text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs sm:text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span className="truncate max-w-[280px] xs:max-w-none">
              {portalMode === 'evaluation'
                ? 'ระบบแบบประเมินความพึงพอใจโครงการออนไลน์'
                : 'ระบบลงทะเบียนเข้าร่วมกิจกรรมและรับเกียรติบัตรออนไลน์'}
            </span>
          </div>

          <h1 className="text-2xl xs:text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {portalMode === 'evaluation' ? (
              <>
                แบบประเมินความพึงพอใจโครงการ & <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-blue-200 to-teal-300">
                  ระบบประเมินออนไลน์
                </span>
              </>
            ) : (
              <>
                ลงทะเบียนเข้าร่วมกิจกรรม & <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
                  รับเกียรติบัตรอิเล็กทรอนิกส์
                </span>
              </>
            )}
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-xs sm:text-base leading-relaxed px-2">
            {portalMode === 'evaluation'
              ? 'ทำแบบประเมินความพึงพอใจโครงการ เพื่อนำข้อมูลและข้อเสนอแนะไปพัฒนาการดำเนินงาน'
              : 'ระบบลงทะเบียนกิจกรรม ตรวจสอบการเข้าร่วมด้วยรหัส QR และบริการดาวน์โหลดเกียรติบัตรอิเล็กทรอนิกส์'}
          </p>

          {/* Search Box with Autocomplete Suggestions */}
          <div ref={searchContainerRef} className="relative max-w-xl mx-auto px-1 sm:px-0">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-white rounded-2xl p-1 sm:p-1.5 shadow-2xl border border-white/20 relative z-20"
            >
              <div className="pl-2.5 sm:pl-3 text-slate-400">
                {loadingSuggestions ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-600" />
                ) : (
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
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
                placeholder={
                  portalMode === 'evaluation'
                    ? 'ค้นหาแบบประเมินด้วยชื่อ หรือรหัส...'
                    : 'ค้นหาเกียรติบัตรด้วย เบอร์โทร หรือ เลขบัตร...'
                }
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions({ events: [], certificates: [] });
                    setShowSuggestions(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 mr-0.5 sm:mr-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 whitespace-nowrap cursor-pointer bg-blue-700 hover:bg-blue-800 shrink-0"
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
                      <span>
                        {portalMode === 'evaluation'
                          ? `แบบประเมินที่เกี่ยวข้อง (${suggestions.events.length})`
                          : `กิจกรรมที่เกี่ยวข้อง (${suggestions.events.length})`}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {suggestions.events.map((evt: any) => (
                        <Link
                          key={evt.id}
                          href={portalMode === 'evaluation' ? `/surveys/${evt.id}` : `/events/${evt.id}`}
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
                            <span>{portalMode === 'evaluation' ? 'ทำแบบประเมิน' : 'ดูข้อมูล'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificates Suggestions (Only for register mode) */}
                {portalMode === 'register' && suggestions.certificates && suggestions.certificates.length > 0 && (
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

                {/* Empty State */}
                {suggestions.events?.length === 0 && (!suggestions.certificates || suggestions.certificates?.length === 0) && !loadingSuggestions && (
                  <div className="p-4 text-center text-xs text-slate-500">
                    ไม่พบข้อมูลที่ตรงกับ <span className="font-semibold text-slate-800">&quot;{searchQuery}&quot;</span>
                  </div>
                )}

                {/* Action: Search all certificates (Register Mode Only) */}
                {portalMode === 'register' && (
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
                )}
              </div>
            )}
          </div>

          {/* Feature Highlights */}
          <div className="pt-4 sm:pt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 max-w-3xl mx-auto text-left">
            {portalMode === 'evaluation' ? (
              <>
                <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 shrink-0">
                    <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">ทำแบบประเมินออนไลน์</div>
                    <div className="text-slate-300 text-[11px] sm:text-xs">รองรับการใช้งานผ่านคอมพิวเตอร์และสมาร์ตโฟน</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 shrink-0">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">ประเมินผลตามเกณฑ์</div>
                    <div className="text-slate-300 text-[11px] sm:text-xs">ครอบคลุมตามมาตรฐานตัวชี้วัดโครงการ</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">วิเคราะห์ข้อมูลสถิติ</div>
                    <div className="text-slate-300 text-[11px] sm:text-xs">สรุปผลการประเมินและจัดเก็บข้อมูลอย่างปลอดภัย</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 shrink-0">
                    <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">บันทึกข้อมูลลงทะเบียน</div>
                    <div className="text-slate-300 text-[11px] sm:text-xs">รับรหัส QR สำหรับเช็คชื่อหน้างาน</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 shrink-0">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">ดาวน์โหลดเกียรติบัตร</div>
                    <div className="text-slate-300 text-[11px] sm:text-xs">เอกสารรับรองรูปแบบ PDF ความละเอียดมาตรฐาน</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-white">ตรวจสอบความถูกต้อง</div>
                    <div className="text-slate-300 text-[11px] sm:text-xs">ตรวจสอบความถูกต้องของเอกสารผ่านรหัส QR</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Events List Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
              {portalMode === 'evaluation' ? (
                <>
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 fill-blue-600" />
                  <span>แบบประเมินความพึงพอใจโครงการ</span>
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  <span>กิจกรรมและการอบรมที่เปิดรับลงทะเบียน</span>
                </>
              )}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
              {portalMode === 'evaluation'
                ? 'เลือกโครงการที่คุณเข้าร่วมเพื่อตอบแบบประเมินความพึงพอใจ'
                : 'เลือกกิจกรรมที่ต้องการเพื่อกรอกข้อมูลลงทะเบียนเข้าร่วมงาน'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-bold text-slate-700">
              {portalMode === 'evaluation' ? 'ยังไม่มีแบบประเมินที่เปิดรับในขณะนี้' : 'ยังไม่มีกิจกรรมที่เปิดรับในขณะนี้'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">กรุณากลับมาตรวจสอบใหม่อีกครั้งในภายหลัง</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedEvents.map((evt) => {
              const regCfg = evt.registration_config || {};
              const certCfg = evt.certificate_config || {};
              const isEvalOnly = regCfg.is_evaluation_only === true || regCfg.has_registration === false;
              const hasReg = !isEvalOnly;
              const hasEval = !!evt.evaluation_form || certCfg.require_evaluation === true || regCfg.has_evaluation === true;
              const hasBoth = hasReg && hasEval;

              return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Banner or Header */}
                {evt.banner_url ? (
                  <div className="relative w-full bg-slate-100 overflow-hidden">
                    <img
                      src={evt.banner_url}
                      alt={evt.title}
                      className="w-full h-auto block"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/55 p-3.5 sm:p-4 flex flex-col justify-between text-white pointer-events-none">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] sm:text-xs font-semibold">
                          {evt.event_code || 'EVENT'}
                        </span>
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          {hasBoth && (
                            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-black/45 text-white backdrop-blur-xs">
                              ลงทะเบียน & ประเมิน
                            </span>
                          )}
                          <span
                            className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold shadow-sm ${
                              portalMode === 'evaluation'
                                ? 'bg-blue-600/95 text-white'
                                : evt.status === 'OPEN'
                                ? 'bg-emerald-500/95 text-white'
                                : 'bg-slate-700/90 text-slate-200'
                            }`}
                          >
                            {portalMode === 'evaluation'
                              ? 'เปิดรับแบบประเมิน'
                              : evt.status === 'OPEN'
                              ? 'เปิดรับลงทะเบียน'
                              : 'ปิดรับสมัคร'}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] sm:text-xs text-white/95 font-medium line-clamp-1 drop-shadow-sm">
                        {evt.organizer?.organization || 'วิทยาลัยอาชีวศึกษาเชียงราย'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`h-28 sm:h-36 p-4 sm:p-5 flex flex-col justify-between text-white relative transition-colors ${
                      portalMode === 'evaluation'
                        ? 'bg-gradient-to-tr from-blue-900 via-blue-800 to-slate-800'
                        : regCfg.themeColorId
                        ? `bg-gradient-to-r ${getRegistrationTheme(regCfg.themeColorId).headerGradient}`
                        : 'bg-gradient-to-tr from-blue-700 via-blue-600 to-teal-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-semibold">
                        {evt.event_code || 'EVENT'}
                      </span>
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        {hasBoth && (
                          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-white/25 text-white backdrop-blur-xs">
                            ลงทะเบียน & ประเมิน
                          </span>
                        )}
                        <span
                          className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${
                            portalMode === 'evaluation'
                              ? 'bg-blue-600/90 text-white'
                              : evt.status === 'OPEN'
                              ? 'bg-emerald-500/90 text-white'
                              : 'bg-slate-700/80 text-slate-200'
                          }`}
                        >
                          {portalMode === 'evaluation'
                            ? 'เปิดรับแบบประเมิน'
                            : evt.status === 'OPEN'
                            ? 'เปิดรับลงทะเบียน'
                            : 'ปิดรับสมัคร'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] sm:text-xs text-blue-100 font-medium line-clamp-1">
                        {evt.organizer?.organization || 'วิทยาลัยอาชีวศึกษาเชียงราย'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Body Content */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div className="space-y-2.5 sm:space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-2">
                      {evt.title}
                    </h3>

                    {evt.description && (
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    <div className="space-y-1.5 sm:space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
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
                      {portalMode === 'register' && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            ผู้ลงทะเบียน: {evt._count?.attendees || 0}
                            {evt.max_attendees > 0 ? ` / ${evt.max_attendees}` : ''} คน
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {portalMode === 'evaluation' ? (
                      <Link
                        href={`/surveys/${evt.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-700 hover:bg-blue-800 text-white shadow-md transition active:scale-98"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>ทำแบบประเมินความพึงพอใจ</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/events/${evt.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-700 text-white hover:bg-blue-800 shadow-md transition active:scale-98"
                      >
                        <span>รายละเอียด & ลงทะเบียน</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </section>

      {/* Logout Toast Notification */}
      {showLogoutToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>ออกจากระบบเรียบร้อยแล้ว</span>
        </div>
      )}
    </div>
  );
}
