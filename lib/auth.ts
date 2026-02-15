import type { User } from "next-auth"
import type { Role } from "@/types/next-auth"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { logLogin } from "@/lib/audit-service"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Usar SQL raw para evitar problemas con schema desincronizado
          const users = await prisma.$queryRaw<Array<{
            id: string
            email: string
            password: string
            nombre: string
            role: string
          }>>`
            SELECT id, email, password, nombre, role 
            FROM User 
            WHERE email = ${credentials.email}
            LIMIT 1
          `

          if (!users || users.length === 0) {
            return null
          }

          const user = users[0]

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Registrar auditoría de login (completamente opcional, no bloquea)
          try {
            // Intentar obtener clínica asociada para auditoría
            const clinicUsers = await prisma.$queryRaw<Array<{
              clinicId: string
            }>>`
              SELECT clinicId 
              FROM ClinicUser 
              WHERE userId = ${user.id} AND activo = 1
              LIMIT 1
            `
            
            if (clinicUsers && clinicUsers.length > 0) {
              await logLogin(clinicUsers[0].clinicId, user.id, req as any)
            }
          } catch (auditError) {
            // Ignorar completamente errores de auditoría
            // El login debe continuar sin importar si la auditoría falla
          }

          return {
            id: user.id,
            email: user.email,
            name: user.nombre,
            role: user.role,
          } as User
        } catch (error) {
          console.error("[AUTH] Error en authorize:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role
        session.user.id = token.id as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
