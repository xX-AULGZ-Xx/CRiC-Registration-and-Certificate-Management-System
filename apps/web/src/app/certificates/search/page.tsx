'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Award,
  Calendar,
  User,
  ShieldCheck,
  FileDown,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<{ events: any[]; certificates: any[] }>({
    events: [],
    certificates: [],
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQ.trim().length >= 3) {
      executeSearch(initialQ.trim());
    }
  }, [initialQ]);

  // Debounced search suggestions
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions({ events: [], certificates: [] });
      setLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const res = await fetchApi(`/api/v1/certificates/suggestions?query=${encodeURIComponent(query.trim())}`);
        if (res.success && res.data) {
          setSuggestions(res.data);
          setShowSuggestions(true);
        }
      } catch {
        // ignore
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = async (q: string) => {
    if (!q || q.length < 3) {
      setErrorMsg('กรุณากรอกคำค้นหาอย่างน้อย 3 ตัวอักษร');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchApi(`/api/v1/certificates/search?query=${encodeURIComponent(q)}`);
      if (res.success) {
        setResults(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการค้นหา');
      setResults([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query.trim());
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title & Search Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
          <Search className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          ค้นหาและดาวน์โหลดเกียรติบัตรออนไลน์
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          ค้นหาเกียรติบัตรของคุณด้วย เบอร์โทรศัพท์ หรือชื่อ-นามสกุล
        </p>

        {/* Search Form with Suggestions */}
        <div ref={searchContainerRef} className="relative max-w-xl mx-auto pt-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 relative z-20">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!showSuggestions && e.target.value.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onFocus={() => {
                  if (query.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                placeholder="กรอกเบอร์โทรศัพท์ หรือชื่อ-นามสกุล..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-xs pr-9"
              />
              {loadingSuggestions && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                </div>
              )}
              {query && !loadingSuggestions && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSuggestions({ events: [], certificates: [] });
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
            </button>
          </form>

          {/* Suggestions Dropdown Panel */}
          {showSuggestions && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-30 text-left max-h-[420px] overflow-y-auto divide-y divide-slate-100">
              {/* Certificates Suggestions */}
              {suggestions.certificates && suggestions.certificates.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-teal-600" />
                    <span>เกียรติบัตรที่พบ ({suggestions.certificates.length})</span>
                  </div>
                  <div className="space-y-0.5">
                    {suggestions.certificates.map((cert: any) => (
                      <Link
                        key={cert.id}
                        href={`/certificates/${cert.id}/view`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/70 transition group text-slate-800"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-teal-800 truncate flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cert.title_name || ''}{cert.full_name}</span>
                            {cert.organization && (
                              <span className="text-xs font-normal text-slate-400 truncate">({cert.organization})</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-teal-700 font-semibold">{cert.certificate_no}</span>
                            {cert.event?.title && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[220px] text-slate-400">{cert.event.title}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-teal-700 opacity-0 group-hover:opacity-100 transition">
                          <span>เปิดเกียรติบัตร</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

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
                            <span className="font-mono text-slate-400">{evt.event_code}</span>
                            {evt.start_date && (
                              <>
                                <span>•</span>
                                <span>{formatDate(evt.start_date)}</span>
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

              {/* Search Direct Action */}
              <div className="p-2 bg-slate-50/90">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false);
                    executeSearch(query.trim());
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-teal-700 hover:bg-teal-100/60 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    <span>ค้นหาเกียรติบัตรทั้งหมดด้วย: &quot;{query}&quot;</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">กำลังค้นหาข้อมูลเกียรติบัตร...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">ไม่พบเกียรติบัตรที่ตรงกับข้อมูล</h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            กรุณาตรวจสอบความถูกต้องของเบอร์โทรศัพท์ หรือเลขประจำตัวประชาชนที่ใช้ลงทะเบียน
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((att) => (
            <div
              key={att.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold">
                    เลขที่: {att.certificate_no}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> ตรวจสอบแล้ว
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {att.title_name || ''}{att.full_name}
                </h3>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-medium text-slate-800">
                    โครงการ: {att.event?.title || '-'}
                  </div>
                  {att.event?.start_date && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>วันที่จัดกิจกรรม: {formatDate(att.event.start_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                <Link
                  href={`/certificates/${att.id}/view`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition active:scale-95"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>ดูและบันทึกเกียรติบัตร</span>
                </Link>

                <Link
                  href={`/certificates/verify/${encodeURIComponent(att.certificate_no)}`}
                  target="_blank"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>หน้าตรวจสอบเอกสาร</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CertificateSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-500 text-xs">กำลังโหลด...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
