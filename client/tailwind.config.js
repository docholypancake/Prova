/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Primary accent — clay / brick red
        clay: {
          50: '#fbeeee',
          100: '#f4d7d8',
          200: '#e7b0b2',
          300: '#d6868a',
          400: '#c25f64',
          500: '#a63d40',
          600: '#8c3336',
          700: '#6f282b',
          800: '#561f21',
        },
        // Secondary accent — olive / sage
        olive: {
          50: '#f3f4ea',
          100: '#e2e5cb',
          200: '#c9cf9f',
          300: '#aeb774',
          400: '#969f5c',
          500: '#828c51',
          600: '#69703f',
          700: '#515630',
        },
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fadeIn 0.8s ease both',
        float: 'float 6s ease-in-out infinite',
        gradient: 'gradient 8s ease infinite',
      },
    },
  },
  plugins: [],
};
