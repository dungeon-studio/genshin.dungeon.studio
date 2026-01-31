/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Genshin Impact element colors
        pyro: {
          light: '#FF9E5A',
          DEFAULT: '#FF6B35',
          dark: '#D94A1A',
        },
        hydro: {
          light: '#6BB6FF',
          DEFAULT: '#3B8CD8',
          dark: '#1E5A8E',
        },
        electro: {
          light: '#D39CFF',
          DEFAULT: '#A855F7',
          dark: '#7C3AED',
        },
        cryo: {
          light: '#C0E7FF',
          DEFAULT: '#7DD3FC',
          dark: '#38BDF8',
        },
        anemo: {
          light: '#A5F3E5',
          DEFAULT: '#67E8C9',
          dark: '#2DD4BF',
        },
        geo: {
          light: '#FDE68A',
          DEFAULT: '#FCD34D',
          dark: '#F59E0B',
        },
        dendro: {
          light: '#BBF7D0',
          DEFAULT: '#4ADE80',
          dark: '#22C55E',
        },
        // Brand colors
        primary: {
          light: '#818CF8',
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
        },
        secondary: {
          light: '#C084FC',
          DEFAULT: '#A855F7',
          dark: '#9333EA',
        },
      },
    },
  },
  plugins: [],
};
