import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

// OPTIONS - Manejar preflight
export async function OPTIONS() {
  return handleCorsOptions()
}

// Horarios disponibles por defecto
const DEFAULT_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
]

// GET - Obtener horarios disponibles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      // Si no hay fecha, devolver las próximas fechas disponibles desde la BD (incluye hoy)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const slots = await prisma.availableSlot.findMany({
        where: {
          date: {
            gte: today,
          },
        },
        orderBy: {
          date: 'asc',
        },
        distinct: ['date'],
        take: 60,
      })

      // Obtener fechas únicas
      const dates = [...new Set(slots.map(slot => slot.date.toISOString().split('T')[0]))]

      return NextResponse.json({ dates }, { headers: corsHeaders })
    }

    // Si hay fecha, devolver los horarios configurados para esa fecha
    console.log('Fecha recibida:', date)

    // Obtener todas las reservas confirmadas para esa fecha
    const startDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(date + 'T23:59:59.999Z')
    
    // Obtener slots configurados para ese día
    const availableSlots = await prisma.availableSlot.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        time: 'asc',
      },
    })

    console.log('Slots configurados:', availableSlots.length)

    if (availableSlots.length === 0) {
      console.log('No hay slots configurados para esta fecha')
      return NextResponse.json({ slots: [] }, { headers: corsHeaders })
    }
    
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'confirmed',
      },
    })

    console.log('Reservas encontradas:', bookings.length, bookings)

    // Contar reservas por horario
    const bookingsByTime = bookings.reduce((acc, booking) => {
      acc[booking.time] = (acc[booking.time] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Mapear slots con disponibilidad real
    // Obtener fecha/hora actual en zona horaria local (Perú UTC-5)
    const now = new Date()
    
    // Ajustar a zona horaria de Perú (UTC-5)
    const peruOffset = -5 * 60 // -5 horas en minutos
    const localOffset = now.getTimezoneOffset() // minutos de diferencia con UTC
    const peruTime = new Date(now.getTime() + (localOffset + peruOffset) * 60 * 1000)
    
    const slots = availableSlots.map(slot => {
      // Obtener fecha del slot en formato local
      const slotDate = new Date(slot.date)
      const slotYear = slotDate.getUTCFullYear()
      const slotMonth = String(slotDate.getUTCMonth() + 1).padStart(2, '0')
      const slotDay = String(slotDate.getUTCDate()).padStart(2, '0')
      const slotDateString = `${slotYear}-${slotMonth}-${slotDay}`
      
      // Obtener fecha actual en Perú
      const todayYear = peruTime.getFullYear()
      const todayMonth = String(peruTime.getMonth() + 1).padStart(2, '0')
      const todayDay = String(peruTime.getDate()).padStart(2, '0')
      const todayString = `${todayYear}-${todayMonth}-${todayDay}`
      
      // Verificar si el horario ya pasó
      const [hours, minutes] = slot.time.split(':').map(Number)
      
      // Crear fecha/hora del slot en formato comparable
      const slotDateTime = new Date(slotYear, parseInt(slotMonth) - 1, parseInt(slotDay), hours, minutes, 0)
      
      // Marcar como pasado solo si:
      // 1. La fecha es anterior a hoy (comparando strings YYYY-MM-DD), O
      // 2. La fecha es exactamente hoy Y la hora ya pasó (comparando con hora de Perú)
      const isPastTime = slotDateString < todayString || 
        (slotDateString === todayString && slotDateTime < peruTime)
      
      return {
        id: slot.id,
        date: slot.date,
        time: slot.time,
        maxBookings: slot.maxBookings,
        currentBookings: bookingsByTime[slot.time] || 0,
        isAvailable: !isPastTime && (bookingsByTime[slot.time] || 0) < slot.maxBookings,
        isPastTime,
      }
    })

    console.log('Horarios con reservas:', Object.keys(bookingsByTime))
    console.log('Total slots generados:', slots.length)

    return NextResponse.json({ slots }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500, headers: corsHeaders })
  }
}
