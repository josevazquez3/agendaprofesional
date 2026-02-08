/**
 * Métricas UX Internas
 * Hooks preparados para tracking (no envía a analytics externos aún)
 */

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: number
}

class Analytics {
  private events: AnalyticsEvent[] = []
  private enabled = true

  /**
   * Trackear un evento
   */
  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) return

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    }

    this.events.push(analyticsEvent)

    // En desarrollo, loguear en consola
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics]", event, properties)
    }

    // En producción, aquí se enviaría a analytics externo
    // Por ahora, solo almacenamos localmente
    this.saveToStorage()
  }

  /**
   * Medir tiempo de una acción
   */
  timeStart(label: string) {
    if (!this.enabled) return
    performance.mark(`${label}-start`)
  }

  timeEnd(label: string, properties?: Record<string, any>) {
    if (!this.enabled) return

    try {
      performance.mark(`${label}-end`)
      performance.measure(label, `${label}-start`, `${label}-end`)
      const measure = performance.getEntriesByName(label)[0]
      const duration = measure.duration

      this.track(`timing:${label}`, {
        duration,
        ...properties,
      })

      // Limpiar marks
      performance.clearMarks(`${label}-start`)
      performance.clearMarks(`${label}-end`)
      performance.clearMeasures(label)
    } catch (error) {
      console.error("Error measuring time:", error)
    }
  }

  /**
   * Contar clicks en un flujo
   */
  trackClick(element: string, context?: string) {
    this.track("click", {
      element,
      context,
    })
  }

  /**
   * Trackear abandono de formulario
   */
  trackFormAbandon(formName: string, fieldsCompleted: number, totalFields: number) {
    this.track("form_abandon", {
      form_name: formName,
      fields_completed: fieldsCompleted,
      total_fields: totalFields,
      completion_rate: (fieldsCompleted / totalFields) * 100,
    })
  }

  /**
   * Trackear uso de acciones rápidas
   */
  trackQuickAction(action: string) {
    this.track("quick_action", {
      action,
    })
  }

  /**
   * Guardar eventos en localStorage
   */
  private saveToStorage() {
    if (typeof window === "undefined") return

    try {
      // Mantener solo últimos 100 eventos
      const recentEvents = this.events.slice(-100)
      localStorage.setItem("analytics_events", JSON.stringify(recentEvents))
    } catch (error) {
      console.error("Error saving analytics:", error)
    }
  }

  /**
   * Obtener eventos almacenados
   */
  getEvents(): AnalyticsEvent[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem("analytics_events")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Limpiar eventos
   */
  clearEvents() {
    this.events = []
    if (typeof window !== "undefined") {
      localStorage.removeItem("analytics_events")
    }
  }

  /**
   * Habilitar/deshabilitar analytics
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
}

// Singleton instance
export const analytics = new Analytics()

// Hook para usar en componentes
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    timeStart: analytics.timeStart.bind(analytics),
    timeEnd: analytics.timeEnd.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackFormAbandon: analytics.trackFormAbandon.bind(analytics),
    trackQuickAction: analytics.trackQuickAction.bind(analytics),
  }
}
