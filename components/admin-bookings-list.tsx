"use client"

import React, { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface Booking {
  id: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  createdAt: string
}

interface AdminBookingsListProps {
  bookings?: Booking[]
  onDelete: (id: number) => void
}

export function AdminBookingsList({ bookings = [], onDelete }: AdminBookingsListProps) {
  // State read from localStorage to simulate a websocket
  const [bookingsState, setBookingsState] = useState<Booking[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("bookings") || "[]")
    } catch (e) {
      return bookings
    }
  })

  // Keep a serialized snapshot to detect changes by polling (fallback for same-window updates)
  const lastSerializedRef = useRef<string>(JSON.stringify(bookingsState))

  useEffect(() => {
    // Handler for storage events (fires on other windows/tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bookings") {
        try {
          const parsed = JSON.parse(e.newValue || "[]")
          setBookingsState(parsed)
          lastSerializedRef.current = JSON.stringify(parsed)
        } catch (err) {
          // ignore parse errors
        }
      }
    }

    window.addEventListener("storage", onStorage)

    // Polling fallback for same-window changes (simple and acceptable for a demo)
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("bookings") || "[]"
        if (raw !== lastSerializedRef.current) {
          const parsed = JSON.parse(raw)
          lastSerializedRef.current = raw
          setBookingsState(parsed)
        }
      } catch (err) {
        // ignore
      }
    }, 800) // 800ms is responsive enough for a demo

    return () => {
      window.removeEventListener("storage", onStorage)
      clearInterval(interval)
    }
  }, [])

  // If parent passes bookings prop, keep it as seed but the component primarily reads localStorage
  useEffect(() => {
    if (!bookings || bookings.length === 0) return
    // only set if localStorage is empty to avoid overwriting
    try {
      const raw = localStorage.getItem("bookings")
      if (!raw || raw === "[]") {
        localStorage.setItem("bookings", JSON.stringify(bookings))
        setBookingsState(bookings)
        lastSerializedRef.current = JSON.stringify(bookings)
      }
    } catch (err) {
      // ignore
    }
  }, [bookings])

  const sortedBookings = [...bookingsState].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`)
    const dateB = new Date(`${b.date}T${b.time}`)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <Card className="bg-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Lista de Reservas</h2>
        </div>

        {sortedBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No hay reservas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Teléfono</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Hora</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{booking.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{booking.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{booking.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(booking.date).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{booking.time}</td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        onClick={() => {
                          if (confirm("¿Deseas eliminar esta reserva?")) {
                            // Optimistically update UI
                            setBookingsState((prev) => prev.filter((b) => b.id !== booking.id))
                            try {
                              const current = JSON.parse(localStorage.getItem("bookings") || "[]")
                              const updated = current.filter((b: Booking) => b.id !== booking.id)
                              localStorage.setItem("bookings", JSON.stringify(updated))
                              lastSerializedRef.current = JSON.stringify(updated)
                            } catch (err) {
                              // ignore
                            }
                            onDelete(booking.id)
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}
