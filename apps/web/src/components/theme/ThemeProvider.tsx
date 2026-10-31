'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

export interface ThemeSettings {
  theme_font_heading: string;
  theme_font_body: string;
  theme_font_size: 'normal' | 'large' | 'extra-large';
  theme_primary_color: string;
  theme_accent_color: string;
  theme_border_radius: 'sharp' | 'soft' | 'rounded';
}

export const DEFAULT_THEME: ThemeSettings = {
  theme_font_heading: 'Prompt',
  theme_font_body: 'Sarabun',
  theme_font_size: 'normal',
  theme_primary_color: '#1e3a8a',
  theme_accent_color: '#0d9488',
  theme_border_radius: 'soft',
};

export const AVAILABLE_FONTS = [
  { id: 'Prompt', name: 'Prompt (พร้อมต์ - ทางการ/ทันสมัย)', family: "'Prompt', sans-serif" },
  { id: 'Sarabun', name: 'Sarabun (สารบรรณ - ทางราชการ)', family: "'Sarabun', 'TH SarabunIT๙', sans-serif" },
  { id: 'Kanit', name: 'Kanit (คณิต - ทันสมัย/คมชัด)', family: "'Kanit', sans-serif" },
  { id: 'Mitr', name: 'Mitr (มิตร - นุ่มนวล/เป็นมิตร)', family: "'Mitr', sans-serif" },
  { id: 'Noto Sans Thai', name: 'Noto Sans Thai (สากล/อ่านสบาย)', family: "'Noto Sans Thai', sans-serif" },
  { id: 'Chakra Petch', name: 'Chakra Petch (จักรเพชร - เหลี่ยมเทคโน)', family: "'Chakra Petch', sans-serif" },
  { id: 'Bai Jamjuree', name: 'Bai Jamjuree (จามจุรี - เรียบหรู)', family: "'Bai Jamjuree', sans-serif" },
  { id: 'Krub', name: 'Krub (ครับ - มินิมอล)', family: "'Krub', sans-serif" },
  { id: 'K2D', name: 'K2D (เรขาคณิต/สดใส)', family: "'K2D', sans-serif" },
  { id: 'Mali', name: 'Mali (มะลิ - ลายมือน่ารัก)', family: "'Mali', cursive" },
];

export const COLOR_PRESETS = [
  {
    id: 'classic-blue',
    name: 'น้ำเงินคลาสสิก (Classic Blue)',
    primary: '#1e3a8a',
    accent: '#0d9488',
    description: 'สุภาพ ทางการ มั่นคง น่าเชื่อถือ',
  },
  {
    id: 'vibrant-blue',
    name: 'ฟ้าสดใส (Royal Indigo)',
    primary: '#2563eb',
    accent: '#06b6d4',
    description: 'ทันสมัย โดดเด่น ชัดเจน',
  },
  {
    id: 'emerald-green',
    name: 'เขียวมรกต (Emerald Green)',
    primary: '#059669',
    accent: '#0d9488',
    description: 'สดชื่น พลังงานบวก การพัฒนา',
  },
  {
    id: 'indigo-purple',
    name: 'ม่วงอินดิโก้ (Deep Purple)',
    primary: '#4f46e5',
    accent: '#ec4899',
    description: 'คิดสร้างสรรค์ เทคโนโลยี นวัตกรรม',
  },
  {
    id: 'crimson-red',
    name: 'แดงทับทิม (Crimson Red)',
    primary: '#dc2626',
    accent: '#ea580c',
    description: 'กระตือรือร้น หนักแน่น ทรงพลัง',
  },
  {
    id: 'warm-amber',
    name: 'ส้มอำพัน (Warm Amber)',
    primary: '#d97706',
    accent: '#b45309',
    description: 'อบอุ่น เป็นกันเอง สว่างสดใส',
  },
  {
    id: 'slate-dark',
    name: 'ดำหรูหรา (Slate Modern)',
    primary: '#0f172a',
    accent: '#3b82f6',
    description: 'มินิมอล ล้ำสมัย เรียบเท่',
  },
];

export const BORDER_RADIUS_OPTIONS = [
  { id: 'sharp', name: 'เหลี่ยมกระชับ (Minimal Sharp)', value: '6px' },
  { id: 'soft', name: 'โค้งมนนุ่มนวล (Modern Soft)', value: '12px' },
  { id: 'rounded', name: 'โค้งมนพิเศษ (Extra Rounded)', value: '20px' },
];

export const FONT_SIZE_OPTIONS = [
  { id: 'normal', name: 'ปกติ (Normal - 16px)', value: '16px' },
  { id: 'large', name: 'ใหญ่ (Large - 17px)', value: '17px' },
  { id: 'extra-large', name: 'สบายตา (Extra Comfort - 18px)', value: '18px' },
];

