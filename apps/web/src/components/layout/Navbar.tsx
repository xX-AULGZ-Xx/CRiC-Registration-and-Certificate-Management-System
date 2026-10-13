'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, Calendar, Search, ShieldCheck, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [brandLogo, setBrandLogo] = useState<string>('');
  const [brandNameTh, setBrandNameTh] = useState<string>('ระบบลงทะเบียนและออกเกียรติบัตร');
  const [brandNameEn, setBrandNameEn] = useState<string>('Registration & Certificate Management System');

  if (pathname?.startsWith('/surveys')) {
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
          <Link href="/" className="flex items-center gap-3 group">
            {brandLogo ? (
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brandLogo}
                  alt={brandNameTh}
                  className="w-10 h-10 object-contain"
                  onError={() => setBrandLogo('')}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition shrink-0">
                <Award className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight line-clamp-1">
                {brandNameTh}
              </div>
              <div className="text-[11px] text-slate-500 font-medium line-clamp-1">
                {brandNameEn}
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 transition"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">กิจกรรมทั้งหมด</span>
            </Link>

            <Link
              href="/certificates/search"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-700 hover:bg-teal-50/70 transition"
            >
              <Search className="w-4 h-4 text-teal-600" />
              <span>ค้นหาเกียรติบัตร</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">แดชบอร์ด</span>
                </Link>
                {currentUser.role === 'ADMIN' && (
                  <Link
                    href="/dashboard/admin/settings"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition"
                    title="ตั้งค่าระบบส่วนกลาง (Admin Settings)"
                  >
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">ตั้งค่าระบบ</span>
                  </Link>
                )}

                {/* Profile Pill */}
                <div
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100/80 border border-slate-200/70 text-slate-700"
                  title={`เข้าสู่ระบบในชื่อ: ${currentUser.full_name || currentUser.username}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {currentUser.full_name
                      ? currentUser.full_name.trim().charAt(0).toUpperCase()
                      : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-none py-0.5">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[130px]">
                      {currentUser.full_name || currentUser.username}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {currentUser.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : (currentUser.position || 'ผู้จัดกิจกรรม')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pl-2 border-l border-slate-200">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition active:scale-95"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบผู้จัด</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
