import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

// OPTIONS - Manejar preflight
export async function OPTIONS() {
  return handleCorsOptions()
}

// GET - Obtener slots disponibles para un rango de fechas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const slots = await prisma.availableSlot.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
    })

    // Agrupar por fecha
    const slotsByDate = slots.reduce((acc, slot) => {
      const dateKey = slot.date.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(slot)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({ slots, slotsByDate }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500, headers: corsHeaders })
  }
}

// POST - Crear slots para un día
export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { date, timeSlots, maxBookingsPerSlot } = body

    console.log('📅 POST Availability - Fecha recibida:', date)
    console.log('⏰ Slots a crear:', timeSlots.length)

    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Crear fecha correctamente con hora del mediodía para evitar problemas de timezone
    const targetDate = new Date(date + 'T12:00:00.000Z')
    console.log('🎯 Fecha parseada:', targetDate)

    // Eliminar slots existentes para ese día usando rango
    const startDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(date + 'T23:59:59.999Z')

    const deleted = await prisma.availableSlot.deleteMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    console.log('🗑️ Slots eliminados:', deleted.count)

    // Crear nuevos slots
    const slots = []
    for (const time of timeSlots) {
      slots.push({
        date: targetDate,
        time,
        isAvailable: true,
        maxBookings: maxBookingsPerSlot || 1,
        currentBookings: 0,
      })
    }

    const created = await prisma.availableSlot.createMany({
      data: slots,
    })

    console.log('✅ Slots creados:', created.count)

    return NextResponse.json({ 
      message: 'Disponibilidad actualizada', 
      count: created.count,
      date: targetDate
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json({ error: 'Error al actualizar disponibilidad' }, { status: 500, headers: corsHeaders })
  }
}

// PUT - Actualizar maxBookings para un día específico
export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { date, maxBookings } = body

    if (!date || !maxBookings) {
      return NextResponse.json(
        { error: 'Fecha y maxBookings son requeridos' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Actualizar todos los slots de ese día usando rango de fechas
    const startDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(date + 'T23:59:59.999Z')

    await prisma.availableSlot.updateMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      data: {
        maxBookings: parseInt(maxBookings),
      },
    })

    return NextResponse.json({ message: 'Disponibilidad actualizada' }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json({ error: 'Error al actualizar disponibilidad' }, { status: 500, headers: corsHeaders })
  }
}

// DELETE - Eliminar disponibilidad de un día (cerrar el día)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400, headers: corsHeaders })
    }

    console.log('🔍 Intentando eliminar día:', date)

    // Verificar si hay reservas (de cualquier estado) para ese día
    // Buscar todas las reservas que tengan la misma fecha (sin importar la hora)
    const allBookings = await prisma.booking.findMany({
      select: {
        id: true,
        date: true,
        status: true,
        name: true,
        time: true,
      },
    })

    console.log('📋 Total de reservas en BD:', allBookings.length)

    // Filtrar por la fecha específica comparando solo año, mes y día
    const [year, month, day] = date.split('-').map(Number)
    console.log('📅 Buscando reservas para:', { year, month, day })

    const bookingsOnDate = allBookings.filter(booking => {
      const bookingDate = new Date(booking.date)
      const matches = (
        bookingDate.getFullYear() === year &&
        bookingDate.getMonth() + 1 === month &&
        bookingDate.getDate() === day &&
        (booking.status === 'confirmed' || booking.status === 'completed')
      )
      
      if (bookingDate.getFullYear() === year && bookingDate.getMonth() + 1 === month && bookingDate.getDate() === day) {
        console.log('✅ Reserva encontrada en fecha:', {
          id: booking.id,
          name: booking.name,
          time: booking.time,
          date: booking.date,
          status: booking.status,
          dateInfo: {
            year: bookingDate.getFullYear(),
            month: bookingDate.getMonth() + 1,
            day: bookingDate.getDate(),
          }
        })
      }
      
      return matches
    })

    console.log('🎯 Reservas confirmadas encontradas:', bookingsOnDate.length)

    if (bookingsOnDate.length > 0) {
      console.log('❌ No se puede eliminar - hay reservas confirmadas')
      return NextResponse.json(
        { 
          error: `No se puede eliminar. Hay ${bookingsOnDate.length} reserva${bookingsOnDate.length > 1 ? 's' : ''} activa${bookingsOnDate.length > 1 ? 's' : ''} para este día.`,
          bookingsCount: bookingsOnDate.length
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Eliminar todos los slots que coincidan con la fecha
    const startDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(date + 'T23:59:59.999Z')

    const deleted = await prisma.availableSlot.deleteMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    console.log('✅ Día cerrado, slots eliminados:', deleted.count)

    return NextResponse.json({ 
      message: 'Día cerrado correctamente',
      deletedCount: deleted.count 
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error deleting availability:', error)
    return NextResponse.json({ error: 'Error al cerrar día' }, { status: 500, headers: corsHeaders })
  }
}
