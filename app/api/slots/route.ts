import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

      return NextResponse.json({ dates })
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
      return NextResponse.json({ slots: [] })
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
    const now = new Date()
    const slots = availableSlots.map(slot => {
      // Verificar si el horario ya pasó (solo para el día de hoy)
      const [hours, minutes] = slot.time.split(':').map(Number)
      const slotDateTime = new Date(slot.date)
      slotDateTime.setHours(hours, minutes, 0, 0)
      const isPastTime = slotDateTime < now
      
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

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 })
  }
}
