"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface BookingFormProps {
  onSubmit: (data: { name: string; email: string; phone: string }) => void
  onCancel: () => void
  onSlotUnavailable: () => void
  date: string
  time: string
}

export function BookingForm({ onSubmit, onCancel, onSlotUnavailable, date, time }: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Email inválido"
    if (!formData.phone.match(/^\d{7,}$/)) newErrors.phone = "Teléfono inválido (mínimo 7 dígitos)"
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date,
          time,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.error && (data.error.includes('no está disponible') || data.error.includes('ya está reservado'))) {
          toast.error('Horario no disponible', {
            description: 'Este horario ya fue reservado. Por favor selecciona otro horario.',
            duration: 4000,
          })
          onSlotUnavailable()
          return
        }
        
        toast.error('Error al crear la reserva', {
          description: data.error || 'Por favor intenta de nuevo.',
          duration: 4000,
        })
        return
      }

      toast.success('¡Reserva creada!', {
        description: 'Tu cita ha sido confirmada exitosamente.',
        duration: 3000,
      })
      
      onSubmit(formData)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('Error de conexión', {
        description: 'No se pudo crear la reserva. Por favor intenta de nuevo.',
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-500" : "border-slate-300"
          }`}
          placeholder="Juan Pérez"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? "border-red-500" : "border-slate-300"
          }`}
          placeholder="juan@example.com"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.phone ? "border-red-500" : "border-slate-300"
          }`}
          placeholder="+34 600 000 000"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1 bg-transparent" disabled={loading}>
          Atrás
        </Button>
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
          {loading ? 'Creando...' : 'Confirmar Reserva'}
        </Button>
      </div>
    </form>
  )
}
