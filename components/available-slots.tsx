"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AvailableSlotsProps {
  type: "date" | "time"
  onSelect: (value: string) => void
  date?: string
}

export function AvailableSlots({ type, onSelect, date }: AvailableSlotsProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({})

  useEffect(() => {
    // Load booked slots from localStorage
    const bookings = JSON.parse(localStorage.getItem("bookings") || "[]")
    const slots: Record<string, string[]> = {}
    bookings.forEach((booking: any) => {
      if (!slots[booking.date]) slots[booking.date] = []
      slots[booking.date].push(booking.time)
    })
    setBookedSlots(slots)
  }, [])

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
      days.push(date >= today ? date : null)
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
                    const dateStr = date.toISOString().split("T")[0]
                    localStorage.setItem("currentBookingDate", dateStr)
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
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

  const bookedTimes = bookedSlots[date] || []

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Selecciona una hora</h3>

      <div className="grid grid-cols-3 gap-3">
        {timeSlots.map((time) => {
          const isBooked = bookedTimes.includes(time)
          return (
            <button
              key={time}
              onClick={() => {
                localStorage.setItem("currentBookingTime", time)
                onSelect(time)
              }}
              disabled={isBooked}
              className={`py-3 px-2 rounded-lg font-medium transition-colors text-sm ${
                isBooked
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-200"
              }`}
            >
              {time}
            </button>
          )
        })}
      </div>
    </div>
  )
}
