import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

type RouteContext = { params?: Promise<Record<string, string | string[]>> }

function wrapHandler(method: "GET" | "POST") {
  return async (req: Request, context: RouteContext) => {
    if (!process.env.NEXTAUTH_SECRET?.trim()) {
      console.error(
        "[NextAuth] NEXTAUTH_SECRET is not set. Add it in Vercel → Project → Settings → Environment Variables."
      )
      return new Response(
        JSON.stringify({ error: "Auth configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
    try {
      return await handler(req, context as any)
    } catch (err) {
      console.error("[NextAuth] Route error:", err)
      return new Response(
        JSON.stringify({ error: "Auth configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }
}

export const GET = wrapHandler("GET")
export const POST = wrapHandler("POST")
