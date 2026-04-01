/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a", // 沉稳的深蓝色，用于高亮
        background: "#f3f4f6", // 浅灰背景色
        stem: {
          green: "#00ff9d", // 荧光绿强调色
          orange: "#ff6b00", // 亮橙色强调色 (Profile用)
          dark: "#0a0a0a", // 极深背景
          panel: "rgba(20, 20, 25, 0.7)", // 毛玻璃面板底色
        }
      },
      fontFamily: {
        // 使用更具设计感的无衬线字体组合
        sans: [
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
        }
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      }
    },
  },
  plugins: [],
};
