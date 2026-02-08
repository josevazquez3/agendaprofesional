# Configuración SMTP Gmail - Guía Completa

## Requisitos Previos

Para usar Gmail SMTP en esta aplicación, necesitas:

1. **Cuenta de Gmail** activa
2. **Verificación en 2 pasos** activada en tu cuenta de Google
3. **App Password** (Contraseña de aplicación) generada

## Pasos para Configurar Gmail SMTP

### Paso 1: Activar Verificación en 2 Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/security
2. Busca la sección "Verificación en 2 pasos"
3. Actívala siguiendo las instrucciones

### Paso 2: Generar App Password (Contraseña de Aplicación)

1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona "Aplicación" → "Correo"
3. Selecciona "Dispositivo" → "Otro (nombre personalizado)"
4. Ingresa un nombre descriptivo (ej: "Agenda Profesional")
5. Haz clic en "Generar"
6. **Copia la contraseña de 16 caracteres** que aparece (formato: `xxxx xxxx xxxx xxxx`)

⚠️ **IMPORTANTE**: Esta contraseña solo se muestra una vez. Guárdala en un lugar seguro.

### Paso 3: Configurar en la Aplicación

1. Inicia sesión como **ADMIN**
2. Ve a **Configuración** → **Configuración del Sistema**
3. En la sección **"Configuración SMTP Gmail"**:
   - Ingresa tu **email de Gmail** (ej: `tu-email@gmail.com`)
   - Ingresa el **nombre del remitente** (ej: "Agenda Profesional")
   - Ingresa la **App Password** de 16 caracteres (puedes ingresarla con o sin espacios)
4. Haz clic en **"Probar conexión"** para verificar que todo funcione
5. Si la prueba es exitosa, guarda la configuración

## Parámetros SMTP de Gmail (Auto-completados)

Cuando ingresas un email de Gmail, el sistema automáticamente configura:

- **Host**: `smtp.gmail.com`
- **Puerto**: `587`
- **Seguridad**: `TLS` (habilitado)

## Validaciones Implementadas

El sistema valida automáticamente:

- ✅ Formato de email Gmail (`@gmail.com` o `@googlemail.com`)
- ✅ Contraseña de aplicación de exactamente 16 caracteres
- ✅ Campos requeridos completos

## Variables de Entorno (Opcional)

Si prefieres configurar SMTP mediante variables de entorno, agrega al archivo `.env`:

```env
# Configuración SMTP Gmail
EMAIL_FROM=tu-email@gmail.com
EMAIL_FROM_NAME=Agenda Profesional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_SECURE=true
```

**Nota**: La contraseña debe ser la App Password de 16 caracteres, no tu contraseña normal de Gmail.

## Solución de Problemas

### Error: "Invalid login"

- Verifica que la verificación en 2 pasos esté activada
- Asegúrate de estar usando la App Password, no tu contraseña normal
- Verifica que la App Password tenga exactamente 16 caracteres (sin espacios)

### Error: "Connection timeout"

- Verifica tu conexión a internet
- Asegúrate de que el puerto 587 no esté bloqueado por tu firewall

### Error: "Authentication failed"

- Verifica que el email y la App Password sean correctos
- Asegúrate de que la App Password no haya sido revocada en tu cuenta de Google

## Seguridad

- ⚠️ **NUNCA** uses tu contraseña normal de Gmail
- ✅ **SIEMPRE** usa una App Password (Contraseña de aplicación)
- 🔒 La App Password se almacena encriptada en la base de datos
- 🔐 Solo usuarios con rol ADMIN pueden configurar SMTP

## Soporte para Otros Proveedores SMTP

El sistema también soporta otros proveedores SMTP. Usa la sección "Configuración SMTP Avanzada" para configurar manualmente:

- Outlook/Office 365
- Yahoo Mail
- Proveedores personalizados

Consulta la documentación de tu proveedor para obtener los parámetros SMTP correctos.
