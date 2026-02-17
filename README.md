# Agenda Profesional - Sistema de Gestión Médica

Sistema completo de agenda profesional médica desarrollado con Next.js, PostgreSQL y Prisma.

## 🚀 Características

- ✅ Sistema de autenticación con 4 roles (Paciente, Profesional, Secretaria, Admin)
- ✅ Gestión completa de turnos con calendario interactivo
- ✅ Historia clínica digital con adjuntos
- ✅ Notificaciones por WhatsApp y Email
- ✅ Gestión de horarios y aranceles
- ✅ Múltiples consultorios por profesional
- ✅ Impresión de comprobantes de turno con QR
- ✅ Dashboard diferenciado por rol
- ✅ Diseño responsive y moderno

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd agendaprofesional
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `NEXTAUTH_SECRET`: Genera una clave secreta (puedes usar `openssl rand -base64 32`)
- `RESEND_API_KEY`: API key de Resend para emails
- `WHATSAPP_API_KEY`: API key para WhatsApp (Twilio o similar)

4. **Configurar la base de datos**
```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear las tablas en la base de datos
npx prisma db push

# (Opcional) Ejecutar migraciones
npx prisma migrate dev --name init

# (Opcional) Poblar la base de datos con datos de ejemplo
npm run db:seed
```

**Nota:** El seed crea usuarios de prueba:
- **Admin:** admin@agendaprofesional.com / admin123
- **Secretaria:** secretaria@agendaprofesional.com / secretaria123
- **Profesional:** profesional@agendaprofesional.com / profesional123

5. **Ejecutar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Estructura de la Base de Datos

El sistema utiliza las siguientes tablas principales:
- `User`: Usuarios del sistema con roles
- `Profesional`: Información de profesionales médicos
- `Turno`: Turnos agendados
- `HistoriaClinica`: Registros médicos
- `HorarioDisponible`: Horarios de atención
- `Consultorio`: Ubicaciones físicas
- `Arancel`: Precios de consultas
- `Notificacion`: Notificaciones in-app

## 👥 Roles y Permisos

### Paciente
- Registrarse y gestionar perfil
- Solicitar y cancelar turnos
- Ver su propia historia clínica
- Ver aranceles

### Profesional
- Gestionar turnos propios
- Ver y editar historia clínica de pacientes
- Configurar horarios propios
- Ver notificaciones

### Secretaria
- Gestionar turnos de todos los profesionales
- Editar historia clínica
- Configurar horarios y aranceles
- Gestionar consultorios

### Admin
- Acceso completo al sistema
- Gestionar usuarios y roles
- Configuración general

## 📱 Integraciones

### WhatsApp
El sistema está preparado para integrarse con WhatsApp Business API (Twilio, 360dialog, etc.). Configura las credenciales en `.env`.

**Nota:** Por defecto, los mensajes de WhatsApp se simulan en consola. Para habilitar el envío real, descomenta y configura el código en `lib/whatsapp.ts`.

### Email
Utiliza Resend para el envío de emails. Configura tu API key en `.env`.

**Nota:** Si no configuras Resend, los emails se simularán en consola sin errores.

## 📁 Estructura del Proyecto

```
agendaprofesional/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Dashboards por rol
│   ├── api/               # API routes
│   └── page.tsx           # Página de inicio
├── components/             # Componentes React
├── lib/                   # Utilidades y configuraciones
├── prisma/                # Esquema y migraciones
├── public/                # Archivos estáticos
└── types/                 # Tipos TypeScript
```

## ☁️ Despliegue en Vercel

Para que el login funcione en producción, configura estas variables en **Vercel → Project → Settings → Environment Variables**:

| Variable | Descripción |
|----------|-------------|
| `NEXTAUTH_SECRET` | Clave secreta para firmar la sesión (ej: `openssl rand -base64 32`). **Obligatoria**; sin ella `/api/auth/session` devuelve 500. |
| `NEXTAUTH_URL` | URL pública de la app (ej: `https://tu-proyecto.vercel.app`). |
| `DATABASE_URL` | URL de conexión a PostgreSQL (Neon, Vercel Postgres, etc.). |

Si ves error **500** en `/api/auth/session` o **CLIENT_FETCH_ERROR** de NextAuth, revisa que `NEXTAUTH_SECRET` esté definida en Vercel y que no tenga espacios al inicio/final.

## 🔒 Seguridad

- Autenticación con NextAuth.js
- Protección de rutas por rol mediante middleware
- Validación de datos con Zod (preparado)
- Sanitización de inputs
- Encriptación de contraseñas con bcrypt
- Protección CSRF integrada en NextAuth

## 🧪 Desarrollo

### Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run db:push` - Sincroniza el esquema de Prisma con la base de datos
- `npm run db:migrate` - Crea una nueva migración
- `npm run db:studio` - Abre Prisma Studio (interfaz visual de BD)
- `npm run db:seed` - Pobla la base de datos con datos de ejemplo

## 📝 Licencia

Este proyecto es privado y confidencial.

## 🤝 Soporte

Para soporte técnico, contacta al equipo de desarrollo.
