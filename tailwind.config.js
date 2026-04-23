/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#D4AF37", // 金色
        background: "#f3f4f6", // 浅灰背景色
        gold: {
          50: '#FDF8E7',
          100: '#FAEDC0',
          200: '#F7E299',
          300: '#F5D76E',
          400: '#E6C655',
          500: '#D4AF37',
          600: '#B5942D',
          700: '#947823',
          800: '#755E1A',
          900: '#5C4A14',
        },
        stem: {
          green: "#D4AF37", // 将原来的荧光绿替换为香槟金
          orange: "#ff6b00", // 亮橙色强调色 (Profile用)
          dark: "#0a0a0a", // 极深背景
          panel: "rgba(20, 20, 25, 0.7)", // 毛玻璃面板底色
        }
      },
      fontFamily: {
        // 增加 Inter 字体作为主要科技感字体
        inter: ['Inter', 'sans-serif'],
        sans: [
          'Inter',
          'Roboto',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"PingFang SC"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
      },
      backgroundImage: {
        'blueprint': "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'blueprint': '20px 20px',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' }
        },
        'blob': {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        'breathe': {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(212, 175, 55, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.1)"
          },
          "50%": {
            boxShadow: "0 0 40px rgba(245, 215, 110, 0.5)",
            borderColor: "rgba(212, 175, 55, 0.4)"
          }
        }
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'blob': 'blob 7s infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
