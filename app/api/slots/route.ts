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

    // Obtener hora actual en España (UTC+1)
    // Durante horario de verano en España es UTC+2, pero usaremos UTC+1 como base
    const nowUTC = new Date()
    const spainOffset = 1 * 60 // +1 hora en minutos
    const spainTime = new Date(nowUTC.getTime() + spainOffset * 60 * 1000)
    
    console.log('Hora UTC:', nowUTC.toISOString())
    console.log('Hora España (UTC+1):', spainTime.toISOString())
    console.log('Fecha solicitada:', date)
    
    // Mapear slots con disponibilidad
    const slots = availableSlots.map(slot => {
      // Obtener la fecha del slot
      const slotDate = new Date(slot.date)
      const slotYear = slotDate.getUTCFullYear()
      const slotMonth = slotDate.getUTCMonth()
      const slotDay = slotDate.getUTCDate()
      
      // Fecha de hoy en España
      const todaySpain = new Date(spainTime)
      const todayYear = todaySpain.getUTCFullYear()
      const todayMonth = todaySpain.getUTCMonth()
      const todayDay = todaySpain.getUTCDate()
      
      // Crear fecha/hora del slot (interpretando el time como hora de España)
      const [hours, minutes] = slot.time.split(':').map(Number)
      const slotDateTime = new Date(Date.UTC(slotYear, slotMonth, slotDay, hours - 1, minutes, 0, 0)) // -1 para ajustar a UTC desde España
      
      console.log(`Slot ${slot.time}: ${slotDateTime.toISOString()} vs España: ${spainTime.toISOString()} = isPast: ${slotDateTime < spainTime}`)
      
      // Verificar si ya pasó según hora de España
      const isPastServer = slotDateTime < spainTime
      
      return {
        id: slot.id,
        date: slot.date,
        time: slot.time,
        maxBookings: slot.maxBookings,
        currentBookings: bookingsByTime[slot.time] || 0,
        isAvailable: (bookingsByTime[slot.time] || 0) < slot.maxBookings,
        isPastServer, // Basado en hora de España
      }
    })

    console.log('Horarios con reservas:', Object.keys(bookingsByTime))
    console.log('Total slots generados:', slots.length)

    return NextResponse.json({ 
      slots,
      serverTime: spainTime.toISOString() // Hora de España usada como referencia
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500, headers: corsHeaders })
  }
}
