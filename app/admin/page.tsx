"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AdminBookingsList } from "@/components/admin-bookings-list"
import { LogOut } from "lucide-react"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [bookings, setBookings] = useState<any[]>([])

  const ADMIN_PASSWORD = "admin123"

  useEffect(() => {
    loadBookings()
  }, [isAuthenticated])

  const loadBookings = () => {
    const data = JSON.parse(localStorage.getItem("bookings") || "[]")
    setBookings(data)
  }

  // Keep stats in sync with localStorage changes (other tabs or same-tab via polling)
  const lastSerializedRef = useRef<string>(JSON.stringify(bookings))

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bookings") {
        try {
          const parsed = JSON.parse(e.newValue || "[]")
          setBookings(parsed)
          lastSerializedRef.current = JSON.stringify(parsed)
        } catch (err) {
          // ignore
        }
      }
    }

    window.addEventListener("storage", onStorage)

    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("bookings") || "[]"
        if (raw !== lastSerializedRef.current) {
          const parsed = JSON.parse(raw)
          lastSerializedRef.current = raw
          setBookings(parsed)
        }
      } catch (err) {
        // ignore
      }
    }, 800)

    return () => {
      window.removeEventListener("storage", onStorage)
      clearInterval(interval)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setPassword("")
    } else {
      alert("Contraseña incorrecta")
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Panel Admin</h1>
            <p className="text-slate-600 mb-6">Ingresa tu contraseña para continuar</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa la contraseña"
                />
                <p className="text-xs text-slate-500 mt-2">Demo: admin123</p>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Ingresar
              </Button>
            </form>
          </div>
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
          </div>
          <Button onClick={() => setIsAuthenticated(false)} variant="outline" className="flex items-center gap-2">
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
                bookings.filter((b) => {
                  const today = new Date().toISOString().split("T")[0]
                  return b.date === today
                }).length
              }
            </p>
          </Card>
          <Card className="bg-white p-6">
            <p className="text-slate-600 text-sm font-medium">Esta Semana</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {
                bookings.filter((b) => {
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
        <AdminBookingsList
          bookings={bookings}
          onDelete={(id) => {
            const updated = bookings.filter((b) => b.id !== id)
            localStorage.setItem("bookings", JSON.stringify(updated))
            setBookings(updated)
          }}
        />
      </div>
    </main>
  )
}
