# Reinicio limpio del servidor de desarrollo
# 1. Cierra TODAS las terminales donde corra "npm run dev"
# 2. Ejecuta este script: .\reiniciar-dev.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Eliminando carpeta .next..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "  (no existia)" -ForegroundColor Gray
}

Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Yellow
Write-Host "Espera a ver 'Ready' o 'compiled' antes de abrir el navegador." -ForegroundColor Cyan
Write-Host ""
npm run dev
