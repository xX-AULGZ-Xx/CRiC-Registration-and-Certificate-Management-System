'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Lock, User, AlertCircle, CheckCircle2, Info, ArrowRight, Shield, ExternalLink } from 'lucide-react';
import { fetchApi } from '@/lib/api';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // System Branding & Google SSO State
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(true);
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [orgNameTh, setOrgNameTh] = useState('ระบบลงทะเบียนและออกเกียรติบัตร');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Load public system settings on mount
  useEffect(() => {
    const checkInstall = async () => {
      try {
        const res = await fetchApi('/api/v1/install/status');
        if (res.success && res.data?.is_installed === false) {
          router.replace('/install');
        }
      } catch {
        // ignore
      }
    };
    checkInstall();

    const loadPublicSettings = async () => {
      try {
        const res = await fetchApi('/api/v1/system/public-settings');
        if (res.success && res.data) {
          if (res.data.google_client_id) setGoogleClientId(res.data.google_client_id.trim());
          if (res.data.google_login_enabled !== undefined) setGoogleLoginEnabled(res.data.google_login_enabled);
          if (res.data.org_logo_url) setOrgLogoUrl(res.data.org_logo_url);
          if (res.data.org_name_th) setOrgNameTh(res.data.org_name_th);
        }
      } catch (err) {
        console.warn('Could not fetch public settings:', err);
      }
    };
    loadPublicSettings();
  }, [router]);

  // Initialize Google Identity Services when Client ID is available
  useEffect(() => {
    if (!googleClientId || !googleLoginEnabled) return;

    const scriptId = 'google-gsi-client-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'pill',
            locale: 'th',
          });
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleGSI;
      document.body.appendChild(script);
    } else {
      initGoogleGSI();
    }
  }, [googleClientId, googleLoginEnabled]);

  // Handle Google Credential Response from GIS
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;

    setGoogleLoading(true);
    setErrorMsg('');
    try {
      // Decode picture from Google JWT credential directly as an instant fallback
      let clientPicture: string | null = null;
      try {
        const parts = response.credential.split('.');
        if (parts.length === 3) {
          const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payloadJson.picture) clientPicture = payloadJson.picture;
        }
      } catch {
        // ignore decode error
      }

      const res = await fetchApi('/api/v1/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: response.credential }),
      });

      if (res.success && res.data?.token) {
        const userData = {
          ...res.data.user,
          avatar_url: res.data.user?.avatar_url || clientPicture || null,
        };
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        window.location.href = '/dashboard';
      } else {
        setErrorMsg(res.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Standard Username / Password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      if (res.success && res.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.location.href = '/dashboard';
      } else {
        setErrorMsg(res.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  // Fallback click handler if Google Client ID is not yet configured
  const handleGoogleButtonClick = () => {
    if (googleClientId) {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt();
      }
    } else {
      setInfoModalOpen(true);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-7 bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10">
        {/* Brand & Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            {orgLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgLogoUrl}
                alt="Logo"
                className="w-16 h-16 object-contain drop-shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md">
                <Award className="w-8 h-8" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              เข้าสู่ระบบผู้จัดกิจกรรม
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              สำหรับผู้ดูแลระบบและครูผู้รับผิดชอบโครงการ/กิจกรรม
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Traditional Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">ชื่อผู้ใช้งาน หรือ อีเมล</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น admin หรือ organizer"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">รหัสผ่าน</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วยรหัสผ่าน'}
            </button>
          </div>
        </form>

        {/* Google SSO Divider & Button */}
        {googleLoginEnabled && (
          <div className="space-y-4 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                หรือเข้าสู่ระบบด้วย
              </span>
            </div>

            {/* Google Button Container */}
            <div className="w-full flex justify-center">
              {googleClientId ? (
                <div className="w-full space-y-2">
                  {/* Google official rendered button container */}
                  <div ref={googleBtnContainerRef} className="w-full flex justify-center min-h-[44px]" />
                  {googleLoading && (
                    <p className="text-center text-xs text-blue-600 font-medium animate-pulse">
                      กำลังยืนยันตัวตนกับ Google...
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs hover:shadow-sm transition active:scale-98 cursor-pointer"
                >
                  {/* Official Google G Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>เข้าสู่ระบบด้วย Google</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Demo Credentials & Install Wizard Footer */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <div className="text-xs text-slate-400">
            บัญชีทดสอบเริ่มต้น: <span className="font-mono text-slate-600 font-bold">admin / admin1234</span> หรือ{' '}
            <span className="font-mono text-slate-600 font-bold">organizer / password1234</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ติดตั้งระบบใหม่ครั้งแรก?{' '}
            <Link href="/install" className="text-blue-600 hover:underline font-bold">
              เปิดหน้าวิซาร์ดติดตั้งระบบ (Install Wizard)
            </Link>
          </div>
        </div>
      </div>

      {/* Modal: Setup Guidance when Google Client ID is not yet provided */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  ระบบ Google SSO พร้อมใช้งาน
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ระบบรองรับ Google SSO เรียบร้อยแล้ว แต่ต้องการการระบุ Google Client ID เพื่อเชื่อมต่อกับ Google OAuth 2.0
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>ขั้นตอนสำหรับผู้ดูแลระบบ:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1 leading-relaxed">
                <li>เข้าสู่ระบบด้วยบัญชี Admin (<span className="font-mono text-slate-700">admin / admin1234</span>)</li>
                <li>ไปที่เมนู <span className="font-semibold text-blue-700">⚙️ ตั้งค่าระบบ &gt; ระบบ Google SSO</span></li>
                <li>ใส่ <span className="font-semibold text-slate-700">Google Client ID</span> จาก Google Cloud Console แล้วกดบันทึก</li>
              </ol>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
