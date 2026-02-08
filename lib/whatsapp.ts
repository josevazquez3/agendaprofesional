// Integración con WhatsApp Business API
// Ejemplo usando Twilio, pero puedes adaptarlo a otros proveedores

export async function sendWhatsAppMessage({
  to,
  message,
}: {
  to: string
  message: string
}) {
  // Ejemplo con Twilio
  // Necesitarás instalar: npm install twilio
  
  try {
    // Descomenta y configura según tu proveedor de WhatsApp
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const client = require('twilio')(accountSid, authToken)

    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.WHATSAPP_PHONE_NUMBER}`,
      to: `whatsapp:${to}`
    })

    return { success: true, sid: result.sid }
    */

    // Por ahora, solo logueamos el mensaje
    console.log(`WhatsApp a ${to}: ${message}`)
    return { success: true, message: "WhatsApp enviado (simulado)" }
  } catch (error) {
    console.error("Error enviando WhatsApp:", error)
    return { success: false, error }
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