// Color calculation helpers
function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [30, 58, 138];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)}`;
}

function mixColor(color1: [number, number, number], color2: [number, number, number], weight: number): string {
  const r = color1[0] * (1 - weight) + color2[0] * weight;
  const g = color1[1] * (1 - weight) + color2[1] * weight;
  const b = color1[2] * (1 - weight) + color2[2] * weight;
  return rgbToHex(r, g, b);
}

export function generateColorShades(baseHex: string) {
  const base = hexToRgb(baseHex);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];

  return {
    50: mixColor(base, white, 0.92),
    100: mixColor(base, white, 0.82),
    200: mixColor(base, white, 0.65),
    300: mixColor(base, white, 0.45),
    400: mixColor(base, white, 0.22),
    500: baseHex,
    600: mixColor(base, black, 0.12),
    700: mixColor(base, black, 0.26),
    800: mixColor(base, black, 0.45),
    900: mixColor(base, black, 0.65),
    950: mixColor(base, black, 0.80),
  };
}

// Calculate a darker hover shade from hex color
export function adjustColorBrightness(hex: string, percent: number): string {
  try {
    const rgb = hexToRgb(hex);
    let r = rgb[0] + Math.round((255 * percent) / 100);
    let g = rgb[1] + Math.round((255 * percent) / 100);
    let b = rgb[2] + Math.round((255 * percent) / 100);
    return rgbToHex(r, g, b);
  } catch {
    return hex;
  }
}

export function applyThemeToDom(theme: ThemeSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Font family resolution
  const headingFontObj = AVAILABLE_FONTS.find((f) => f.id === theme.theme_font_heading) || AVAILABLE_FONTS[0];
  const bodyFontObj = AVAILABLE_FONTS.find((f) => f.id === theme.theme_font_body) || AVAILABLE_FONTS[1];

  // Radius resolution
  const radiusObj = BORDER_RADIUS_OPTIONS.find((r) => r.id === theme.theme_border_radius) || BORDER_RADIUS_OPTIONS[1];

  // Font size resolution
  const fontSizeObj = FONT_SIZE_OPTIONS.find((s) => s.id === theme.theme_font_size) || FONT_SIZE_OPTIONS[0];

  const primaryHover = adjustColorBrightness(theme.theme_primary_color, -15);
  const shades = generateColorShades(theme.theme_primary_color);

  // Set primary color scale for Tailwind blue-* override
  root.style.setProperty('--theme-p-50', shades[50]);
  root.style.setProperty('--theme-p-100', shades[100]);
  root.style.setProperty('--theme-p-200', shades[200]);
  root.style.setProperty('--theme-p-300', shades[300]);
  root.style.setProperty('--theme-p-400', shades[400]);
  root.style.setProperty('--theme-p-500', shades[500]);
  root.style.setProperty('--theme-p-600', shades[600]);
  root.style.setProperty('--theme-p-700', shades[700]);
  root.style.setProperty('--theme-p-800', shades[800]);
  root.style.setProperty('--theme-p-900', shades[900]);
  root.style.setProperty('--theme-p-950', shades[950]);

  // Primary and Accent base
  root.style.setProperty('--color-primary', theme.theme_primary_color);
  root.style.setProperty('--color-primary-hover', primaryHover);
  root.style.setProperty('--color-accent', theme.theme_accent_color);

  // Typography
  root.style.setProperty('--font-heading-family', headingFontObj.family);
  root.style.setProperty('--font-body-family', bodyFontObj.family);
  root.style.setProperty('--font-ui-family', headingFontObj.family);
  root.style.setProperty('--base-font-size', fontSizeObj.value);

  // Component geometry
  root.style.setProperty('--app-radius', radiusObj.value);
}

interface ThemeContextValue {
  theme: ThemeSettings;
  updateTheme: (newTheme: Partial<ThemeSettings>) => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  updateTheme: () => {},
  refreshTheme: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);

  const fetchAndApplyTheme = async () => {
    try {
      // 1. Try reading from cached local storage for instant render
      const cached = localStorage.getItem('cric_theme_settings');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setTheme((prev) => ({ ...prev, ...parsed }));
          applyThemeToDom({ ...DEFAULT_THEME, ...parsed });
        } catch {
          // ignore
        }
      }

      // 2. Fetch fresh settings from API
      const res = await fetchApi('/api/v1/system/public-settings');
      if (res.success && res.data) {
        const freshTheme: ThemeSettings = {
          theme_font_heading: res.data.theme_font_heading || DEFAULT_THEME.theme_font_heading,
          theme_font_body: res.data.theme_font_body || DEFAULT_THEME.theme_font_body,
          theme_font_size: (res.data.theme_font_size as any) || DEFAULT_THEME.theme_font_size,
          theme_primary_color: res.data.theme_primary_color || DEFAULT_THEME.theme_primary_color,
          theme_accent_color: res.data.theme_accent_color || DEFAULT_THEME.theme_accent_color,
          theme_border_radius: (res.data.theme_border_radius as any) || DEFAULT_THEME.theme_border_radius,
        };
        setTheme(freshTheme);
        localStorage.setItem('cric_theme_settings', JSON.stringify(freshTheme));
        applyThemeToDom(freshTheme);
      }
    } catch (err) {
      console.warn('Failed to load theme settings:', err);
    }
  };

  useEffect(() => {
    fetchAndApplyTheme();

    const handleThemeUpdate = (e: any) => {
      if (e.detail) {
        const updated = { ...DEFAULT_THEME, ...e.detail };
        setTheme(updated);
        localStorage.setItem('cric_theme_settings', JSON.stringify(updated));
        applyThemeToDom(updated);
      } else {
        fetchAndApplyTheme();
      }
    };

    window.addEventListener('theme-updated', handleThemeUpdate);
    return () => {
      window.removeEventListener('theme-updated', handleThemeUpdate);
    };
  }, []);

  const updateTheme = (newSettings: Partial<ThemeSettings>) => {
    setTheme((prev) => {
      const merged = { ...prev, ...newSettings };
      applyThemeToDom(merged);
      return merged;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, refreshTheme: fetchAndApplyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
