"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, User, Phone, Mail } from "lucide-react"
import { BookingForm } from "@/components/booking-form"
import { AvailableSlots } from "@/components/available-slots"

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [step, setStep] = useState<"date" | "time" | "form" | "confirmation">("date")
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" })

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setStep("time")
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep("form")
  }

  const handleFormSubmit = (data: typeof formData) => {
    setFormData(data)
    setStep("confirmation")
  }

  const handleNewBooking = () => {
    setSelectedDate("")
    setSelectedTime("")
    setFormData({ name: "", email: "", phone: "" })
    setStep("date")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Reserva tu Cita</h1>
          </div>
          <p className="text-slate-600">Sistema de reservas rápido y fácil</p>
        </div>

        {/* Content */}
        <Card className="bg-white shadow-lg">
          <div className="p-6 md:p-8">
            {step === "date" && <AvailableSlots type="date" onSelect={handleDateSelect} />}

            {step === "time" && (
              <div>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Fecha seleccionada:</span>{" "}
                    {new Date(selectedDate).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <AvailableSlots type="time" onSelect={handleTimeSelect} date={selectedDate} />
              </div>
            )}

            {step === "form" && (
              <div>
                <div className="mb-6 space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Fecha:</span>{" "}
                    {new Date(selectedDate).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Hora:</span> {selectedTime}
                  </p>
                </div>
                <BookingForm onSubmit={handleFormSubmit} onCancel={() => setStep("time")} />
              </div>
            )}

            {step === "confirmation" && (
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Cita Confirmada!</h2>
                <p className="text-slate-600 mb-6">Tu reserva ha sido registrada exitosamente</p>

                <div className="space-y-3 mb-8 text-left bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-600">Nombre</p>
                      <p className="font-semibold text-slate-900">{formData.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-600">Email</p>
                      <p className="font-semibold text-slate-900">{formData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-600">Teléfono</p>
                      <p className="font-semibold text-slate-900">{formData.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-600">Fecha y Hora</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(selectedDate).toLocaleDateString("es-ES")} a las {selectedTime}
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleNewBooking} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Nueva Reserva
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Admin Link */}
        <div className="text-center mt-8">
          <a href="/admin" className="text-sm text-slate-600 hover:text-blue-600 underline">
            Acceso Admin
          </a>
        </div>
      </div>
    </main>
  )
}
