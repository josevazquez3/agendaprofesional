import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isPublicPage = req.nextUrl.pathname === "/"

    // Si está en página pública o de auth, permitir acceso
    if (isPublicPage || isAuthPage) {
      return NextResponse.next()
    }

    // Si no está autenticado y no está en página pública/auth, redirigir a login
    if (!token && !isPublicPage && !isAuthPage) {
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    // Verificar permisos por rol
    const path = req.nextUrl.pathname

    // Rutas de admin (solo ADMIN y OWNER)
    if (path.startsWith("/dashboard/admin")) {
      if (token?.role !== "ADMIN" && token?.role !== "OWNER") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Rutas de secretaria
    if (
      path.startsWith("/dashboard/secretaria") &&
      token?.role !== "SECRETARIA" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Rutas de profesional
    if (
      path.startsWith("/dashboard/profesional") &&
      token?.role !== "PROFESIONAL" &&
      token?.role !== "SECRETARIA" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
        const isPublicPage = req.nextUrl.pathname === "/"

        // Permitir acceso a páginas públicas y de auth
        if (isPublicPage || isAuthPage) {
          return true
        }

        // Requerir autenticación para otras páginas
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
    "/api/turnos/:path*",
    "/api/historia-clinica/:path*",
  ],
}
