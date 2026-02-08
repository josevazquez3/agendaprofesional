/**
 * Sistema de tipografía centralizado
 * Jerarquía estricta para consistencia total
 */

export const typography = {
  // Títulos de página principales
  pageTitle: "text-2xl font-semibold text-[#0F172A] font-inter",
  // Títulos de sección
  sectionTitle: "text-lg font-semibold text-[#0F172A] font-inter",
  // Títulos de cards
  cardTitle: "text-base font-medium text-[#0F172A] font-inter",
  // Texto principal
  body: "text-sm text-[#0F172A]",
  // Texto secundario
  secondary: "text-sm text-[#64748B]",
  // Texto muted
  muted: "text-sm text-[#94A3B8]",
  // Texto pequeño
  small: "text-xs text-[#64748B]",
  // Labels de formularios
  label: "text-sm font-medium text-[#0F172A]",
  // Subtítulos
  subtitle: "text-sm text-[#64748B]",
} as const

export const spacing = {
  // Entre secciones principales
  section: "space-y-6",
  // Entre cards en grids
  grid: "gap-6",
  // Padding interno de cards
  card: "p-6",
  // Espaciado en formularios
  form: "space-y-4",
  // Espaciado entre elementos relacionados
  element: "space-y-3",
  // Espaciado mínimo
  tight: "space-y-2",
} as const

export const iconography = {
  // Iconos en texto
  text: "h-4 w-4",
  // Iconos en headers
  header: "h-5 w-5",
  // Iconos en métricas
  metric: "h-6 w-6",
  // Iconos grandes (empty states, etc)
  large: "h-12 w-12",
  // Stroke width estándar
  strokeWidth: 1.5,
} as const
