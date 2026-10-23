/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          midnight: "#070B24",      // Midnight cosmic sky
          purple: "#211044",        // Deep enchanted purple
          nebula: "#7547F5",        // Nebula violet
          cyan: "#54E8FF",          // Electric celestial cyan
          lavender: "#B99AFF",      // Magical lavender
          gold: "#FFD98A",          // Enchanted gold
          crystal: "#F6F4FF",       // Prismatic crystal white
          surface: "rgba(16, 14, 46, 0.72)", // Arcane translucent glass
          card: "rgba(23, 19, 64, 0.75)",    // Crystal prism card
          border: "rgba(185, 154, 255, 0.22)", // Ethereal lavender border
          borderGlow: "rgba(84, 232, 255, 0.45)",
          hover: "rgba(43, 31, 95, 0.8)",
          text: "#F6F4FF",
          muted: "#A9A2D8",
          dim: "#746B9E",
        },
        universe: {
          bg: "#070B24",
          surface: "#100E2E",
          card: "#171340",
          border: "#29215E",
          hover: "#251E54",
          text: "#F6F4FF",
          muted: "#A9A2D8",
          dim: "#746B9E",
        },
        cyan: {
          accent: "#54E8FF",
          glow: "rgba(84, 232, 255, 0.25)",
          bright: "#00F7FF",
        },
        violet: {
          accent: "#7547F5",
          glow: "rgba(117, 71, 245, 0.25)",
        },
        lavender: {
          accent: "#B99AFF",
          glow: "rgba(185, 154, 255, 0.25)",
        },
        gold: {
          accent: "#FFD98A",
          glow: "rgba(255, 217, 138, 0.3)",
        },
        mint: {
          accent: "#10B981",
          glow: "rgba(16, 185, 129, 0.2)",
        },
        amber: {
          accent: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.2)",
        },
        coral: {
          accent: "#F43F5E",
          glow: "rgba(244, 63, 94, 0.2)",
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Outfit"', 'sans-serif'],
        cinematic: ['"Cinzel Decorative"', '"Outfit"', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'float-medium': 'floatSlow 4.5s ease-in-out infinite 1s',
        'shimmer-gold': 'shimmerGold 3s ease-in-out infinite alternate',
        'aurora': 'auroraGlow 8s ease-in-out infinite alternate',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmerGold: {
          '0%': { borderColor: 'rgba(255, 217, 138, 0.25)', boxShadow: '0 0 10px rgba(255, 217, 138, 0.1)' },
          '100%': { borderColor: 'rgba(255, 217, 138, 0.6)', boxShadow: '0 0 25px rgba(255, 217, 138, 0.35)' },
        },
        auroraGlow: {
          '0%': { filter: 'hue-rotate(0deg) opacity(0.8)' },
          '100%': { filter: 'hue-rotate(45deg) opacity(1)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
