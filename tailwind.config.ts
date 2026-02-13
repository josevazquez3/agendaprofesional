import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1E40AF",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#0EA5A4",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "#7C3AED",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "hsl(var(--card-foreground))",
        },
        // Paleta personalizada para el diseño
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
        "bg-primary": "#F8FAFC",
        "border-color": "#E2E8F0",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      fontSize: {
        xs: ["1rem", { lineHeight: "1.5rem" }],      // 16px (aumentado desde 15px)
        sm: ["1.125rem", { lineHeight: "1.75rem" }],      // 18px (aumentado desde 17px)
        base: ["1.25rem", { lineHeight: "1.875rem" }],   // 20px (aumentado desde 19px)
        lg: ["1.375rem", { lineHeight: "2rem" }],       // 22px (aumentado desde 21px)
        xl: ["1.625rem", { lineHeight: "2.25rem" }],      // 26px (aumentado desde 24px)
        "2xl": ["2rem", { lineHeight: "2.5rem" }],        // 32px (aumentado desde 30px)
        "3xl": ["2.5rem", { lineHeight: "3rem" }],   // 40px (aumentado desde 36px)
        "4xl": ["3rem", { lineHeight: "3.5rem" }],      // 48px (aumentado desde 42px)
        "5xl": ["4rem", { lineHeight: "1" }],                // 64px (aumentado desde 56px)
        "6xl": ["4.75rem", { lineHeight: "1" }],            // 76px (aumentado desde 68px)
        "7xl": ["5.5rem", { lineHeight: "1" }],             // 88px (aumentado desde 80px)
        "8xl": ["7rem", { lineHeight: "1" }],               // 112px (aumentado desde 104px)
        "9xl": ["9rem", { lineHeight: "1" }],               // 144px (aumentado desde 136px)
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
