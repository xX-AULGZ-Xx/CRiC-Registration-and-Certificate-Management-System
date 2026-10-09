'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Calendar,
  User,
  Building,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function CertificateVerifyPage() {
  const params = useParams();
  const certificateNo = decodeURIComponent((params.certificateNo as string) || '');

  const [verifyData, setVerifyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (certificateNo) {
      verifyCert();
    }
  }, [certificateNo]);

  const verifyCert = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/v1/certificates/verify/${encodeURIComponent(certificateNo)}`);
      if (res.success && res.valid) {
        setVerifyData(res.data);
      } else {
        setErrorMsg(res.message || 'ไม่พบข้อมูลเกียรติบัตรฉบับนี้ในระบบ');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถตรวจสอบเกียรติบัตรได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-semibold text-sm">กำลังตรวจสอบความถูกต้องของเกียรติบัตร...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      {/* Verification Card */}
      {verifyData ? (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
          {/* Status Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-800/60 text-emerald-100 text-xs font-bold mb-1">
                ระบบตรวจสอบเกียรติบัตรออนไลน์ (Verified Certificate)
              </span>
              <h1 className="text-xl sm:text-2xl font-black">
                เอกสารนี้ได้รับการรับรองความถูกต้อง
              </h1>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm">
              ออกอย่างถูกต้องผ่านระบบ Registration & Certificate Management System
            </p>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                เลขที่เกียรติบัตร
              </div>
              <div className="text-lg sm:text-xl font-mono font-black text-slate-900 mt-1">
                {verifyData.certificate_no}
              </div>
            </div>

            <div className="space-y-4 text-sm divide-y divide-slate-100">
              <div className="pt-3 flex items-start justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> ผู้ได้รับเกียรติบัตร
                </span>
                <span className="font-bold text-slate-900 text-right">
                  {verifyData.full_name}
                </span>
              </div>

              {verifyData.organization && (
                <div className="pt-3 flex items-start justify-between gap-4">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Building className="w-4 h-4 text-teal-600" /> หน่วยงาน / สังกัด
                  </span>
                  <span className="font-semibold text-slate-800 text-right">
                    {verifyData.organization}
                  </span>
                </div>
              )}

              <div className="pt-3 flex items-start justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" /> โครงการ / กิจกรรม
                </span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">
                  {verifyData.event_title}
                </span>
              </div>

              <div className="pt-3 flex items-start justify-between gap-4">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" /> วันที่ออกเอกสาร
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {formatDate(verifyData.issue_date)}
                </span>
              </div>

              {verifyData.organizer && (
                <div className="pt-3 flex items-start justify-between gap-4">
                  <span className="text-slate-500">หน่วยงานผู้ออกเกียรติบัตร</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {verifyData.organizer.organization || 'วิทยาลัยอาชีวศึกษาเชียงราย'}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full font-bold">
                <CheckCircle className="w-4 h-4" /> ตรวจสอบลายมือชื่อและข้อมูลตรงกับฐานข้อมูลระบบ
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">ไม่สามารถยืนยันความถูกต้องได้</h2>
          <p className="text-slate-500 text-sm">{errorMsg}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
