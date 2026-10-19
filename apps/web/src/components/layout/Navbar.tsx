'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, Calendar, Search, ShieldCheck, User, LogOut, LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [brandLogo, setBrandLogo] = useState<string>('');
  const [brandNameTh, setBrandNameTh] = useState<string>('ระบบลงทะเบียนและออกเกียรติบัตร');
  const [brandNameEn, setBrandNameEn] = useState<string>('Registration & Certificate Management System');

  if (pathname?.startsWith('/surveys') || pathname === '/install' || pathname?.startsWith('/events')) {
    return null;
  }

  const updateFavicon = (url: string) => {
    if (!url) return;
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = url;
    } catch {
      // ignore
    }
  };

  const loadBrandSettings = async () => {
    try {
      const res = await fetchApi('/api/v1/system/public-settings');
      if (res.success && res.data) {
        if (res.data.org_logo_url) {
          setBrandLogo(res.data.org_logo_url);
          updateFavicon(res.data.org_logo_url);
        }
        if (res.data.org_name_th) setBrandNameTh(res.data.org_name_th);
        if (res.data.org_name_en) setBrandNameEn(res.data.org_name_en);
      }
    } catch (err) {
      console.warn('Failed to load brand settings:', err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        // ignore
      }
    }

    loadBrandSettings();

    const handleBrandUpdate = (e: any) => {
      if (e.detail) {
        setBrandLogo(e.detail);
        updateFavicon(e.detail);
      } else {
        loadBrandSettings();
      }
    };

    window.addEventListener('system-brand-updated', handleBrandUpdate);
    return () => {
      window.removeEventListener('system-brand-updated', handleBrandUpdate);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on navigation
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink min-w-0">
            {brandLogo ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brandLogo}
                  alt={brandNameTh}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  onError={() => setBrandLogo('')}
                />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm sm:text-base lg:text-lg leading-tight tracking-tight truncate max-w-[150px] xs:max-w-[190px] sm:max-w-[280px] md:max-w-none">
                {brandNameTh}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[150px] xs:max-w-[190px] sm:max-w-[280px] md:max-w-none hidden xs:block">
                {brandNameEn}
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 transition"
              title="กิจกรรมทั้งหมด"
            >
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="hidden md:inline">กิจกรรมทั้งหมด</span>
            </Link>

            <Link
              href="/certificates/search"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-700 hover:bg-teal-50/70 transition"
              title="ค้นหาเกียรติบัตร"
            >
              <Search className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="hidden sm:inline">ค้นหาเกียรติบัตร</span>
            </Link>

            {currentUser ? (
              <div className="relative pl-1.5 sm:pl-2 border-l border-slate-200" ref={dropdownRef}>
                {/* Profile Trigger Button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border text-slate-700 transition cursor-pointer select-none ${
                    dropdownOpen
                      ? 'bg-blue-50/80 border-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 border-slate-200/70'
                  }`}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    {currentUser.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name || currentUser.username}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : currentUser.full_name ? (
                      currentUser.full_name.trim().charAt(0).toUpperCase()
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-none py-0.5">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[110px] md:max-w-[130px]">
                      {currentUser.full_name || currentUser.username}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {currentUser.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : (currentUser.position || 'ผู้จัดกิจกรรม')}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu Popup */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Header in Dropdown */}
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                        {currentUser.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={currentUser.avatar_url}
                            alt={currentUser.full_name || currentUser.username}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : currentUser.full_name ? (
                          currentUser.full_name.trim().charAt(0).toUpperCase()
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {currentUser.full_name || currentUser.username}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {currentUser.email || currentUser.username}
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                          {currentUser.role === 'ADMIN' ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>ผู้ดูแลระบบ (Admin)</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>ผู้จัดกิจกรรม (Organizer)</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/80 transition active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                        <span>แดชบอร์ด</span>
                      </Link>

                      {currentUser.role === 'ADMIN' && (
                        <Link
                          href="/dashboard/admin/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 transition active:scale-[0.98]"
                        >
                          <Settings className="w-4 h-4 text-blue-600" />
                          <span>ตั้งค่าระบบส่วนกลาง</span>
                        </Link>
                      )}
                    </div>

                    {/* Sign out */}
                    <div className="pt-1.5 mt-1 border-t border-slate-100 p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition active:scale-[0.98]"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pl-1.5 sm:pl-2 border-l border-slate-200">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition active:scale-95"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">เข้าสู่ระบบผู้จัด</span>
                  <span className="xs:hidden">เข้าสู่ระบบ</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
