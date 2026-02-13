import "next-auth"

type Role = "PACIENTE" | "PROFESIONAL" | "SECRETARIA" | "ADMIN" | "OWNER" | "PLATFORM_OWNER"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    name: string
  }
}
