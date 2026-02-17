/**
 * Middleware mínimo: no hace nada.
 * Matcher vacío = nunca se ejecuta. Auth se delega solo a NextAuth.
 * Re-implementar protección de rutas más adelante sin getToken en edge.
 */
export function middleware() {}

export const config = { matcher: [] }
