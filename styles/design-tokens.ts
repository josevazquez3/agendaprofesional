/**
 * Design Tokens - Sistema de diseño centralizado
 * Valores base para mantener consistencia visual en toda la aplicación
 */

export const designTokens = {
  colors: {
    // Colores primarios
    primary: {
      DEFAULT: "#2563EB",
      hover: "#1E40AF",
      light: "#EFF6FF",
      dark: "#1E3A8A",
    },
    // Colores secundarios
    secondary: {
      DEFAULT: "#0EA5A4",
      hover: "#0D9488",
      light: "#E0F2F1",
    },
    // Colores de acento
    accent: {
      DEFAULT: "#7C3AED",
      hover: "#6D28D9",
      light: "#F3E8FF",
    },
    // Colores de texto
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
      tertiary: "#94A3B8",
      inverse: "#FFFFFF",
    },
    // Colores de fondo
    background: {
      DEFAULT: "#F8FAFC",
      card: "#FFFFFF",
      hover: "#F1F5F9",
    },
    // Colores de bordes
    border: {
      DEFAULT: "#E2E8F0",
      light: "#F1F5F9",
      dark: "#CBD5E1",
    },
    // Estados
    status: {
      success: {
        DEFAULT: "#10B981",
        light: "#D1FAE5",
        dark: "#065F46",
      },
      warning: {
        DEFAULT: "#F59E0B",
        light: "#FEF3C7",
        dark: "#92400E",
      },
      error: {
        DEFAULT: "#EF4444",
        light: "#FEE2E2",
        dark: "#991B1B",
      },
      info: {
        DEFAULT: "#2563EB",
        light: "#DBEAFE",
        dark: "#1E40AF",
      },
    },
  },
  spacing: {
    // Espaciado vertical entre secciones
    section: "1.5rem", // 24px - space-y-6
    // Espaciado interno de cards
    card: "1.5rem", // 24px - p-6
    // Espaciado entre elementos relacionados
    element: "0.75rem", // 12px - gap-3
    // Espaciado entre elementos no relacionados
    group: "1rem", // 16px - gap-4
  },
  borderRadius: {
    // Cards principales
    card: "1rem", // 16px - rounded-2xl
    // Botones
    button: "0.75rem", // 12px - rounded-xl
    // Inputs
    input: "0.75rem", // 12px - rounded-xl
    // Badges y chips
    badge: "0.5rem", // 8px - rounded-lg
  },
  shadows: {
    // Sombra base para cards
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    // Sombra en hover
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    // Sombra elevada
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    // Sombra para modales
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
  transitions: {
    // Transición estándar
    DEFAULT: "all 200ms ease-out",
    // Transición rápida
    fast: "all 150ms ease-out",
    // Transición lenta
    slow: "all 300ms ease-out",
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  layout: {
    // Ancho máximo del contenido principal
    maxWidth: "1400px",
    // Ancho de la sidebar
    sidebarWidth: "260px",
    sidebarCollapsedWidth: "72px",
    // Altura del topbar
    topbarHeight: "72px",
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const

// Helper para usar tokens en Tailwind
export const tokenClasses = {
  card: "rounded-2xl border border-[#E2E8F0] shadow-sm",
  cardHover: "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out",
  buttonPrimary: "bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02]",
  buttonSecondary: "border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl transition-all duration-200 ease-out",
  input: "rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] transition-all duration-200 ease-out",
  sectionSpacing: "space-y-6",
  containerPadding: "p-6",
} as const
