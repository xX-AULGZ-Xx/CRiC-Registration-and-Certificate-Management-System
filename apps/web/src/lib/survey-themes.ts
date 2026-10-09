export interface SurveyThemeConfig {
  preset?: string;
  font?: string;
  color?: string;
  bg_style?: string;
  rating_style?: 'buttons' | 'stars' | 'emoji';
  border_radius?: string;
  min_passing_score?: number;
  prevent_duplicate?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface ColorOption {
  id: string;
  name: string;
  colorCode: string;
  headerGradient: string;
  buttonClass: string;
  badgeClass: string;
  activeBtnClass: string;
  hoverBorderClass: string;
  ringClass: string;
  accentTextClass: string;
}

export const SURVEY_COLORS: Record<string, ColorOption> = {
  indigo: {
    id: 'indigo',
    name: 'ครามสากล (Indigo)',
    colorCode: '#4f46e5',
    headerGradient: 'from-blue-950 via-indigo-900 to-indigo-950',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeBtnClass: 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/30',
    hoverBorderClass: 'hover:border-indigo-400 hover:bg-indigo-50/40',
    ringClass: 'focus:ring-indigo-500',
    accentTextClass: 'text-indigo-600',
  },
  blue: {
    id: 'blue',
    name: 'น้ำเงินราชการ (Royal Blue)',
    colorCode: '#2563eb',
    headerGradient: 'from-blue-950 via-blue-900 to-slate-950',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    activeBtnClass: 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30',
    hoverBorderClass: 'hover:border-blue-400 hover:bg-blue-50/40',
    ringClass: 'focus:ring-blue-500',
    accentTextClass: 'text-blue-600',
  },
  emerald: {
    id: 'emerald',
    name: 'เขียวมรกต (Emerald)',
    colorCode: '#059669',
    headerGradient: 'from-emerald-950 via-teal-900 to-slate-950',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeBtnClass: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/30',
    hoverBorderClass: 'hover:border-emerald-400 hover:bg-emerald-50/40',
    ringClass: 'focus:ring-emerald-500',
    accentTextClass: 'text-emerald-600',
  },
  teal: {
    id: 'teal',
    name: 'เขียวน้ำทะเล (Teal)',
    colorCode: '#0d9488',
    headerGradient: 'from-teal-950 via-teal-900 to-slate-950',
    buttonClass: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    activeBtnClass: 'bg-teal-600 text-white border-teal-600 shadow-teal-500/30',
    hoverBorderClass: 'hover:border-teal-400 hover:bg-teal-50/40',
    ringClass: 'focus:ring-teal-500',
    accentTextClass: 'text-teal-600',
  },
  amber: {
    id: 'amber',
    name: 'ทองอำพัน (Amber Gold)',
    colorCode: '#d97706',
    headerGradient: 'from-amber-950 via-amber-900 to-orange-950',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    activeBtnClass: 'bg-amber-600 text-white border-amber-600 shadow-amber-500/30',
    hoverBorderClass: 'hover:border-amber-400 hover:bg-amber-50/40',
    ringClass: 'focus:ring-amber-500',
    accentTextClass: 'text-amber-600',
  },
  violet: {
    id: 'violet',
    name: 'ม่วงพรีเมียม (Violet)',
    colorCode: '#7c3aed',
    headerGradient: 'from-violet-950 via-purple-900 to-slate-950',
    buttonClass: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/25',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    activeBtnClass: 'bg-violet-600 text-white border-violet-600 shadow-violet-500/30',
    hoverBorderClass: 'hover:border-violet-400 hover:bg-violet-50/40',
    ringClass: 'focus:ring-violet-500',
    accentTextClass: 'text-violet-600',
  },
  rose: {
    id: 'rose',
    name: 'ชมพูกุหลาบ (Rose)',
    colorCode: '#e11d48',
    headerGradient: 'from-rose-950 via-rose-900 to-pink-950',
    buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeBtnClass: 'bg-rose-600 text-white border-rose-600 shadow-rose-500/30',
    hoverBorderClass: 'hover:border-rose-400 hover:bg-rose-50/40',
    ringClass: 'focus:ring-rose-500',
    accentTextClass: 'text-rose-600',
  },
};

export const RATING_STYLES = [
  { id: 'buttons', name: 'ปุ่มตัวเลข 1 - 5 มาตรฐาน', desc: 'มีแถบตัวเลขพร้อมคำอธิบาย เข้าใจง่าย ชัดเจน', icon: '🔢' },
  { id: 'stars', name: 'รูปดาว 5 ดวง (Star Rating)', desc: 'ไอคอนดาวประกายสีทอง เหมาะกับการบริการและกิจกรรมทั่วไป', icon: '⭐' },
  { id: 'emoji', name: 'อีโมจิบอกความรู้สึก (Emoji)', desc: 'หน้าตาแสดงอารมณ์ น่ารัก เป็นมิตร ดึงดูดการตอบ', icon: '😍' },
];

export const THEME_PRESETS = [
  {
    id: 'official',
    name: 'ราชการมาตรฐาน',
    desc: 'โทนสีน้ำเงินคราม สุภาพ เรียบร้อย ตามแบบแผนราชการ',
    color: 'indigo',
    rating_style: 'buttons' as const,
  },
  {
    id: 'modern_star',
    name: 'โมเดิร์น สตาร์',
    desc: 'โทนสีน้ำเงิน รูประบบดาว 5 ดวง สบายตา ทันสมัย',
    color: 'blue',
    rating_style: 'stars' as const,
  },
  {
    id: 'friendly_emoji',
    name: 'เป็นกันเอง อีโมจิ',
    desc: 'โทนสีเขียวมรกต พร้อมอีโมจิยิ้มแย้ม น่ารักน่าตอบ',
    color: 'emerald',
    rating_style: 'emoji' as const,
  },
  {
    id: 'luxury_gold',
    name: 'วิชาการทองหรูหรา',
    desc: 'โทนสีทองอำพัน งานสัมมนาวิชาการ เกียรตินิยม',
    color: 'amber',
    rating_style: 'stars' as const,
  },
  {
    id: 'violet_creative',
    name: 'ครีเอทีฟ โมเดิร์น',
    desc: 'โทนสีม่วงพรีเมียม สไตล์คนรุ่นใหม่',
    color: 'violet',
    rating_style: 'stars' as const,
  },
];
