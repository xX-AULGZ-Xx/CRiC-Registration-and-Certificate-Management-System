import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: 'var(--theme-p-50, #eff6ff)',
          100: 'var(--theme-p-100, #dbeafe)',
          200: 'var(--theme-p-200, #bfdbfe)',
          300: 'var(--theme-p-300, #93c5fd)',
          400: 'var(--theme-p-400, #60a5fa)',
          500: 'var(--theme-p-500, #3b82f6)',
          600: 'var(--theme-p-600, #2563eb)',
          700: 'var(--theme-p-700, #1d4ed8)',
          800: 'var(--theme-p-800, #1e40af)',
          900: 'var(--theme-p-900, #1e3a8a)',
          950: 'var(--theme-p-950, #172554)',
        },
        indigo: {
          50: 'var(--theme-p-50, #eff6ff)',
          100: 'var(--theme-p-100, #dbeafe)',
          200: 'var(--theme-p-200, #bfdbfe)',
          300: 'var(--theme-p-300, #93c5fd)',
          400: 'var(--theme-p-400, #60a5fa)',
          500: 'var(--theme-p-500, #3b82f6)',
          600: 'var(--theme-p-600, #2563eb)',
          700: 'var(--theme-p-700, #1d4ed8)',
          800: 'var(--theme-p-800, #1e40af)',
          900: 'var(--theme-p-900, #1e3a8a)',
          950: 'var(--theme-p-950, #172554)',
        },
        primary: {
          DEFAULT: 'var(--color-primary, #1e3a8a)',
          hover: 'var(--color-primary-hover, #172554)',
          light: 'var(--theme-p-100, #dbeafe)',
        },
        accent: {
          DEFAULT: 'var(--color-accent, #0d9488)',
          hover: '#0f766e',
        },
        crvc: {
          primary: 'var(--color-primary, #1E3A8A)', // Dynamic Deep Blue / Primary
          secondary: 'var(--color-accent, #0D9488)', // Dynamic Teal / Accent
          accent: '#F59E0B', // Amber
          light: '#F8FAFC',
          dark: '#0F172A',
        },
      },
      borderRadius: {
        theme: 'var(--app-radius, 12px)',
        xl: 'var(--app-radius, 12px)',
        '2xl': 'calc(var(--app-radius, 12px) * 1.33)',
        '3xl': 'calc(var(--app-radius, 12px) * 1.66)',
      },
      fontFamily: {
        sans: ['var(--font-body-family)', 'var(--font-sarabun)', 'Sarabun', 'sans-serif'],
        heading: ['var(--font-heading-family)', 'var(--font-prompt)', 'Prompt', 'sans-serif'],
        body: ['var(--font-body-family)', 'var(--font-sarabun)', 'Sarabun', 'sans-serif'],
        sarabun: ["'TH SarabunIT๙'", "'TH SarabunIT9'", "'TH Sarabun New'", "'TH SarabunPSK'", "'Sarabun'", 'sans-serif'],
      },
      boxShadow: {
        paper: '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
