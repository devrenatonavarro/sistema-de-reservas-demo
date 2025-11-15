"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AvailableSlotsProps {
  type: "date" | "time"
  onSelect: (value: string) => void
  date?: string
  refreshKey?: number
}

export function AvailableSlots({ type, onSelect, date, refreshKey }: AvailableSlotsProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (type === "date") {
      fetchAvailableDates()
    }
  }, [type])

  useEffect(() => {
    if (type === "time" && date) {
      fetchAvailableTimeSlots(date)
    }
  }, [type, date, refreshKey])

  const fetchAvailableDates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/slots')
      const data = await response.json()
      setAvailableDates(data.dates || [])
    } catch (error) {
      console.error('Error fetching dates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTimeSlots = async (selectedDate: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/slots?date=${selectedDate}`)
      const data = await response.json()
      
      // Usar isPastServer (basado en hora de España configurada en el servidor)
      const slotsWithPastInfo = (data.slots || []).map((slot: any) => {
        return {
          ...slot,
          isPastTime: slot.isPastServer,
          isAvailable: !slot.isPastServer && slot.isAvailable
        }
      })
      
      setAvailableTimeSlots(slotsWithPastInfo)
    } catch (error) {
      console.error('Error fetching time slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  if (type === "date") {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      date.setHours(0, 0, 0, 0)
      // Crear el string de fecha manualmente para evitar problemas de timezone
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const isAvailable = availableDates.includes(dateStr)
      days.push(date >= today && isAvailable ? date : null)
    }

    if (loading) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Selecciona una fecha</h3>
          <div className="text-center py-8">
            <p className="text-slate-600">Cargando fechas disponibles...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Selecciona una fecha</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">
              {currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth} className="p-2 h-auto bg-transparent">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth} className="p-2 h-auto bg-transparent">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                {day}
              </div>
            ))}
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => {
                  if (date) {
                    // Crear el string de fecha manualmente para evitar problemas de timezone
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const dateStr = `${year}-${month}-${day}`
                    onSelect(dateStr)
                  }
                }}
                disabled={!date}
                className={`py-2 text-sm rounded-lg font-medium transition-colors ${
                  date
                    ? "bg-slate-100 text-slate-700 hover:bg-blue-500 hover:text-white cursor-pointer"
                    : "text-slate-300 cursor-not-allowed"
                }`}
              >
                {date ? date.getDate() : ""}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Time slots
  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Selecciona una hora</h3>
        <div className="text-center py-8">
          <p className="text-slate-600">Cargando horarios disponibles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Selecciona una hora</h3>

      <div className="grid grid-cols-3 gap-3">
        {availableTimeSlots.length === 0 ? (
          <div className="col-span-3 text-center py-8">
            <p className="text-slate-600">No hay horarios disponibles para esta fecha</p>
          </div>
        ) : (
          availableTimeSlots.map((slot) => {
            const isAvailable = slot.isAvailable
            const isPastTime = slot.isPastTime
            return (
              <button
                key={slot.id}
                onClick={() => {
                  if (isAvailable) {
                    onSelect(slot.time)
                  }
                }}
                disabled={!isAvailable}
                className={`py-3 px-2 rounded-lg font-medium transition-colors text-sm ${
                  isAvailable
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-200 cursor-pointer"
                    : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                }`}
              >
                {slot.time}
                {!isAvailable && (
                  <span className="block text-xs mt-1">
                    {isPastTime ? 'Pasado' : 'Reservado'}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
