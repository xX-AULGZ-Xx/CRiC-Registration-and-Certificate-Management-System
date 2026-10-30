'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Briefcase,
  Building,
  Key,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updatedUser: any) => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  onUserUpdated,
}: ProfileEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [organization, setOrganization] = useState('');
  const [signatureImg, setSignatureImg] = useState<string | null>(null);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sigFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset messages and load current profile
    setErrorMessage(null);
    setSuccessMessage(null);
    setNewPassword('');
    setConfirmPassword('');

    const loadProfile = async () => {
      setLoading(true);
      try {
        // 1. Try reading from localStorage first for instant initial values
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          try {
            const u = JSON.parse(localUserStr);
            setUsername(u.username || '');
            setRole(u.role || '');
            setFullName(u.full_name || '');
            setEmail(u.email || '');
            setPosition(u.position || '');
            setOrganization(u.organization || '');
            setSignatureImg(u.signature_img || null);
          } catch {
            // ignore
          }
        }

        // 2. Fetch fresh user data from API
        const res = await fetchApi('/api/v1/auth/me');
        if (res.success && res.data) {
          const u = res.data;
          setUsername(u.username || '');
          setRole(u.role || '');
          setFullName(u.full_name || '');
          setEmail(u.email || '');
          setPosition(u.position || '');
          setOrganization(u.organization || '');
          setSignatureImg(u.signature_img || null);
        }
      } catch (err: any) {
        console.warn('Could not fetch fresh user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Signature Image Upload
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSig(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('signature', file);

      const res = await fetchApi('/api/v1/auth/signature', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.signature_url) {
        setSignatureImg(res.data.signature_url);
        setSuccessMessage('อัปโหลดรูปลายเซ็นเรียบร้อยแล้ว');
      } else {
        setErrorMessage(res.message || 'ไม่สามารถอัปโหลดรูปลายเซ็นได้');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปลายเซ็น');
    } finally {
      setUploadingSig(false);
      if (sigFileInputRef.current) {
        sigFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveSignature = () => {
    setSignatureImg(null);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุล');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        full_name: fullName.trim(),
        email: email.trim() || null,
        position: position.trim() || null,
        organization: organization.trim() || null,
        signature_img: signatureImg,
      };

      if (newPassword) {
        payload.password = newPassword.trim();
      }

      const res = await fetchApi('/api/v1/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        const updated = res.data;

        // Preserve avatar_url if exists
        const oldUserStr = localStorage.getItem('user');
        let avatarUrl = null;
        if (oldUserStr) {
          try {
            avatarUrl = JSON.parse(oldUserStr).avatar_url;
          } catch {
            // ignore
          }
        }
        const mergedUser = {
          ...updated,
          avatar_url: avatarUrl || updated.avatar_url,
        };

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(mergedUser));

        // Dispatch real-time event to Navbar and other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('user-updated', { detail: mergedUser }));
        }

        if (onUserUpdated) {
          onUserUpdated(mergedUser);
        }

        setSuccessMessage('บันทึกข้อมูลส่วนตัวสำเร็จเรียบร้อย');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMessage(res.message || 'ไม่สามารถบันทึกข้อมูลส่วนตัวได้');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 relative shadow-2xl border border-slate-100 my-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">แก้ไขข้อมูลส่วนตัว / โปรไฟล์</h2>
              <p className="text-xs text-slate-500">จัดการข้อมูลบัญชีผู้ใช้งาน ลายเซ็นดิจิทัล และรหัสผ่าน</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูลโปรไฟล์...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Alert Messages */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {/* Read-only User Badge & Role */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                  {fullName ? fullName.trim().charAt(0).toUpperCase() : username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">ชื่อบัญชีผู้ใช้</div>
                  <div className="text-xs font-mono font-bold text-slate-800">@{username}</div>
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    role === 'ADMIN'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้จัดโครงการ (Organizer)'}</span>
                </span>
              </div>
            </div>

            {/* General Info Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ชื่อ-นามสกุล *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น ดร.สมชาย ใจดี"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    อีเมล (Email)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ตำแหน่งงาน (Position)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="เช่น ครูชำนาญการ / หัวหน้างาน"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  หน่วยงาน / สังกัด (Organization)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="เช่น วิทยาลัยอาชีวศึกษาเชียงราย"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Signature Upload Section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>รูปลายเซ็นดิจิทัลส่วนตัว (Digital Signature)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ไฟล์ภาพลายเซ็น (PNG พื้นหลังโปร่งใส) สำหรับใช้ประทับบนเกียรติบัตรที่ท่านเป็นผู้ออก
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* Signature Preview */}
                <div className="w-36 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center p-2 relative overflow-hidden shrink-0">
                  {signatureImg ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={signatureImg}
                      alt="ลายเซ็นส่วนตัว"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 text-center font-medium">ยังไม่มีลายเซ็น</span>
                  )}
                </div>

                {/* Upload & Remove Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={sigFileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleSignatureUpload}
                  />
                  <button
                    type="button"
                    disabled={uploadingSig}
                    onClick={() => sigFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {uploadingSig ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{uploadingSig ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปลายเซ็น'}</span>
                  </button>

                  {signatureImg && (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>ลบลายเซ็น</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Password Change Section */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">เปลี่ยนรหัสผ่านใหม่ (ไม่บังคับ)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นว่างไว้ หากต้องการเปลี่ยน ให้ระบุรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    รหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="รหัสผ่านใหม่อย่างน้อย 6 ตัว"
                      className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                      className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกข้อมูลส่วนตัว</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
