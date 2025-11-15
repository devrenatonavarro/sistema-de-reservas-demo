"use client"

import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminBookingsList } from "@/components/admin-bookings-list"
import { UsersManagement } from "@/components/users-management"
import { AvailabilityManagement } from "@/components/availability-management"
import { LogOut, Calendar, Users, Clock } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  // Verificar estado de notificaciones
  useEffect(() => {
    if ('Notification' in window && status === "authenticated") {
      setNotificationPermission(Notification.permission)
      
      // Actualizar el estado si cambia
      const interval = setInterval(() => {
        if (Notification.permission !== notificationPermission) {
          setNotificationPermission(Notification.permission)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [status, notificationPermission])

  // SWR con refresco cada 5 segundos
  const { data, error, mutate } = useSWR(
    status === "authenticated" ? "/api/bookings" : null,
    fetcher,
    {
      refreshInterval: 5000, // 5 segundos
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const bookings = data?.bookings || []

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login")
    }
  }, [status, router])

  if (status === "loading" || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg p-8 text-center">
          <p className="text-slate-600">Cargando...</p>
        </Card>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg p-8 text-center">
          <p className="text-red-600">Error al cargar las reservas</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
            <p className="text-slate-600">Gestiona todas las reservas</p>
            {notificationPermission === 'granted' && (
              <p className="text-xs text-green-600 mt-1">✓ Notificaciones activas</p>
            )}
            {notificationPermission === 'denied' && (
              <p className="text-xs text-red-600 mt-1">✗ Notificaciones bloqueadas</p>
            )}
            {notificationPermission === 'default' && (
              <p className="text-xs text-yellow-600 mt-1">⚠ Permite notificaciones para recibir alertas</p>
            )}
          </div>
          <Button onClick={() => signOut({ callbackUrl: "/admin/login" })} variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Salir
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white p-6">
            <p className="text-slate-600 text-sm font-medium">Total de Citas</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{bookings.length}</p>
          </Card>
          <Card className="bg-white p-6">
            <p className="text-slate-600 text-sm font-medium">Hoy</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {
                bookings.filter((b: any) => {
                  const today = new Date().toISOString().split("T")[0]
                  const bookingDate = new Date(b.date).toISOString().split("T")[0]
                  return bookingDate === today
                }).length
              }
            </p>
          </Card>
          <Card className="bg-white p-6">
            <p className="text-slate-600 text-sm font-medium">Esta Semana</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {
                bookings.filter((b: any) => {
                  const today = new Date()
                  const bookingDate = new Date(b.date)
                  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                  return bookingDate >= today && bookingDate <= sevenDaysLater
                }).length
              }
            </p>
          </Card>
        </div>

        {/* Bookings List */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Disponibilidad
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <AdminBookingsList
              bookings={bookings}
              onDelete={async (id) => {
                try {
                  const response = await fetch(`/api/bookings?id=${id}`, {
                    method: 'DELETE',
                  })
                  
                  if (response.ok) {
                    mutate()
                    toast.success('Reserva eliminada correctamente')
                  } else {
                    toast.error('Error al eliminar la reserva')
                  }
                } catch (error) {
                  console.error('Error deleting booking:', error)
                  toast.error('Error al eliminar la reserva')
                }
              }}
              onUpdate={() => mutate()}
            />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
