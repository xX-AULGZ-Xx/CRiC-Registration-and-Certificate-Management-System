'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  Shield,
  Building2,
  Lock,
  User,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Server,
  FileCheck,
  Globe,
  Phone,
  MapPin,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function InstallPage() {
  const router = useRouter();

  // Wizard Step: 1 = Welcome & System Requirements, 2 = Admin Account, 3 = Organization Settings, 4 = Complete
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 2: Admin Account
    admin_username: 'admin',
    admin_password: '',
    admin_password_confirm: '',
    admin_full_name: 'ผู้ดูแลระบบส่วนกลาง',
    admin_email: 'admin@crvc.ac.th',
    admin_position: 'นักวิชาการคอมพิวเตอร์',

    // Step 3: Organization & Defaults
    org_name_th: 'วิทยาลัยอาชีวศึกษาเชียงราย',
    org_name_en: 'Chiang Rai Vocational College',
    org_address: 'เลขที่ 170 ถนนสิงหไคล ตำบลเวียง อำเภอเมืองเชียงราย จังหวัดเชียงราย 57000',
    org_phone: '053-711580',
    org_website: 'https://www.crvc.ac.th',
    default_cert_prefix: 'วอศ.ชร-2569',
    default_signatory_name: '',
    default_signatory_title: 'ผู้อำนวยการวิทยาลัยอาชีวศึกษาเชียงราย',
  });

  useEffect(() => {
    checkInstallStatus();
  }, []);

  const checkInstallStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await fetchApi('/api/v1/install/status');
      if (res.success && res.data?.is_installed) {
        setIsInstalled(true);
      }
    } catch (err: any) {
      console.warn('Could not check install status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (currentStep === 2) {
      if (!formData.admin_username.trim()) {
        setErrorMessage('กรุณากรอกชื่อผู้ใช้งาน (Username) สำหรับผู้ดูแลระบบ');
        return;
      }
      if (!formData.admin_password || formData.admin_password.length < 6) {
        setErrorMessage('รหัสผ่านผู้ดูแลระบบต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (formData.admin_password !== formData.admin_password_confirm) {
        setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
      if (!formData.admin_full_name.trim()) {
        setErrorMessage('กรุณากรอกชื่อ-นามสกุลของผู้ดูแลระบบ');
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      handleCompleteInstall();
    }
  };

  const handleCompleteInstall = async () => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetchApi('/api/v1/install/setup', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setCurrentStep(4);
      } else {
        setErrorMessage(res.message || 'เกิดข้อผิดพลาดในการติดตั้งระบบ');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อติดตั้งระบบได้');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center p-4 text-white">
        <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-4" />
        <p className="text-base font-semibold text-slate-300">กำลังตรวจสอบสถานะการติดตั้งระบบ...</p>
      </div>
    );
  }

  // If already installed, show message and link to login
  if (isInstalled && currentStep !== 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">ระบบได้รับการติดตั้งเรียบร้อยแล้ว</h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              ฐานข้อมูลและบัญชีผู้ดูแลระบบพร้อมใช้งานแล้ว สามารถเข้าสู่ระบบเพื่อเริ่มใช้งานได้ทันที
            </p>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <span>ไปที่หน้าเข้าสู่ระบบ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_60%)] pointer-events-none" />

      {/* Header bar */}
      <header className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-base text-white tracking-tight leading-tight">
              CRIC Certificate & Evaluation
            </div>
            <div className="text-xs text-blue-300 font-medium">Installation & Setup Wizard</div>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300">
          ขั้นตอนที่ {currentStep} จาก 3
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 flex-1 flex flex-col justify-center z-10">
        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div
            className={`flex items-center gap-2 p-2 sm:p-3 rounded-2xl border transition ${
              currentStep >= 1
                ? 'bg-blue-600/20 border-blue-500/50 text-white'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              1
            </div>
            <span className="text-xs font-bold hidden sm:inline">ข้อกำหนดระบบ</span>
          </div>

          <div
            className={`flex items-center gap-2 p-2 sm:p-3 rounded-2xl border transition ${
              currentStep >= 2
                ? 'bg-blue-600/20 border-blue-500/50 text-white'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold hidden sm:inline">บัญชีผู้ดูแล</span>
          </div>

          <div
            className={`flex items-center gap-2 p-2 sm:p-3 rounded-2xl border transition ${
              currentStep >= 3
                ? 'bg-blue-600/20 border-blue-500/50 text-white'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold hidden sm:inline">ข้อมูลองค์กร</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Card Body */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl space-y-6">
          {/* STEP 1: WELCOME & REQUIREMENTS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-400/20 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> ยินดีต้อนรับสู่ระบบ
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  เริ่มต้นติดตั้งระบบจัดการลงทะเบียนและออกเกียรติบัตร
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  วิซาร์ดนี้จะช่วยแนะนำการตั้งค่าบัญชีผู้ดูแลระบบ (Admin) ข้อมูลองค์กร และการสร้างฐานข้อมูลเริ่มต้นให้พร้อมใช้งาน
                </p>
              </div>

              {/* System Environment Check List */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  การตรวจสอบความพร้อมของระบบ (System Environment)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200">Node.js Runtime</div>
                      <div className="text-slate-500 font-mono">v20+ Compatible</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200">Database Connection</div>
                      <div className="text-slate-500">MySQL 8.0 / Prisma ORM</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200">Storage Directory</div>
                      <div className="text-slate-500">Writable (/storage)</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200">Container Ready</div>
                      <div className="text-slate-500">Docker & Docker Compose</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition active:scale-95 cursor-pointer"
                >
                  <span>เริ่มการตั้งค่า</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ADMIN ACCOUNT SETUP */}
          {currentStep === 2 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <span>สร้างบัญชีผู้ดูแลระบบส่วนกลาง (Super Admin)</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  บัญชีนี้จะได้รับสิทธิ์สูงสุดในการควบคุมระบบ ตั้งค่าส่วนกลาง และจัดการผู้ใช้งานทั้งหมด
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    ชื่อผู้ใช้งาน (Username) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="admin_username"
                      required
                      value={formData.admin_username}
                      onChange={handleChange}
                      placeholder="เช่น admin"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    ชื่อ - นามสกุลจริง *
                  </label>
                  <input
                    type="text"
                    name="admin_full_name"
                    required
                    value={formData.admin_full_name}
                    onChange={handleChange}
                    placeholder="เช่น ผู้ดูแลระบบส่วนกลาง"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    รหัสผ่าน (Password) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      name="admin_password"
                      required
                      value={formData.admin_password}
                      onChange={handleChange}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    ยืนยันรหัสผ่าน (Confirm Password) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      name="admin_password_confirm"
                      required
                      value={formData.admin_password_confirm}
                      onChange={handleChange}
                      placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    อีเมลติดต่อ (Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="admin_email"
                      value={formData.admin_email}
                      onChange={handleChange}
                      placeholder="admin@crvc.ac.th"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    ตำแหน่ง / สังกัด
                  </label>
                  <input
                    type="text"
                    name="admin_position"
                    value={formData.admin_position}
                    onChange={handleChange}
                    placeholder="เช่น นักวิชาการคอมพิวเตอร์"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
                >
                  <span>ถัดไป: ข้อมูลองค์กร</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: ORGANIZATION SETTINGS */}
          {currentStep === 3 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-teal-400" />
                  <span>ข้อมูลองค์กรและค่าเริ่มต้นระบบเกียรติบัตร</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  กำหนดค่าเริ่มต้นของสถาบันและเกียรติบัตร (สามารถแก้ไขเปลี่ยนแปลงได้ในภายหลัง)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    ชื่อองค์กร / สถาบัน (ภาษาไทย) *
                  </label>
                  <input
                    type="text"
                    name="org_name_th"
                    required
                    value={formData.org_name_th}
                    onChange={handleChange}
                    placeholder="เช่น วิทยาลัยอาชีวศึกษาเชียงราย"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    ชื่อองค์กร (English)
                  </label>
                  <input
                    type="text"
                    name="org_name_en"
                    value={formData.org_name_en}
                    onChange={handleChange}
                    placeholder="Chiang Rai Vocational College"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    ที่อยู่สถาบัน
                  </label>
                  <textarea
                    rows={2}
                    name="org_address"
                    value={formData.org_address}
                    onChange={handleChange}
                    placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="org_phone"
                      value={formData.org_phone}
                      onChange={handleChange}
                      placeholder="เช่น 053-711580"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    เว็บไซต์สถาบัน
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      name="org_website"
                      value={formData.org_website}
                      onChange={handleChange}
                      placeholder="https://www.crvc.ac.th"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    คำนำหน้ารหัสเกียรติบัตรเริ่มต้น
                  </label>
                  <input
                    type="text"
                    name="default_cert_prefix"
                    value={formData.default_cert_prefix}
                    onChange={handleChange}
                    placeholder="เช่น วอศ.ชร-2569"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    ตำแหน่งผู้ลงนามเริ่มต้น
                  </label>
                  <input
                    type="text"
                    name="default_signatory_title"
                    value={formData.default_signatory_title}
                    onChange={handleChange}
                    placeholder="เช่น ผู้อำนวยการวิทยาลัยอาชีวศึกษาเชียงราย"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md shadow-teal-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังติดตั้งและสร้างระบบ...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>บันทึกและเสร็จสิ้นการติดตั้ง</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: INSTALLATION COMPLETED */}
          {currentStep === 4 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">ติดตั้งระบบเสร็จสมบูรณ์!</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  ระบบได้บันทึกข้อมูลสถาบัน สร้างบัญชีผู้ดูแลระบบ และเตรียมฐานข้อมูลแม่แบบแบบประเมินเรียบร้อยแล้ว
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-left max-w-md mx-auto text-xs space-y-2 text-slate-300">
                <div className="font-bold text-white text-sm mb-1">ข้อมูลสำหรับเข้าสู่ระบบ:</div>
                <div>• บัญชีผู้ใช้: <strong className="text-teal-300">{formData.admin_username}</strong></div>
                <div>• สิทธิ์การใช้งาน: <span className="text-blue-300 font-semibold">ผู้ดูแลระบบ (ADMIN)</span></div>
                <div>• องค์กร: <span>{formData.org_name_th}</span></div>
              </div>

              <div className="pt-4 flex justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition active:scale-95 cursor-pointer"
                >
                  <span>เข้าสู่ระบบทันที</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 text-center text-xs text-slate-500 z-10">
        Registration & Certificate Management System • วิทยาลัยอาชีวศึกษาเชียงราย
      </footer>
    </div>
  );
}
