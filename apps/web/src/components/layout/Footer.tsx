'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Award, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/surveys') || pathname === '/install' || pathname?.startsWith('/events')) {
    return null;
  }
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-700 flex items-center justify-center text-white">
            <Award className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-700">
            Registration & Certificate Management System
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>ระบบประเมินความพึงพอใจและออกเกียรติบัตรออนไลน์</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> ตรวจสอบความถูกต้องได้ 100%
          </span>
        </div>
      </div>
    </footer>
  );
}
