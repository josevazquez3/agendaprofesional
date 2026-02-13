/**
 * Sistema de tipografía centralizado
 * Jerarquía estricta para consistencia total
 */

export const typography = {
  // Títulos de página principales
  pageTitle: "text-4xl font-semibold text-[#0F172A] font-inter",
  // Títulos de sección
  sectionTitle: "text-2xl font-semibold text-[#0F172A] font-inter",
  // Títulos de cards
  cardTitle: "text-xl font-medium text-[#0F172A] font-inter",
  // Texto principal (aumentado de text-lg a text-xl)
  body: "text-xl text-[#0F172A]",
  // Texto secundario (aumentado de text-lg a text-xl)
  secondary: "text-xl text-[#64748B]",
  // Texto muted (aumentado de text-lg a text-xl)
  muted: "text-xl text-[#94A3B8]",
  // Texto pequeño (aumentado de text-base a text-lg)
  small: "text-lg text-[#64748B]",
  // Labels de formularios (aumentado de text-lg a text-xl)
  label: "text-xl font-medium text-[#0F172A]",
  // Subtítulos (aumentado de text-lg a text-xl)
  subtitle: "text-xl text-[#64748B]",
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
