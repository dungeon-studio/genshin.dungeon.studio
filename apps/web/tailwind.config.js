import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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
        primary: {
          light: '#818CF8',
          DEFAULT: 'hsl(var(--primary))',
          dark: '#4F46E5',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          light: '#C084FC',
          DEFAULT: 'hsl(var(--secondary))',
          dark: '#9333EA',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
