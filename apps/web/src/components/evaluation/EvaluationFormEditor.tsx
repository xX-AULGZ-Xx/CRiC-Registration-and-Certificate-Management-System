'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Palette,
  CheckCircle,
  Sliders,
  Eye,
  Star,
  Smile,
  ShieldCheck,
  Calendar,
  Layers,
  LayoutTemplate,
  AlertCircle,
} from 'lucide-react';
import {
  SurveyThemeConfig,
  SURVEY_COLORS,
  RATING_STYLES,
  THEME_PRESETS,
} from '@/lib/survey-themes';
import { fetchApi } from '@/lib/api';

interface Question {
  id?: string;
  question_text: string;
  question_type: 'RATING_5' | 'TEXT' | 'RADIO' | 'CHECKBOX';
  options?: string[];
  order_index: number;
  is_required: boolean;
}

interface Section {
  id?: string;
  title: string;
  description?: string;
  order_index: number;
  questions: Question[];
}

interface EvaluationFormEditorProps {
  eventId: string;
  initialData?: any;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EvaluationFormEditor({
  eventId,
  initialData,
  onClose,
  onSaved,
}: EvaluationFormEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'theme' | 'rules' | 'templates'>('content');
  const [saving, setSaving] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Form Base Info
  const [title, setTitle] = useState(initialData?.title || 'แบบประเมินความพึงพอใจการจัดกิจกรรม');
  const [description, setDescription] = useState(initialData?.description || '');
  const [targetResponses, setTargetResponses] = useState(initialData?.target_responses || 50);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  // Sections & Questions
  const [sections, setSections] = useState<Section[]>(() => {
    if (initialData?.sections && initialData.sections.length > 0) {
      return initialData.sections.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description || '',
        order_index: s.order_index,
        questions: (s.questions || []).map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type || 'RATING_5',
          options: Array.isArray(q.options) ? q.options : [],
          order_index: q.order_index,
          is_required: q.is_required !== false,
        })),
      }));
    }
    return [
      {
        title: 'ตอนที่ 1: ข้อมูลทั่วไป',
        description: 'กรุณากรอกข้อมูลตามความเป็นจริง',
        order_index: 1,
        questions: [
          {
            question_text: 'สถานะผู้เข้าร่วม',
            question_type: 'RADIO',
            options: ['ครู / อาจารย์', 'บุคลากร', 'นักเรียน / นักศึกษา', 'บุคคลทั่วไป'],
            order_index: 1,
            is_required: true,
          },
        ],
      },
      {
        title: 'ตอนที่ 2: ระดับความพึงพอใจ',
        description: 'ระดับคะแนน: 5 = มากที่สุด, 4 = มาก, 3 = ปานกลาง, 2 = น้อย, 1 = น้อยที่สุด',
        order_index: 2,
        questions: [
          {
            question_text: '1. ความเหมาะสมของเนื้อหาและหัวข้อกิจกรรม',
            question_type: 'RATING_5',
            options: [],
            order_index: 1,
            is_required: true,
          },
          {
            question_text: '2. ความรู้ความสามารถและการถ่ายทอดของวิทยากร',
            question_type: 'RATING_5',
            options: [],
            order_index: 2,
            is_required: true,
          },
          {
            question_text: '3. ความพึงพอใจโดยรวมต่อการจัดกิจกรรม',
            question_type: 'RATING_5',
            options: [],
            order_index: 3,
            is_required: true,
          },
        ],
      },
      {
        title: 'ตอนที่ 3: ข้อเสนอแนะเพิ่มเติม',
        description: 'ข้อเสนอแนะเพื่อการพัฒนาในครั้งต่อไป',
        order_index: 3,
        questions: [
          {
            question_text: 'ข้อเสนอแนะหรือสิ่งที่ต้องการให้จัดเพิ่มเติม',
            question_type: 'TEXT',
            options: [],
            order_index: 1,
            is_required: false,
          },
        ],
      },
    ];
  });

  // Theme Config
  const existingTheme = initialData?.theme_config || {};
  const [selectedColor, setSelectedColor] = useState<string>(existingTheme.color || 'indigo');
  const [selectedRatingStyle, setSelectedRatingStyle] = useState<'buttons' | 'stars' | 'emoji'>(
    existingTheme.rating_style || 'buttons'
  );

  const activeColorObj = SURVEY_COLORS[selectedColor] || SURVEY_COLORS.indigo;

  // Rules & Conditions
  const [minPassingScore, setMinPassingScore] = useState<number>(existingTheme.min_passing_score || 0);
  const [preventDuplicate, setPreventDuplicate] = useState<boolean>(existingTheme.prevent_duplicate ?? true);
  const [startDate, setStartDate] = useState<string>(existingTheme.start_date || '');
  const [endDate, setEndDate] = useState<string>(existingTheme.end_date || '');

  // Load current form config if not provided or on mount
  useEffect(() => {
    if (eventId) {
      loadCurrentForm();
    }
  }, [eventId]);

  const loadCurrentForm = async () => {
    try {
      setLoadingForm(true);
      const res = await fetchApi(`/api/v1/evaluation/events/${eventId}/form`);
      if (res.success && res.data) {
        const formData = res.data;
        if (formData.title) setTitle(formData.title);
        if (formData.description !== undefined) setDescription(formData.description);
        if (formData.target_responses) setTargetResponses(formData.target_responses);
        if (formData.is_active !== undefined) setIsActive(formData.is_active);

        const theme = formData.theme_config || {};
        if (theme.color) setSelectedColor(theme.color);
        if (theme.rating_style) setSelectedRatingStyle(theme.rating_style);
        if (theme.min_passing_score !== undefined) setMinPassingScore(theme.min_passing_score);
        if (theme.prevent_duplicate !== undefined) setPreventDuplicate(theme.prevent_duplicate);
        if (theme.start_date) setStartDate(theme.start_date);
        if (theme.end_date) setEndDate(theme.end_date);

        if (formData.sections && formData.sections.length > 0) {
          setSections(
            formData.sections.map((s: any) => ({
              id: s.id,
              title: s.title,
              description: s.description || '',
              order_index: s.order_index,
              questions: (s.questions || []).map((q: any) => ({
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type || 'RATING_5',
                options: Array.isArray(q.options) ? q.options : [],
                order_index: q.order_index,
                is_required: q.is_required !== false,
              })),
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load current form settings:', err);
    } finally {
      setLoadingForm(false);
    }
  };

  // Load templates on tab open
  useEffect(() => {
    if (activeTab === 'templates' && templates.length === 0) {
      loadTemplates();
    }
  }, [activeTab]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await fetchApi('/api/v1/evaluation/templates');
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Section manipulation
  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      {
        title: `ตอนที่ ${prev.length + 1}`,
        description: '',
        order_index: prev.length + 1,
        questions: [
          {
            question_text: 'ข้อคำถามใหม่',
            question_type: 'RATING_5',
            options: [],
            order_index: 1,
            is_required: true,
          },
        ],
      },
    ]);
  };

  const handleDeleteSection = (index: number) => {
    if (sections.length <= 1) {
      alert('แบบประเมินต้องมีอย่างน้อย 1 ตอน');
      return;
    }
    setSections((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Question manipulation
  const handleAddQuestion = (sectionIdx: number) => {
    setSections((prev) =>
      prev.map((sec, idx) => {
        if (idx !== sectionIdx) return sec;
        const newQuestion: Question = {
          question_text: '',
          question_type: 'RATING_5',
          options: [],
          order_index: (sec.questions?.length || 0) + 1,
          is_required: true,
        };
        return {
          ...sec,
          questions: [...(sec.questions || []), newQuestion],
        };
      })
    );
  };

  const handleDeleteQuestion = (sectionIdx: number, questionIdx: number) => {
    setSections((prev) =>
      prev.map((sec, idx) => {
        if (idx !== sectionIdx) return sec;
        return {
          ...sec,
          questions: sec.questions.filter((_, qIdx) => qIdx !== questionIdx),
        };
      })
    );
  };

  const handleApplyTemplate = async (tmpl: any) => {
    if (!confirm(`ต้องการนำเข้าแม่แบบ "${tmpl.title}" ใช่หรือไม่? ข้อมูลคำถามเดิมจะถูกแทนที่ด้วยแม่แบบนี้`)) return;

    try {
      const res = await fetchApi(`/api/v1/evaluation/events/${eventId}/apply-template/${tmpl.id}`, {
        method: 'POST',
      });
      if (res.success) {
        alert('นำเข้าแม่แบบเรียบร้อยแล้ว');
        onSaved?.();
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการนำเข้าแม่แบบ');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('กรุณาระบุชื่อแบบประเมิน');
      return;
    }

    setSaving(true);
    try {
      const themeConfigPayload: SurveyThemeConfig = {
        color: selectedColor,
        rating_style: selectedRatingStyle,
        min_passing_score: minPassingScore > 0 ? minPassingScore : 0,
        prevent_duplicate: preventDuplicate,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const res = await fetchApi(`/api/v1/evaluation/events/${eventId}/form`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          target_responses: parseInt(String(targetResponses)) || 50,
          is_active: isActive,
          theme_config: themeConfigPayload,
          sections,
        }),
      });

      if (res.success) {
        alert('บันทึกแบบประเมินเรียบร้อยแล้ว');
        onSaved?.();
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกแบบประเมิน');
    } finally {
      setSaving(false);
    }
  };

  const emojiIcons = ['😍', '😊', '😐', '😕', '😞'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-700" />
              <span>ตั้งค่าและแก้ไขแบบประเมินความพึงพอใจ</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดข้อคำถาม รูปแบบการให้คะแนน เงื่อนไขการรับเกียรติบัตร และธีมการแสดงผล
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Tabs Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'content'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> เนื้อหา & คำถาม
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'theme'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" /> ธีม & สไตล์เรตติ้ง
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> เงื่อนไขรับเกียรติบัตร
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" /> แม่แบบมาตรฐาน
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CONTENT & QUESTIONS */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Form Base Info */}
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">ชื่อแบบประเมิน *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">เป้าหมายจำนวนผู้ตอบ (คน)</label>
                    <input
                      type="number"
                      value={targetResponses}
                      onChange={(e) => setTargetResponses(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">คำชี้แจงแบบประเมิน</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ชี้แจงวัตถุประสงค์ในการทำแบบประเมิน..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-6">
                {sections.map((sec, sIdx) => (
                  <div
                    key={sIdx}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs"
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSections((prev) => {
                              const n = [...prev];
                              n[sIdx].title = val;
                              return n;
                            });
                          }}
                          placeholder="ชื่อตอน เช่น ตอนที่ 1..."
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                        />
                        <input
                          type="text"
                          value={sec.description || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSections((prev) => {
                              const n = [...prev];
                              n[sIdx].description = val;
                              return n;
                            });
                          }}
                          placeholder="คำอธิบายตอน เช่น เลือกระดับคะแนน 1-5"
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="ลบตอนนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Questions in Section */}
                    <div className="space-y-3 pl-2 border-l-2 border-blue-200">
                      {sec.questions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-blue-700 shrink-0">ข้อ {qIdx + 1}</span>

                            <input
                              type="text"
                              value={q.question_text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSections((prev) =>
                                  prev.map((sec, sI) =>
                                    sI === sIdx
                                      ? {
                                          ...sec,
                                          questions: sec.questions.map((item, qI) =>
                                            qI === qIdx ? { ...item, question_text: val } : item
                                          ),
                                        }
                                      : sec
                                  )
                                );
                              }}
                              placeholder="กรอกข้อความคำถาม เช่น 1. ความชัดเจนของเนื้อหา..."
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                            />

                            <select
                              value={q.question_type}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setSections((prev) =>
                                  prev.map((sec, sI) =>
                                    sI === sIdx
                                      ? {
                                          ...sec,
                                          questions: sec.questions.map((item, qI) =>
                                            qI === qIdx ? { ...item, question_type: val } : item
                                          ),
                                        }
                                      : sec
                                  )
                                );
                              }}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold shrink-0"
                            >
                              <option value="RATING_5">คะแนน 5 ระดับ</option>
                              <option value="RADIO">ตัวเลือก (ตอบได้ 1 ข้อ)</option>
                              <option value="CHECKBOX">ตัวเลือก (ตอบได้หลายข้อ)</option>
                              <option value="TEXT">ข้อความปลายเปิด</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(sIdx, qIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Options input if RADIO or CHECKBOX */}
                          {(q.question_type === 'RADIO' || q.question_type === 'CHECKBOX') && (
                            <div className="pt-1">
                              <label className="text-[11px] font-bold text-slate-500">
                                ตัวเลือกคำตอบ (คั่นแต่ละตัวเลือกด้วยเครื่องหมายจุลภาค ,)
                              </label>
                              <input
                                type="text"
                                value={(q.options || []).join(', ')}
                                onChange={(e) => {
                                  const parts = e.target.value
                                    .split(',')
                                    .map((p) => p.trim())
                                    .filter(Boolean);
                                  setSections((prev) =>
                                    prev.map((sec, sI) =>
                                      sI === sIdx
                                        ? {
                                            ...sec,
                                            questions: sec.questions.map((item, qI) =>
                                              qI === qIdx ? { ...item, options: parts } : item
                                            ),
                                          }
                                        : sec
                                    )
                                  );
                                }}
                                placeholder="เช่น ชาย, หญิง, อื่นๆ"
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs mt-1"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddQuestion(sIdx)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 p-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> เพิ่มข้อคำถามในตอนนี้
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSection}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> เพิ่มตอนใหม่ (Add Section)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: THEME & RATING STYLES */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* Rating Style Selection */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  สไตล์การให้คะแนน 5 ระดับ (Rating Style)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {RATING_STYLES.map((r) => {
                    const isSelected = selectedRatingStyle === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRatingStyle(r.id as any)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-blue-200 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-2xl">{r.icon}</div>
                          <div className="font-bold text-slate-900 text-xs">{r.name}</div>
                          <p className="text-[11px] text-slate-500">{r.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                            <CheckCircle className="w-3.5 h-3.5" /> เลือกใช้งานอยู่
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color Scheme Selection */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  โทนสีแบบประเมิน (Color Palette)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(SURVEY_COLORS).map(([k, c]) => {
                    const isSelected = selectedColor === k;
                    return (
                      <div
                        key={k}
                        onClick={() => setSelectedColor(k)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                          isSelected ? 'border-slate-800 bg-slate-50 shadow-xs' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: c.colorCode }}
                        />
                        <div className="text-xs font-bold text-slate-800 line-clamp-1">{c.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>ตัวอย่างการแสดงผลจริง (Live Preview)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    โทนสี: {activeColorObj.name} | สไตล์: {selectedRatingStyle}
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 max-w-md mx-auto space-y-4 shadow-sm text-center">
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${activeColorObj.headerGradient} text-white text-left`}>
                    <div className="text-[10px] font-semibold opacity-80">แบบประเมินความพึงพอใจ</div>
                    <div className="text-xs font-bold mt-0.5">{title || 'ชื่อแบบประเมินโครงการ'}</div>
                  </div>

                  <div className="text-xs font-bold text-slate-800 text-left">
                    1. ความชัดเจนของเนื้อหาและหัวข้อกิจกรรม
                  </div>

                  {selectedRatingStyle === 'buttons' && (
                    <div className="grid grid-cols-5 gap-1.5 max-w-xs mx-auto">
                      {[5, 4, 3, 2, 1].map((s) => (
                        <div
                          key={s}
                          className={`p-2.5 rounded-xl text-center font-bold text-xs ${
                            s === 5
                              ? activeColorObj.activeBtnClass
                              : 'bg-slate-50 border border-slate-200 text-slate-700'
                          }`}
                        >
                          <div>{s}</div>
                          <div className="text-[9px] font-normal opacity-80 mt-0.5">
                            {s === 5 ? 'มากที่สุด' : s === 1 ? 'น้อยที่สุด' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRatingStyle === 'stars' && (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-7 h-7 ${
                              s <= 4 ? 'fill-amber-400 text-amber-400 drop-shadow-xs' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        มาก (4 ดาว)
                      </span>
                    </div>
                  )}

                  {selectedRatingStyle === 'emoji' && (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className="flex items-center justify-center gap-2.5">
                        {[
                          { score: 5, icon: '😍' },
                          { score: 4, icon: '😊' },
                          { score: 3, icon: '😐' },
                          { score: 2, icon: '😕' },
                          { score: 1, icon: '😞' },
                        ].map((item) => (
                          <div
                            key={item.score}
                            className={`p-2 rounded-2xl border text-center ${
                              item.score === 5
                                ? 'border-emerald-500 bg-emerald-50/80 scale-105'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="block text-[9px] font-bold text-slate-600 mt-0.5">
                              {item.score}
                            </span>
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        มากที่สุด (คะแนน 5)
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled
                      className={`w-full py-2.5 rounded-xl ${activeColorObj.buttonClass} text-xs font-bold`}
                    >
                      ส่งแบบประเมินความพึงพอใจ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RULES & CONDITIONS */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Passing Score Threshold */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      เกณฑ์คะแนนเฉลี่ยขั้นต่ำเพื่อรับเกียรติบัตร (Passing Score Threshold)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ผู้เข้าร่วมต้องประเมินคะแนนเฉลี่ย (1.00 - 5.00) ถึงเกณฑ์ที่กำหนด จึงจะได้รับสิทธิ์ดาวน์โหลดเกียรติบัตร
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-blue-700 text-lg">
                      {minPassingScore > 0 ? `${minPassingScore.toFixed(2)} / 5.00` : 'ไม่กำหนดเกณฑ์'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.25"
                    value={minPassingScore}
                    onChange={(e) => setMinPassingScore(parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>0.00 (ตอบครบรับได้เลย)</span>
                    <span>3.00 (ปานกลาง)</span>
                    <span>3.50 (ระดับมาก)</span>
                    <span>4.50 (มากที่สุด)</span>
                  </div>
                </div>
              </div>

              {/* Duplicate Prevention */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3 shadow-xs">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preventDuplicate}
                    onChange={(e) => setPreventDuplicate(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      ป้องกันการทำแบบประเมินซ้ำ (Prevent Duplicate Submissions)
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      จำกัดให้ 1 คนสามารถส่งแบบประเมินได้เพียง 1 ครั้งต่อกิจกรรม (อ้างอิงเบอร์โทรศัพท์หรือเลขประจำตัวประชาชน)
                    </div>
                  </div>
                </label>
              </div>

              {/* Date Window */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  กำหนดช่วงเวลาเปิด-ปิดรับการประเมิน (Evaluation Window)
                </h3>
                <p className="text-xs text-slate-500">
                  หากไม่ระบุ ระบบจะเปิดรับคำตอบตลอดเวลาตามสถานะของกิจกรรม
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">วันเปิดรับแบบประเมิน</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">วันสิ้นสุดการรับแบบประเมิน</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                เลือกแม่แบบมาตรฐานเพื่อนำเข้าโครงสร้างข้อคำถามและสไตล์โดยอัตโนมัติ
              </div>

              {loadingTemplates ? (
                <div className="text-center py-8 text-slate-400">กำลังโหลดแม่แบบ...</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {templates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 transition shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{tmpl.title}</div>
                        <div className="text-xs text-slate-500">{tmpl.description}</div>
                        <div className="text-[11px] text-blue-700 font-semibold pt-1">
                          เป้าหมาย {tmpl.target_responses} คน • {((tmpl.sections as any[]) || []).length} ตอน
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition shrink-0 cursor-pointer"
                      >
                        ใช้งานแม่แบบนี้
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าแบบประเมิน'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
