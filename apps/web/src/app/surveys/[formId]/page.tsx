'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  Star,
  Sparkles,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { SURVEY_COLORS, ColorOption } from '@/lib/survey-themes';

function SurveyContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params.formId as string;
  const initialAttendeeId = searchParams.get('attendee_id') || '';

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Respondent info
  const [attendeeId, setAttendeeId] = useState(initialAttendeeId);
  const [phone, setPhone] = useState('');
  const [citizenId, setCitizenId] = useState('');

  // Answers map: { [questionId: string]: { score?: number, text_value?: string, checkbox_values?: string[] } }
  const [answers, setAnswers] = useState<Record<string, { score?: number; text_value?: string; checkbox_values?: string[] }>>({});

  // Result state
  const [submitResult, setSubmitResult] = useState<any>(null);

  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/v1/evaluation/forms/${formId}/public`);
      if (res.success) {
        setForm(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถโหลดแบบประเมินได้');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (questionId: string, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], score },
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], text_value: text },
    }));
  };

  const handleCheckboxToggle = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.checkbox_values || [];
      const updated = current.includes(option)
        ? current.filter((x) => x !== option)
        : [...current, option];
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          checkbox_values: updated,
          text_value: updated.join(', '),
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Prepare answers array
    const answersList: any[] = [];
    let hasUnansweredRequired = false;

    if (form && form.sections) {
      for (const sec of form.sections) {
        for (const q of sec.questions) {
          const ans = answers[q.id];
          if (q.is_required) {
            if (q.question_type === 'RATING_5' && (!ans || ans.score === undefined)) {
              hasUnansweredRequired = true;
            }
            if ((q.question_type === 'RADIO' || q.question_type === 'TEXT') && (!ans || !ans.text_value)) {
              hasUnansweredRequired = true;
            }
            if (q.question_type === 'CHECKBOX' && (!ans || !ans.checkbox_values || ans.checkbox_values.length === 0)) {
              hasUnansweredRequired = true;
            }
          }

          if (ans) {
            answersList.push({
              question_id: q.id,
              score: ans.score,
              text_value: ans.text_value,
            });
          }
        }
      }
    }

    if (hasUnansweredRequired) {
      setErrorMsg('กรุณาตอบคำถามที่มีเครื่องหมายดอกจัน (*) ให้ครบถ้วน');
      return;
    }

    // If certificates are issued, require respondent identity
    const regConfig = form?.event?.registration_config || {};
    const certConfig = form?.event?.certificate_config || {};
    const themeConfig = form?.theme_config || {};
    const isEvalOnlyEvent = regConfig.is_evaluation_only === true || regConfig.has_registration === false;
    const hasCertificate =
      themeConfig.issue_certificate !== undefined
        ? Boolean(themeConfig.issue_certificate)
        : !isEvalOnlyEvent && certConfig.enabled !== false;

    if (hasCertificate && !attendeeId && !phone.trim() && !citizenId.trim()) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์ที่ใช้ลงทะเบียน เพื่อยืนยันตัวตนรับเกียรติบัตร');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetchApi(`/api/v1/evaluation/forms/${formId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: answersList,
          attendee_id: attendeeId || undefined,
          phone: phone.trim() || undefined,
          citizen_id: citizenId.trim() || undefined,
        }),
      });

      if (res.success) {
        setSubmitResult(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งแบบประเมิน');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-bold text-sm tracking-wide">กำลังโหลดแบบประเมินความพึงพอใจ...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 text-center space-y-4">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">ไม่พบแบบประเมิน</h2>
          <p className="text-xs text-slate-500">แบบประเมินนี้อาจยังไม่เปิดใช้งาน หรือลิงก์ไม่ถูกต้อง</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // Active theme settings
  const colorKey = form.theme_config?.color || 'indigo';
  const themeColor: ColorOption = SURVEY_COLORS[colorKey] || SURVEY_COLORS.indigo;
  const ratingStyle = form.theme_config?.rating_style || 'buttons';

  // Certificate check
  const regConfig = form.event?.registration_config || {};
  const certConfig = form.event?.certificate_config || {};
  const themeConfig = form.theme_config || {};
  const isEvalOnlyEvent = regConfig.is_evaluation_only === true || regConfig.has_registration === false;
  const hasCertificate =
    themeConfig.issue_certificate !== undefined
      ? Boolean(themeConfig.issue_certificate)
      : !isEvalOnlyEvent && certConfig.enabled !== false;

  // Rating labels
  const ratingDescriptions: Record<number, string> = {
    5: 'มากที่สุด',
    4: 'มาก',
    3: 'ปานกลาง',
    2: 'น้อย',
    1: 'น้อยที่สุด',
  };

  // Submitted Successfully Screen
  if (submitResult) {
    return (
      <div className="min-h-screen bg-slate-100/60 py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              บันทึกแบบประเมินเรียบร้อยแล้ว
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              ขอขอบคุณสำหรับความคิดเห็นและข้อเสนอแนะในการพัฒนาโครงการต่อไป
            </p>
          </div>

          {submitResult.can_download_certificate && submitResult.certificate_no ? (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50/60 to-emerald-50 border border-blue-200/80 space-y-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> เกียรติบัตรพร้อมดาวน์โหลด
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-semibold">เลขที่เกียรติบัตรของคุณ</div>
                <div className="text-xl sm:text-2xl font-mono font-black text-blue-900 tracking-tight">
                  {submitResult.certificate_no}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/certificates/${submitResult.attendee_id}/view`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-xl transition active:scale-95 cursor-pointer"
                >
                  <Award className="w-5 h-5 text-amber-300" />
                  <span>ดูและดาวน์โหลดเกียรติบัตรทันที</span>
                </Link>
              </div>
            </div>
          ) : hasCertificate ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm leading-relaxed">
              ผู้จัดกิจกรรมจะตรวจสอบและดำเนินการออกเกียรติบัตรให้แก่ท่านในลำดับถัดไป หรือท่านสามารถค้นหาเกียรติบัตรย้อนหลังได้ด้วยเบอร์โทรศัพท์/เลขบัตรประชาชน
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm leading-relaxed">
              ระบบได้บันทึกความคิดเห็นของท่านเรียบร้อยแล้ว ขอบคุณที่สละเวลาในการตอบแบบประเมิน
            </div>
          )}

          <div className="pt-4 flex items-center justify-center gap-4 text-xs font-bold">
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-800 transition"
            >
              กลับสู่หน้าหลัก
            </Link>
            {hasCertificate && (
              <>
                <span className="text-slate-300">•</span>
                <Link
                  href="/certificates/search"
                  className="text-blue-700 hover:underline transition"
                >
                  ค้นหาเกียรติบัตร
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Form Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
          <div className={`bg-gradient-to-r ${themeColor.headerGradient} p-6 sm:p-9 text-white space-y-3`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md border border-white/10">
              <ClipboardCheck className="w-3.5 h-3.5" /> แบบประเมินความพึงพอใจ
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                {form.description}
              </p>
            )}
            {form.event && (
              <div className="text-xs text-white/80 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">โครงการ: {form.event.title}</span>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Attendee Matching Section (Only shown when certificates are enabled) */}
          {hasCertificate && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <User className={`w-4 h-4 ${themeColor.accentTextClass}`} />
                  <span>ข้อมูลยืนยันตัวตนเพื่อรับเกียรติบัตร</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  กรอกเบอร์โทรศัพท์ที่ใช้ลงทะเบียน เพื่อให้ระบบออกเกียรติบัตรและเชื่อมโยงข้อมูลให้คุณอัตโนมัติ
                </p>
              </div>

              <div className="space-y-1.5 max-w-md">
                <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ที่ลงทะเบียน *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 ${themeColor.ringClass} focus:outline-none transition`}
                />
              </div>
            </div>
          )}

          {/* Survey Sections */}
          {form.sections &&
            form.sections.map((section: any, sIdx: number) => (
              <div
                key={section.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor.colorCode }} />
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className="text-xs text-slate-500 mt-1">{section.description}</p>
                  )}
                </div>

                <div className="space-y-6">
                  {section.questions.map((q: any, qIdx: number) => {
                    const currentAnswer = answers[q.id];

                    return (
                      <div key={q.id} className="space-y-3 pb-5 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg shrink-0 border ${themeColor.badgeClass}`}
                          >
                            ข้อ {qIdx + 1}
                          </span>
                          <div className="text-sm font-semibold text-slate-800 leading-snug">
                            {q.question_text}
                            {q.is_required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                          </div>
                        </div>

                        {/* 1. Likert 5 Rating (Buttons, Stars, or Emoji) */}
                        {q.question_type === 'RATING_5' && (
                          <div className="pt-2 w-full">
                            {ratingStyle === 'stars' ? (
                              <div className="flex flex-col items-center gap-2 pt-1 w-full">
                                <div className="grid grid-cols-5 gap-2 w-full">
                                  {[1, 2, 3, 4, 5].map((score) => {
                                    const isSelected = (currentAnswer?.score || 0) >= score;
                                    return (
                                      <button
                                        key={score}
                                        type="button"
                                        onClick={() => handleScoreChange(q.id, score)}
                                        className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border border-slate-200/90 hover:border-amber-300 hover:bg-amber-50/30 transition cursor-pointer w-full"
                                        title={`${score} ดาว (${ratingDescriptions[score]})`}
                                      >
                                        <Star
                                          className={`w-7 h-7 sm:w-8 sm:h-8 transition ${
                                            isSelected
                                              ? 'fill-amber-400 text-amber-400 drop-shadow-md scale-110'
                                              : 'text-slate-200 hover:text-amber-300'
                                          }`}
                                        />
                                        <span className="text-[11px] font-bold text-slate-500 mt-1">
                                          {score} ดาว
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                                {currentAnswer?.score && (
                                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200 mt-1">
                                    {ratingDescriptions[currentAnswer.score]} ({currentAnswer.score} ดาว)
                                  </span>
                                )}
                              </div>
                            ) : ratingStyle === 'emoji' ? (
                              <div className="flex flex-col items-center gap-2 pt-1 w-full">
                                <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full">
                                  {[
                                    { score: 5, icon: '😍', label: 'มากที่สุด' },
                                    { score: 4, icon: '😊', label: 'มาก' },
                                    { score: 3, icon: '😐', label: 'ปานกลาง' },
                                    { score: 2, icon: '😕', label: 'น้อย' },
                                    { score: 1, icon: '😞', label: 'น้อยที่สุด' },
                                  ].map((item) => {
                                    const isSelected = currentAnswer?.score === item.score;
                                    return (
                                      <button
                                        key={item.score}
                                        type="button"
                                        onClick={() => handleScoreChange(q.id, item.score)}
                                        className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition cursor-pointer w-full ${
                                          isSelected
                                            ? 'border-emerald-500 bg-emerald-50/90 scale-102 shadow-md shadow-emerald-500/10'
                                            : 'border-slate-200 hover:border-emerald-300 bg-white'
                                        }`}
                                      >
                                        <span className="text-3xl sm:text-4xl">{item.icon}</span>
                                        <span className="text-xs font-bold text-slate-700 mt-1.5">
                                          {item.score}
                                        </span>
                                        <span className="text-[10px] text-slate-400 hidden sm:inline-block mt-0.5">
                                          {item.label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                                {currentAnswer?.score && (
                                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 mt-1">
                                    {ratingDescriptions[currentAnswer.score]} (คะแนน {currentAnswer.score})
                                  </span>
                                )}
                              </div>
                            ) : (
                              /* Default BUTTONS style with active theme */
                              <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full">
                                {[5, 4, 3, 2, 1].map((score) => {
                                  const isSelected = currentAnswer?.score === score;
                                  return (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => handleScoreChange(q.id, score)}
                                      className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition cursor-pointer w-full ${
                                        isSelected
                                          ? `${themeColor.activeBtnClass} shadow-md scale-102 font-bold`
                                          : `bg-white text-slate-700 border-slate-200 ${themeColor.hoverBorderClass}`
                                      }`}
                                    >
                                      <span className="text-lg sm:text-xl font-black">{score}</span>
                                      <span className="text-[10px] sm:text-xs mt-1 opacity-90 text-center">
                                        {ratingDescriptions[score]}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Radio Choice (Single Selection) */}
                        {q.question_type === 'RADIO' && (
                          <div className="space-y-2 pt-1">
                            {((q.options as string[]) || []).map((opt, oIdx) => (
                              <label
                                key={oIdx}
                                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition text-xs sm:text-sm font-medium ${
                                  currentAnswer?.text_value === opt
                                    ? `bg-slate-50 border-slate-800 text-slate-900 font-bold shadow-xs`
                                    : `border-slate-200 hover:bg-slate-50 text-slate-700`
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q_${q.id}`}
                                  value={opt}
                                  checked={currentAnswer?.text_value === opt}
                                  onChange={() => handleTextChange(q.id, opt)}
                                  className={`w-4 h-4 text-blue-600 focus:ring-2 ${themeColor.ringClass}`}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* 3. Checkbox Choice (Multiple Selection) */}
                        {q.question_type === 'CHECKBOX' && (
                          <div className="space-y-2 pt-1">
                            {((q.options as string[]) || []).map((opt, oIdx) => {
                              const checked = (currentAnswer?.checkbox_values || []).includes(opt);
                              return (
                                <label
                                  key={oIdx}
                                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition text-xs sm:text-sm font-medium ${
                                    checked
                                      ? `bg-slate-50 border-slate-800 text-slate-900 font-bold shadow-xs`
                                      : `border-slate-200 hover:bg-slate-50 text-slate-700`
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleCheckboxToggle(q.id, opt)}
                                    className={`w-4 h-4 rounded text-blue-600 focus:ring-2 ${themeColor.ringClass}`}
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* 4. Text Suggestion */}
                        {q.question_type === 'TEXT' && (
                          <div className="pt-1">
                            <textarea
                              rows={3}
                              value={currentAnswer?.text_value || ''}
                              onChange={(e) => handleTextChange(q.id, e.target.value)}
                              placeholder="กรอกความคิดเห็นหรือข้อเสนอแนะเพิ่มเติม..."
                              className={`w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 ${themeColor.ringClass} focus:outline-none transition`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-2xl ${themeColor.buttonClass} font-bold text-base shadow-lg hover:shadow-xl transition active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{submitting ? 'กำลังส่งแบบประเมิน...' : 'ส่งแบบประเมินความพึงพอใจ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        </div>
      }
    >
      <SurveyContent />
    </Suspense>
  );
}
