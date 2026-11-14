'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Palette,
  Sliders,
  Eye,
  Upload,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { SURVEY_COLORS } from '@/lib/survey-themes';
import {
  RegistrationFormConfig,
  StandardFieldKey,
  CustomFieldType,
  CustomRegistrationField,
  STANDARD_FIELD_DEFINITIONS,
  DEFAULT_REGISTRATION_CONFIG,
  normalizeRegistrationConfig,
  getRegistrationTheme,
} from '@/lib/registration-config';
import { fetchApi } from '@/lib/api';
import { showToast, showErrorAlert, showWarningAlert, showConfirmDialog } from '@/lib/sweetalert';

interface RegistrationFormEditorProps {
  eventId: string;
  eventTitle: string;
  initialConfig: any;
  initialBannerUrl?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'ข้อความสั้น (Text)',
  textarea: 'ข้อความยาว (Textarea)',
  radio: 'ตัวเลือกเดียว (Radio)',
  select: 'รายการเลือก (Dropdown)',
  checkbox: 'หลายตัวเลือก (Checkbox)',
};

export default function RegistrationFormEditor({
  eventId,
  eventTitle,
  initialConfig,
  initialBannerUrl,
  onClose,
  onSaved,
}: RegistrationFormEditorProps) {
  const [config, setConfig] = useState<RegistrationFormConfig>(() =>
    normalizeRegistrationConfig(initialConfig)
  );
  const [bannerUrl, setBannerUrl] = useState<string | null>(initialBannerUrl || null);
  const [activeTab, setActiveTab] = useState<'fields' | 'appearance'>('fields');
  const [mobilePreview, setMobilePreview] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTheme = getRegistrationTheme(config.themeColorId);

  const handleToggleStandardField = (key: StandardFieldKey, fieldProp: 'enabled' | 'required') => {
    if (key === 'full_name') return;
    setConfig((prev) => {
      const current = prev.standardFields[key];
      const next = { ...current };
      if (fieldProp === 'enabled') {
        next.enabled = !current.enabled;
        if (!next.enabled) next.required = false;
      } else {
        next.required = !current.required;
        if (next.required) next.enabled = true;
      }
      return {
        ...prev,
        standardFields: {
          ...prev.standardFields,
          [key]: next,
        },
      };
    });
  };

  const handleStandardLabelChange = (key: StandardFieldKey, label: string) => {
    setConfig((prev) => ({
      ...prev,
      standardFields: {
        ...prev.standardFields,
        [key]: {
          ...prev.standardFields[key],
          label,
        },
      },
    }));
  };

  const handleAddCustomField = () => {
    const newField: CustomRegistrationField = {
      id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: `คำถามเพิ่มเติม ${config.customFields.length + 1}`,
      type: 'text',
      required: false,
      placeholder: '',
      options: ['ตัวเลือกที่ 1', 'ตัวเลือกที่ 2'],
    };
    setConfig((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));
  };

  const handleUpdateCustomField = (
    index: number,
    patch: Partial<CustomRegistrationField>
  ) => {
    setConfig((prev) => {
      const updated = [...prev.customFields];
      const current = updated[index];
      if (!current) return prev;
      const merged = { ...current, ...patch };
      if (
        patch.type &&
        ['radio', 'select', 'checkbox'].includes(patch.type) &&
        (!merged.options || merged.options.length === 0)
      ) {
        merged.options = ['ตัวเลือกที่ 1', 'ตัวเลือกที่ 2'];
      }
      updated[index] = merged;
      return { ...prev, customFields: updated };
    });
  };

  const handleRemoveCustomField = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveCustomField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= config.customFields.length) return;
    setConfig((prev) => {
      const updated = [...prev.customFields];
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return { ...prev, customFields: updated };
    });
  };

  const handleOptionChange = (fieldIndex: number, optIndex: number, value: string) => {
    const field = config.customFields[fieldIndex];
    if (!field) return;
    const options = [...(field.options || [])];
    options[optIndex] = value;
    handleUpdateCustomField(fieldIndex, { options });
  };

  const handleAddOption = (fieldIndex: number) => {
    const field = config.customFields[fieldIndex];
    if (!field) return;
    const options = [...(field.options || []), `ตัวเลือกที่ ${(field.options?.length || 0) + 1}`];
    handleUpdateCustomField(fieldIndex, { options });
  };

  const handleRemoveOption = (fieldIndex: number, optIndex: number) => {
    const field = config.customFields[fieldIndex];
    if (!field) return;
    const options = (field.options || []).filter((_, i) => i !== optIndex);
    handleUpdateCustomField(fieldIndex, { options });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);
      const res = await fetchApi(`/api/v1/events/${eventId}/upload-banner`, {
        method: 'POST',
        body: formData,
      });
      if (res.success && res.data?.banner_url) {
        setBannerUrl(res.data.banner_url);
        showToast('อัปโหลดรูปแบนเนอร์เรียบร้อยแล้ว', 'success');
      } else {
        showErrorAlert('อัปโหลดไม่สำเร็จ', res.message || 'ไม่สามารถอัปโหลดรูปแบนเนอร์ได้');
      }
    } catch (err: any) {
      showErrorAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setUploadingBanner(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetDefaults = async () => {
    const confirmed = await showConfirmDialog(
      'รีเซ็ตค่าเริ่มต้น?',
      'การตั้งค่าฟิลด์และธีมของฟอร์มลงทะเบียนจะกลับเป็นค่าเริ่มต้น',
      'รีเซ็ต',
      'ยกเลิก'
    );
    if (!confirmed) return;
    setConfig(normalizeRegistrationConfig(DEFAULT_REGISTRATION_CONFIG));
    setBannerUrl(null);
  };

  const handleSave = async () => {
    for (let i = 0; i < config.customFields.length; i++) {
      const cf = config.customFields[i];
      if (!cf.label.trim()) {
        showWarningAlert('ข้อมูลไม่ครบถ้วน', `กรุณาระบุชื่อคำถามเพิ่มเติมข้อที่ ${i + 1}`);
        setActiveTab('fields');
        return;
      }
      if (['radio', 'select', 'checkbox'].includes(cf.type)) {
        const cleanOpts = (cf.options || []).map((o) => o.trim()).filter(Boolean);
        if (cleanOpts.length === 0) {
          showWarningAlert('ตัวเลือกไม่ครบถ้วน', `กรุณาระบุตัวเลือกอย่างน้อย 1 ข้อสำหรับ "${cf.label}"`);
          setActiveTab('fields');
          return;
        }
      }
    }

    const sanitizedConfig: RegistrationFormConfig = {
      ...config,
      headerTitle: config.headerTitle?.trim() || '',
      instructions: config.instructions?.trim() || '',
      customFields: config.customFields.map((cf) => ({
        ...cf,
        label: cf.label.trim(),
        placeholder: cf.placeholder?.trim() || '',
        options: ['radio', 'select', 'checkbox'].includes(cf.type)
          ? (cf.options || []).map((o) => o.trim()).filter(Boolean)
          : [],
      })),
    };

    setSaving(true);
    try {
      const res = await fetchApi(`/api/v1/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({
          registration_config: sanitizedConfig,
          banner_url: bannerUrl,
        }),
      });
      if (res.success) {
        showToast('บันทึกการตั้งค่าฟอร์มลงทะเบียนเรียบร้อย', 'success');
        onSaved();
      } else {
        showErrorAlert('บันทึกไม่สำเร็จ', res.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (err: any) {
      showErrorAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              ปรับแต่งหน้าฟอร์มลงทะเบียน
            </h2>
            <p className="text-xs text-slate-500 truncate max-w-md">{eventTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobilePreview(!mobilePreview)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{mobilePreview ? 'แก้ไข' : 'ตัวอย่าง'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตค่าเริ่มต้น</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Editor Panel */}
          <div
            className={`lg:col-span-7 flex flex-col overflow-hidden border-r border-slate-200 bg-white ${
              mobilePreview ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Editor Sub-tabs */}
            <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('fields')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'fields'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>ฟิลด์ข้อมูลและคำถามเพิ่มเติม</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'appearance'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>ธีมสี แบนเนอร์ และข้อความ</span>
              </button>
            </div>

            {/* Editor Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {activeTab === 'fields' ? (
                <>
                  {/* Standard Fields Section */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">ฟิลด์ข้อมูลพื้นฐาน (Standard Fields)</h3>
                      <p className="text-xs text-slate-500">
                        เปิด/ปิดฟิลด์ที่ต้องการเก็บข้อมูล และกำหนดว่าฟิลด์ใดจำเป็นต้องกรอก
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                      {STANDARD_FIELD_DEFINITIONS.map((def) => {
                        const setting = config.standardFields[def.key];
                        return (
                          <div
                            key={def.key}
                            className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              setting.enabled ? 'bg-white' : 'bg-slate-50/70'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{def.defaultLabel}</span>
                                {def.lockedRequired && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    ฟิลด์หลัก
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">{def.description}</p>
                              {setting.enabled && !def.lockedRequired && (
                                <input
                                  type="text"
                                  value={setting.label || ''}
                                  onChange={(e) => handleStandardLabelChange(def.key, e.target.value)}
                                  placeholder={`ป้ายชื่อที่แสดง (ค่าเริ่มต้น: ${def.defaultLabel})`}
                                  className="mt-1 w-full max-w-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                              )}
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={setting.enabled}
                                  disabled={def.lockedEnabled}
                                  onChange={() => handleToggleStandardField(def.key, 'enabled')}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>แสดงผล</span>
                              </label>

                              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={setting.required}
                                  disabled={def.lockedRequired || !setting.enabled}
                                  onChange={() => handleToggleStandardField(def.key, 'required')}
                                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                />
                                <span>จำเป็น</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Fields Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">คำถามเพิ่มเติม (Custom Questions)</h3>
                        <p className="text-xs text-slate-500">
                          เพิ่มคำถามเฉพาะสำหรับกิจกรรมนี้ ข้อมูลจะถูกบันทึกและส่งออกเป็นคอลัมน์ CSV อัตโนมัติ
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>เพิ่มคำถาม</span>
                      </button>
                    </div>

                    {config.customFields.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                        ยังไม่มีคำถามเพิ่มเติม กด &quot;เพิ่มคำถาม&quot; เพื่อสร้างคำถามใหม่
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {config.customFields.map((field, idx) => (
                          <div
                            key={field.id}
                            className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-extrabold text-slate-700">
                                คำถามเพิ่มเติม #{idx + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveCustomField(idx, -1)}
                                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30 cursor-pointer"
                                  title="เลื่อนขึ้น"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === config.customFields.length - 1}
                                  onClick={() => handleMoveCustomField(idx, 1)}
                                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30 cursor-pointer"
                                  title="เลื่อนลง"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomField(idx)}
                                  className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer"
                                  title="ลบคำถาม"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                              <div className="sm:col-span-7">
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  หัวข้อคำถาม *
                                </label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) =>
                                    handleUpdateCustomField(idx, { label: e.target.value })
                                  }
                                  placeholder="เช่น อาหารที่แพ้, ไซส์เสื้อ, ความคาดหวัง"
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-5">
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  ประเภทคำตอบ
                                </label>
                                <select
                                  value={field.type}
                                  onChange={(e) =>
                                    handleUpdateCustomField(idx, {
                                      type: e.target.value as CustomFieldType,
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                  {(Object.keys(CUSTOM_FIELD_TYPE_LABELS) as CustomFieldType[]).map(
                                    (t) => (
                                      <option key={t} value={t}>
                                        {CUSTOM_FIELD_TYPE_LABELS[t]}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                            </div>

                            {(field.type === 'text' || field.type === 'textarea') && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  ข้อความแนะนำในช่องกรอก (Placeholder)
                                </label>
                                <input
                                  type="text"
                                  value={field.placeholder || ''}
                                  onChange={(e) =>
                                    handleUpdateCustomField(idx, { placeholder: e.target.value })
                                  }
                                  placeholder="เช่น ระบุข้อมูลเพิ่มเติม..."
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>
                            )}

                            {['radio', 'select', 'checkbox'].includes(field.type) && (
                              <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-600">
                                  รายการตัวเลือก
                                </label>
                                <div className="space-y-1.5">
                                  {(field.options || []).map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) =>
                                          handleOptionChange(idx, optIdx, e.target.value)
                                        }
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(idx, optIdx)}
                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(idx)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>เพิ่มตัวเลือก</span>
                                </button>
                              </div>
                            )}

                            <div className="pt-1 flex items-center justify-end">
                              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) =>
                                    handleUpdateCustomField(idx, { required: e.target.checked })
                                  }
                                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                />
                                <span>บังคับให้กรอก/เลือกคำถามนี้</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Banner Upload */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-slate-900">รูปภาพแบนเนอร์ส่วนหัว (Banner)</h3>
                    <p className="text-xs text-slate-500">
                      แนะนำขนาดแนวนอน เช่น 1200 x 400 พิกเซล (JPG, PNG, WEBP, SVG สูงสุด 10MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                    {bannerUrl ? (
                      <div className="space-y-2">
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/1]">
                          <img
                            src={bannerUrl}
                            alt="Event Banner"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingBanner}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingBanner ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปแบนเนอร์'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBannerUrl(null)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>นำแบนเนอร์ออก</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingBanner}
                        className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-blue-600 bg-slate-50/70 transition cursor-pointer"
                      >
                        {uploadingBanner ? (
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        ) : (
                          <ImageIcon className="w-7 h-7" />
                        )}
                        <span className="text-xs font-bold">
                          {uploadingBanner ? 'กำลังอัปโหลดรูปแบนเนอร์...' : 'คลิกเพื่ออัปโหลดรูปภาพแบนเนอร์'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Theme Color */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-slate-900">ชุดสีธีมของฟอร์ม (Theme Color)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {Object.values(SURVEY_COLORS).map((color) => {
                        const selected = config.themeColorId === color.id;
                        return (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, themeColorId: color.id }))}
                            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                              selected
                                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full shrink-0 border border-white shadow-sm"
                              style={{ backgroundColor: color.colorCode }}
                            />
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {color.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Header & Instructions */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        หัวข้อฟอร์มลงทะเบียน (ถ้าไม่ระบุจะใช้คำว่า &quot;แบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม&quot;)
                      </label>
                      <input
                        type="text"
                        value={config.headerTitle || ''}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, headerTitle: e.target.value }))
                        }
                        placeholder="แบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        คำชี้แจง / คำแนะนำสำหรับผู้ลงทะเบียน
                      </label>
                      <textarea
                        rows={3}
                        value={config.instructions || ''}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, instructions: e.target.value }))
                        }
                        placeholder="เช่น กรุณากรอกชื่อ-นามสกุลให้ถูกต้องเพื่อใช้ในการออกเกียรติบัตรอิเล็กทรอนิกส์"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div
            className={`lg:col-span-5 bg-slate-100 overflow-y-auto p-4 sm:p-6 ${
              mobilePreview ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                ตัวอย่างหน้าฟอร์มจริง (Live Preview)
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {bannerUrl && (
                <div className="w-full aspect-[3/1] bg-slate-100 overflow-hidden">
                  <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`bg-gradient-to-r ${activeTheme.headerGradient} text-white p-5 space-y-1.5`}>
                <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20">
                  เปิดรับลงทะเบียน
                </span>
                <h4 className="text-base font-extrabold leading-snug">{eventTitle}</h4>
              </div>

              <div className="p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <div className="text-sm font-bold text-slate-900">
                    {config.headerTitle?.trim() || 'แบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม'}
                  </div>
                  {config.instructions?.trim() && (
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">
                      {config.instructions}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {STANDARD_FIELD_DEFINITIONS.filter(
                    (def) => config.standardFields[def.key]?.enabled
                  ).map((def) => {
                    const st = config.standardFields[def.key];
                    return (
                      <div key={def.key} className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          {st.label || def.defaultLabel}{' '}
                          {st.required && <span className="text-rose-500">*</span>}
                        </label>
                        <div className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-[11px] text-slate-400">
                          ช่องกรอก {st.label || def.defaultLabel}
                        </div>
                      </div>
                    );
                  })}

                  {config.customFields.map((cf) => (
                    <div key={cf.id} className="space-y-1.5 pt-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {cf.label || 'คำถามเพิ่มเติม'}{' '}
                        {cf.required && <span className="text-rose-500">*</span>}
                      </label>
                      {cf.type === 'textarea' ? (
                        <div className="h-16 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-400">
                          {cf.placeholder || 'พื้นที่กรอกข้อความยาว'}
                        </div>
                      ) : cf.type === 'select' ? (
                        <div className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span>-- เลือกคำตอบ --</span>
                          <span>v</span>
                        </div>
                      ) : cf.type === 'radio' || cf.type === 'checkbox' ? (
                        <div className="space-y-1">
                          {(cf.options || []).map((opt, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-slate-600"
                            >
                              <span
                                className={`w-3.5 h-3.5 border border-slate-300 inline-block ${
                                  cf.type === 'radio' ? 'rounded-full' : 'rounded'
                                }`}
                              />
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-[11px] text-slate-400">
                          {cf.placeholder || 'ช่องกรอกข้อความ'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  className={`w-full py-2.5 rounded-xl text-center text-xs font-bold text-white flex items-center justify-center gap-1.5 ${activeTheme.buttonClass}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันการลงทะเบียน</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
