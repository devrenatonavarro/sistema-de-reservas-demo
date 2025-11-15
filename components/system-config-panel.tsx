"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Save, Loader2 } from "lucide-react"

interface ConfigItem {
  value: string
  description: string | null
}

interface Config {
  business_name?: ConfigItem
  business_hours?: ConfigItem
  booking_duration?: ConfigItem
  max_bookings_per_day?: ConfigItem
}

export function SystemConfigPanel() {
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/config')
      const data = await response.json()
      setConfig(data.config || {})
    } catch (error) {
      console.error('Error loading config:', error)
      toast.error('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (key: string, value: string) => {
    try {
      setSaving(true)
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      })

      if (response.ok) {
        toast.success('Configuración actualizada')
        loadConfig()
      } else {
        toast.error('Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const updates = []
      
      // Recopilar todas las actualizaciones
      for (const [key, value] of formData.entries()) {
        updates.push(
          fetch('/api/config', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key, value: value.toString() }),
          })
        )
      }
      
      // Ejecutar todas las actualizaciones en paralelo
      const responses = await Promise.all(updates)
      
      // Verificar si todas fueron exitosas
      const allSuccessful = responses.every(res => res.ok)
      
      if (allSuccessful) {
        toast.success('Configuración actualizada correctamente')
        loadConfig()
      } else {
        toast.error('Error al guardar algunos valores')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-white">
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Configuración del Sistema</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business_name">Nombre del Negocio</Label>
            <Input
              id="business_name"
              name="business_name"
              defaultValue={config.business_name?.value || ''}
              placeholder="Mi Negocio"
              className="max-w-md"
            />
            <p className="text-sm text-slate-500">{config.business_name?.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_hours">Horario de Atención</Label>
            <Input
              id="business_hours"
              name="business_hours"
              defaultValue={config.business_hours?.value || ''}
              placeholder="09:00-18:00"
              className="max-w-md"
            />
            <p className="text-sm text-slate-500">{config.business_hours?.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking_duration">Duración de Citas (minutos)</Label>
            <Input
              id="booking_duration"
              name="booking_duration"
              type="number"
              defaultValue={config.booking_duration?.value || ''}
              placeholder="30"
              className="max-w-md"
            />
            <p className="text-sm text-slate-500">{config.booking_duration?.description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_bookings_per_day">Máximo de Citas por Día</Label>
            <Input
              id="max_bookings_per_day"
              name="max_bookings_per_day"
              type="number"
              defaultValue={config.max_bookings_per_day?.value || ''}
              placeholder="20"
              className="max-w-md"
            />
            <p className="text-sm text-slate-500">{config.max_bookings_per_day?.description}</p>
          </div>

          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </form>
      </div>
    </Card>
  )
}
