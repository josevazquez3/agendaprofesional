import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getActiveClinic } from "@/lib/clinic-context"
import { getClinicSubscription } from "@/lib/subscription"
import { getClinicPlanLimits, getClinicCurrentUsage } from "@/lib/plan-limits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Users, UserCheck, Calendar, HardDrive, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Progress } from "@/components/ui/progress"
import { PlanPageClient } from "./plan-page-client"

export default async function PlanPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const clinic = await getActiveClinic()
  if (!clinic) {
    redirect("/dashboard")
  }

  const subscription = await getClinicSubscription(clinic.id)
  const limits = await getClinicPlanLimits(clinic.id)
  const usage = await getClinicCurrentUsage(clinic.id)

  if (!subscription || !limits) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mi Plan" subtitle="Gestión de suscripción" />
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-[#F59E0B] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                No hay plan asignado
              </h3>
              <p className="text-sm text-[#64748B] mb-6">
                Contacta con el administrador para asignar un plan a tu clínica.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PlanPageClient
      subscription={subscription}
      limits={limits}
      usage={usage}
      clinicId={clinic.id}
    />
  )
}
