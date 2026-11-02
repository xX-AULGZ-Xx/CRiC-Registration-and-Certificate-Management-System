'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, AlertCircle, RefreshCw, ArrowLeft, LogIn } from 'lucide-react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setErrorMsg(errorDescription || `การยืนยันตัวตนล้มเหลว (${error})`);
      setLoading(false);
      return;
    }

    if (!code) {
      setErrorMsg('ไม่พบ Authorization Code จากระบบยืนยันตัวตนกลาง (Keycloak SSO)');
      setLoading(false);
      return;
    }

    const processCallback = async () => {
      try {
        const redirectUri = window.location.origin + '/auth/callback';
        const res = await fetchApi('/api/v1/auth/sso/callback', {
          method: 'POST',
          body: JSON.stringify({
            code,
            redirectUri,
          }),
        });

        if (res.success && res.data?.token) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          // Redirect to dashboard
          window.location.href = '/dashboard';
        } else {
          setErrorMsg(res.message || 'ไม่สามารถยืนยันตัวตนกับระบบกลางได้');
          setLoading(false);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
          {loading ? (
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          ) : errorMsg ? (
            <AlertCircle className="w-8 h-8 text-rose-500" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {loading
              ? 'กำลังยืนยันตัวตนกับ CRIC Single Sign-On'
              : errorMsg
              ? 'เข้าสู่ระบบไม่สำเร็จ'
              : 'เข้าสู่ระบบสำเร็จ กำลังนำเข้าสู่ระบบ...'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {loading
              ? 'ระบบกำลังตรวจสอบสิทธิ์การใช้งานและซิงค์ข้อมูลบัญชีผู้ใช้งาน (Keycloak OIDC)'
              : errorMsg
              ? errorMsg
              : 'กรุณารอสักครู่ ระบบกำลังนำท่านเข้าสู่ Dashboard...'}
          </p>
        </div>

        {errorMsg && (
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>กลับไปหน้าเข้าสู่ระบบ</span>
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าแรก</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
