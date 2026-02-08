import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

/**
 * Middleware Multi-Tenant
 * Determina la clínica activa y valida acceso
 */
export async function middleware(request: NextRequest) {
  // Solo aplicar en rutas del dashboard
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  // Obtener token de sesión
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Si no hay sesión, redirigir a login
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Extraer subdominio si existe
  const host = request.headers.get("host") || ""
  const subdomain = host.split(".")[0]

  // Si hay subdominio válido, agregarlo a headers para uso en server components
  if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
    const response = NextResponse.next()
    response.headers.set("x-clinic-slug", subdomain)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/dashboard/:path*",
  ],
}
