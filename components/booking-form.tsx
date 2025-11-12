"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface BookingFormProps {
  onSubmit: (data: { name: string; email: string; phone: string }) => void
  onCancel: () => void
}

export function BookingForm({ onSubmit, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Save to localStorage
    const bookings = JSON.parse(localStorage.getItem("bookings") || "[]")
    bookings.push({
      id: Date.now(),
      ...formData,
      date: localStorage.getItem("currentBookingDate"),
      time: localStorage.getItem("currentBookingTime"),
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem("bookings", JSON.stringify(bookings))

    onSubmit(formData)
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
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
          Atrás
        </Button>
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          Confirmar Reserva
        </Button>
      </div>
    </form>
  )
}
