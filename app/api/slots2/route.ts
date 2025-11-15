import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

// OPTIONS - Manejar preflight
export async function OPTIONS() {
  return handleCorsOptions()
}

// GET - Obtener solo horarios disponibles (no reservados y no pasados)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro date en formato yyyy-mm-dd' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use yyyy-mm-dd (ejemplo: 2025-11-15)' },
        { status: 400, headers: corsHeaders }
      )
    }

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

    console.log('Reservas encontradas:', bookings.length)

    // Contar reservas por horario
    const bookingsByTime = bookings.reduce((acc, booking) => {
      acc[booking.time] = (acc[booking.time] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Obtener hora actual en España (UTC+1)
    const nowUTC = new Date()
    const spainOffset = 1 * 60 // +1 hora en minutos
    const spainTime = new Date(nowUTC.getTime() + spainOffset * 60 * 1000)
    
    console.log('Hora UTC:', nowUTC.toISOString())
    console.log('Hora España (UTC+1):', spainTime.toISOString())
    
    // Mapear slots y FILTRAR solo los disponibles (no reservados y no pasados)
    const slots = availableSlots
      .map(slot => {
        // Obtener la fecha del slot
        const slotDate = new Date(slot.date)
        const slotYear = slotDate.getUTCFullYear()
        const slotMonth = slotDate.getUTCMonth()
        const slotDay = slotDate.getUTCDate()
        
        // Crear fecha/hora del slot (interpretando el time como hora de España)
        const [hours, minutes] = slot.time.split(':').map(Number)
        const slotDateTime = new Date(Date.UTC(slotYear, slotMonth, slotDay, hours - 1, minutes, 0, 0)) // -1 para ajustar a UTC desde España
        
        // Verificar si ya pasó según hora de España
        const isPastServer = slotDateTime < spainTime
        
        // Verificar si está completamente reservado
        const currentBookings = bookingsByTime[slot.time] || 0
        const isFullyBooked = currentBookings >= slot.maxBookings
        
        console.log(`Slot ${slot.time}: isPast=${isPastServer}, isFullyBooked=${isFullyBooked} (${currentBookings}/${slot.maxBookings})`)
        
        return {
          id: slot.id,
          date: slot.date,
          time: slot.time,
          maxBookings: slot.maxBookings,
          currentBookings,
          isAvailable: !isPastServer && !isFullyBooked,
          isPastServer,
        }
      })
      .filter(slot => !slot.isPastServer && slot.isAvailable) // SOLO slots que no pasaron y están disponibles

    console.log('Slots disponibles (filtrados):', slots.length)

    return NextResponse.json({ 
      slots,
      serverTime: spainTime.toISOString(),
      total: slots.length
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500, headers: corsHeaders })
  }
}
