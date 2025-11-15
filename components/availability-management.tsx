"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { CalendarPlus, Loader2, X, Check } from "lucide-react"
import { es } from "date-fns/locale"

const DEFAULT_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
]

export function AvailabilityManagement() {
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlots, setSelectedSlots] = useState<string[]>(DEFAULT_TIME_SLOTS)
  const [daysWithSlots, setDaysWithSlots] = useState<Record<string, any[]>>({})

  useEffect(() => {
    loadAvailability()
  }, [])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Inicio del día actual
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 90) // Próximos 90 días

      const response = await fetch(`/api/availability?startDate=${today.toISOString()}&endDate=${endDate.toISOString()}`)
      const data = await response.json()
      setDaysWithSlots(data.slotsByDate || {})
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Error al cargar disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedDate) return

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString().split('T')[0],
          timeSlots: selectedSlots,
          maxBookingsPerSlot: 1,
        }),
      })

      if (response.ok) {
        toast.success('Disponibilidad configurada correctamente')
        setDialogOpen(false)
        loadAvailability()
      } else {
        toast.error('Error al configurar disponibilidad')
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Error al guardar')
    }
  }

  const handleCloseDay = async (date: string) => {
    try {
      const response = await fetch(`/api/availability?date=${date}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Día cerrado correctamente', {
          description: data.deletedCount ? `${data.deletedCount} horarios eliminados` : undefined
        })
        loadAvailability()
      } else {
        toast.error(data.error || 'Error al cerrar día', {
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error closing day:', error)
      toast.error('Error al cerrar día')
    }
  }

  const toggleTimeSlot = (time: string) => {
    setSelectedSlots(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time].sort()
    )
  }

  const getDayStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return daysWithSlots[dateStr]?.length > 0
  }

  return (
    <Card className="bg-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestión de Disponibilidad</h2>
            <p className="text-sm text-slate-600">Configura los días y horarios disponibles para reservas</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Configurar Día
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Calendario de Disponibilidad</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={es}
                  className="rounded-md border"
                  modifiers={{
                    available: (date) => getDayStatus(date),
                  }}
                  modifiersStyles={{
                    available: {
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontWeight: 'bold',
                    },
                  }}
                />
                <div className="mt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Días con disponibilidad configurada</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Días Configurados</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {Object.entries(daysWithSlots).length === 0 ? (
                    <p className="text-sm text-slate-500">No hay días configurados</p>
                  ) : (
                    Object.entries(daysWithSlots).map(([date, slots]) => (
                      <div key={date} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-slate-600">
                            {slots.length} horarios disponibles
                          </p>
                        </div>
                        <Button
                          onClick={() => handleCloseDay(date)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para configurar día */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Disponibilidad</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                className="rounded-md border"
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const compareDate = new Date(date)
                  compareDate.setHours(0, 0, 0, 0)
                  return compareDate < today
                }}
              />
              <p className="text-xs text-slate-600">Puedes seleccionar desde hoy en adelante</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Horarios Disponibles</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSlots(DEFAULT_TIME_SLOTS)}
                  >
                    Seleccionar todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSlots([])}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleTimeSlot(time)}
                    className={`py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                      selectedSlots.includes(time)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {selectedSlots.includes(time) && <Check className="w-3 h-3 inline mr-1" />}
                    {time}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600">{selectedSlots.length} horarios seleccionados</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!selectedDate || selectedSlots.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
