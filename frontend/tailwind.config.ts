import type { Config } from "tailwindcss";

const config: Config = {
  /**
   * Multi-theme dark mode — `dark:` variants activate when *any* of our
   * three dark themes (aurora-dark, forest, neon) is the active class.
   * Sunset and aurora-light don't trigger dark variants.
   */
  darkMode: [
    "variant",
    [
      "&:is(.aurora-dark *)",
      "&:is(.forest *)",
      "&:is(.neon *)",
      "&:is(.aurora-dark)",
      "&:is(.forest)",
      "&:is(.neon)",
    ],
  ],
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    screens: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "monospace",
        ],
      },
      colors: {
        /**
         * Brand color scale — driven by CSS custom properties so it
         * re-tints automatically per theme:
         *
         *   aurora-* themes → electric cyan
         *   sunset           → warm coral-orange
         *   forest           → emerald green
         *   neon             → hot magenta
         *
         * Each shade is defined as `hsl(var(--brand-X) / <alpha-value>)`
         * so Tailwind opacity modifiers like `bg-brand-500/15` still work.
         */
        brand: {
          300: "hsl(var(--brand-300) / <alpha-value>)",
          400: "hsl(var(--brand-400) / <alpha-value>)",
          500: "hsl(var(--brand-500) / <alpha-value>)",
          600: "hsl(var(--brand-600) / <alpha-value>)",
        },
      },
      boxShadow: {
        soft: "0 1px 2px hsla(222, 32%, 9%, 0.04), 0 10px 30px -12px hsla(222, 32%, 9%, 0.14)",
        glow: "0 0 0 1px hsla(188, 92%, 50%, 0.35), 0 10px 30px -8px hsla(188, 92%, 50%, 0.45), 0 0 40px -4px hsla(262, 84%, 64%, 0.3)",
        aurora: "0 20px 60px -20px hsla(262, 84%, 64%, 0.4), 0 10px 30px -10px hsla(188, 92%, 50%, 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
