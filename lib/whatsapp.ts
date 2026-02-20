// Integración con WhatsApp: CallMeBot (1 clave) o Twilio (Business API)
// La configuración se toma de la DB o de variables de entorno

import { getConfiguracion } from "./configuracion-helpers"

function normalizePhoneForCallMeBot(to: string): string {
  let s = to.trim().replace(/^whatsapp:/, "").replace(/\D/g, "")
  if (s.length <= 10) s = `54${s}` // Argentina por defecto
  return s // CallMeBot: solo dígitos con código de país (ej. 5491112345678)
}

export async function sendWhatsAppMessage({
  to,
  message,
}: {
  to: string
  message: string
}) {
  try {
    const config = await getConfiguracion()

    if (!config.whatsappEnabled) {
      return { success: true, message: "WhatsApp deshabilitado en configuración" }
    }

    const provider = (config.whatsappProvider || "twilio").toLowerCase()

    // CallMeBot: solo API key (guardada en whatsappAccountSid), 1 campo
    if (provider === "callmebot") {
      const apiKey = (config.whatsappAccountSid || process.env.CALLMEBOT_WHATSAPP_API_KEY || "").trim()
      if (!apiKey) {
        console.warn("WhatsApp (CallMeBot): falta API Key. Obtén una en callmebot.com")
        return { success: true, message: "WhatsApp CallMeBot no configurado (simulado)" }
      }
      const phone = normalizePhoneForCallMeBot(to)
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`
      const res = await fetch(url, { method: "GET" })
      const text = await res.text()
      if (!res.ok) {
        console.error("CallMeBot error:", res.status, text)
        return { success: false, error: text || "Error al enviar por CallMeBot" }
      }
      return { success: true, message: "Enviado vía CallMeBot" }
    }

    // Twilio (y resto): Account SID, Auth Token, número
    const accountSid = config.whatsappAccountSid || process.env.TWILIO_ACCOUNT_SID || process.env.WHATSAPP_ACCOUNT_SID
    const authToken = config.whatsappAuthToken || process.env.TWILIO_AUTH_TOKEN || process.env.WHATSAPP_AUTH_TOKEN
    const fromNumber = config.whatsappPhoneNumber || process.env.WHATSAPP_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      console.warn("WhatsApp: faltan credenciales (Account SID, Auth Token o número). Configure en Configuración o use TWILIO_* / WHATSAPP_* en .env")
      return { success: true, message: "WhatsApp no configurado (simulado)" }
    }

    const fromFormatted = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber.trim()}`
    let toFormatted = to.trim().replace(/^whatsapp:/, "")
    if (!toFormatted.startsWith("+")) {
      const digits = toFormatted.replace(/\D/g, "")
      toFormatted = digits.length <= 10 ? `+54${digits}` : `+${digits}`
    }
    const toWhatsApp = `whatsapp:${toFormatted}`

    const twilio = await import("twilio")
    const client = twilio.default(accountSid, authToken)

    const result = await client.messages.create({
      body: message,
      from: fromFormatted,
      to: toWhatsApp,
    })

    return { success: true, sid: result.sid }
  } catch (error: unknown) {
    console.error("Error enviando WhatsApp:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al enviar WhatsApp",
    }
  }
}

export function generateTurnoConfirmationWhatsApp(
  pacienteNombre: string,
  profesionalNombre: string,
  fecha: string,
  hora: string,
  codigoTurno: string
) {
  return `✅ Turno Confirmado

Estimado/a ${pacienteNombre},

Su turno ha sido confirmado:
👨‍⚕️ Profesional: ${profesionalNombre}
📅 Fecha: ${fecha}
🕐 Hora: ${hora}
🔢 Código: ${codigoTurno}

Por favor, llegue 10 minutos antes.

Para cancelar: responda CANCELAR ${codigoTurno}`
}

export function generateTurnoCancellationWhatsApp(
  pacienteNombre: string,
  profesionalNombre: string,
  fecha: string,
  hora: string
) {
  return `❌ Turno Cancelado

Estimado/a ${pacienteNombre},

Su turno ha sido cancelado:
👨‍⚕️ Profesional: ${profesionalNombre}
📅 Fecha: ${fecha}
🕐 Hora: ${hora}

Puede solicitar un nuevo turno desde su panel.`
}
