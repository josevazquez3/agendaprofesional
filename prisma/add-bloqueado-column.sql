-- Agregar columna bloqueado a User (ejecutar manualmente si prisma db push da warning)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bloqueado" BOOLEAN NOT NULL DEFAULT false;
