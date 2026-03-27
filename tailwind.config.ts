import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors for better readability
        'dark': {
          'bg': '#070d18',
          'bg-soft': '#0f1a2b',
          'surface': 'rgba(17, 31, 51, 0.75)',
          'surface-strong': '#10243d',
          'border': 'rgba(190, 224, 255, 0.22)',
          'border-light': 'rgba(190, 224, 255, 0.12)',
        },
        'text': {
          'primary': '#f4f8ff',
          'secondary': '#a5b4cc',
          'tertiary': '#7a8ca8',
          'muted': '#516278',
        },
        'accent': {
          'teal': '#00d1b2',
          'teal-light': '#00f5d4',
          'red': '#ff5d7b',
          'red-light': '#ff8fa3',
          'blue': '#2d7eff',
          'green': '#1ac96d',
        },
      },
      borderRadius: {
        'sm': '0.5rem',
        'base': '0.75rem',
        'lg': '0.8rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'base': '0 4px 12px rgba(0, 0, 0, 0.25)',
        'md': '0 8px 24px rgba(0, 0, 0, 0.3)',
        'lg': '0 12px 32px rgba(0, 0, 0, 0.35)',
        'xl': '0 24px 54px rgba(0, 0, 0, 0.34)',
        'teal': '0 10px 28px rgba(0, 245, 212, 0.28)',
      },
      backdropBlur: {
        'sm': '4px',
        'base': '8px',
        'md': '12px',
        'lg': '14px',
        'xl': '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;
