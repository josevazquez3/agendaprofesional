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

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: { 
              id: true, 
              email: true, 
              password: true, 
              nombre: true, 
              role: true 
              // ← "bloqueado" eliminado porque no existe en el schema
            },
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          try {
            const clinicUser = await prisma.clinicUser.findFirst({
              where: { userId: user.id, activo: true },
              select: { clinicId: true },
            })
            if (clinicUser) {
              await logLogin(clinicUser.clinicId, user.id, req as any)
            }
          } catch (auditError) {
            // Ignorar errores de auditoría para no bloquear el login
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
        session.user.role = (token.role ?? "PACIENTE") as Role
        session.user.id = (token.id ?? "") as string
        session.user.name = (token.name ?? token.email ?? "") as string
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