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
        primary: {
          DEFAULT: '#1e40af',
          hover: '#1d4ed8',
          light: '#dbeafe',
        },
        accent: {
          DEFAULT: '#0d9488',
          hover: '#0f766e',
        },
      },
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
        sarabun: ["'TH Sarabun New'", "'TH SarabunPSK'", "'Sarabun'", 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
