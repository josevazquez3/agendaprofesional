/**
 * Respuesta para Chrome DevTools.
 * Chrome solicita este recurso automáticamente; al devolver 200 se evita el 404 en Vercel.
 */
export async function GET() {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
