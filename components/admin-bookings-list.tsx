"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Booking {
  id: string
  name: string
  email: string
  phone: string
  date: string
  time: string
  status: string
  createdAt: string
}

interface AdminBookingsListProps {
  bookings?: Booking[]
  onDelete: (id: string) => void
}

export function AdminBookingsList({ bookings = [], onDelete }: AdminBookingsListProps) {
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null)

  const sortedBookings = [...bookings].sort((a, b) => {
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
                        onClick={() => setBookingToDelete(booking)}
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

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog open={!!bookingToDelete} onOpenChange={() => setBookingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la reserva de{" "}
              <span className="font-semibold text-slate-900">{bookingToDelete?.name}</span> para el{" "}
              <span className="font-semibold text-slate-900">
                {bookingToDelete && new Date(bookingToDelete.date).toLocaleDateString("es-ES")} a las{" "}
                {bookingToDelete?.time}
              </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bookingToDelete) {
                  onDelete(bookingToDelete.id)
                  setBookingToDelete(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
