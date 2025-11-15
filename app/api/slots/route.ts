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
      // Si no hay fecha, devolver las próximas fechas disponibles (próximos 30 días)
      const dates = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() + i)
        
        // Saltar domingos
        if (checkDate.getDay() === 0) continue
        
        const dateStr = checkDate.toISOString().split('T')[0]
        dates.push(dateStr)
      }

      return NextResponse.json({ dates })
    }

    // Si hay fecha, devolver los horarios de esa fecha verificando reservas existentes
    console.log('Fecha recibida:', date)

    // Obtener todas las reservas confirmadas para esa fecha
    const startDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(date + 'T23:59:59.999Z')
    
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

    // Crear un Set con los horarios ocupados
    const bookedTimes = new Set(bookings.map(b => b.time))

    // Generar slots con disponibilidad basada en reservas reales
    const slots = DEFAULT_TIME_SLOTS.map(time => ({
      id: `${date}-${time}`,
      date: new Date(date),
      time,
      isAvailable: !bookedTimes.has(time),
      maxBookings: 1,
      currentBookings: bookedTimes.has(time) ? 1 : 0,
    }))

    console.log('Horarios ocupados:', Array.from(bookedTimes))
    console.log('Total slots generados:', slots.length)

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 })
  }
}
