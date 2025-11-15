"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Pencil, Search, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import { toast } from "sonner"

interface Booking {
  id: string
  name: string
  email: string
  phone: string
  date: string
  time: string
  status: string
  source: string
  notes?: string
  createdAt: string
}

interface AdminBookingsListProps {
  bookings?: Booking[]
  onDelete: (id: string) => void
  onUpdate?: () => void
}

export function AdminBookingsList({ bookings = [], onDelete, onUpdate }: AdminBookingsListProps) {
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Filtrar reservas
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    const matchesSource = sourceFilter === "all" || booking.source === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`)
    const dateB = new Date(`${b.date}T${b.time}`)
    return dateA.getTime() - dateB.getTime()
  })

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBooking) return

    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBooking),
      })

      if (response.ok) {
        toast.success('Reserva actualizada')
        setEditingBooking(null)
        onUpdate?.()
      } else {
        toast.error('Error al actualizar reserva')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Error al actualizar reserva')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700'
  }

  const getSourceBadge = (source: string) => {
    const badges = {
      web: 'bg-purple-100 text-purple-700',
      whatsapp: 'bg-green-100 text-green-700',
    }
    return badges[source as keyof typeof badges] || 'bg-gray-100 text-gray-700'
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      web: 'Web',
      whatsapp: 'WhatsApp',
    }
    return labels[source] || source
  }

  return (
    <Card className="bg-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Lista de Reservas</h2>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuente</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {sortedBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No hay reservas{searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' ? ' que coincidan con los filtros' : ' aún'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Contacto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Hora</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fuente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{booking.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{booking.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div>{booking.email}</div>
                      <div className="text-xs">{booking.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(booking.date.split('T')[0] + 'T12:00:00').toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{booking.time}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {booking.source ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSourceBadge(booking.source)}`}>
                          {getSourceLabel(booking.source)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin fuente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm flex gap-2">
                      <Button
                        onClick={() => setEditingBooking(booking)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
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

      {/* Dialog para editar */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
          </DialogHeader>
          {editingBooking && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editingBooking.name}
                  onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingBooking.email}
                  onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={editingBooking.phone}
                  onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={editingBooking.date.split('T')[0]}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    value={editingBooking.time}
                    onChange={(e) => setEditingBooking({ ...editingBooking, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={editingBooking.status} 
                  onValueChange={(value) => setEditingBooking({ ...editingBooking, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuente</Label>
                <Select 
                  value={editingBooking.source} 
                  onValueChange={(value) => setEditingBooking({ ...editingBooking, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={editingBooking.notes || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingBooking(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog open={!!bookingToDelete} onOpenChange={() => setBookingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la reserva de{" "}
              <span className="font-semibold text-slate-900">{bookingToDelete?.name}</span> para el{" "}
              <span className="font-semibold text-slate-900">
                {bookingToDelete && new Date(bookingToDelete.date.split('T')[0] + 'T12:00:00').toLocaleDateString("es-ES")} a las{" "}
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
