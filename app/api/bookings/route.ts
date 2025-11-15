import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

// OPTIONS - Manejar preflight
export async function OPTIONS() {
  return handleCorsOptions()
}

// GET - Obtener todas las reservas
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json({ bookings }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500, headers: corsHeaders })
  }
}

// POST - Crear nueva reserva
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, date, time, source = 'web', notes } = body

    // Validar datos
    if (!name || !email || !phone || !date || !time) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validar que no sea un horario pasado
    const [hours, minutes] = time.split(':').map(Number)
    const bookingDateTime = new Date(date + 'T' + time + ':00')
    const now = new Date()
    
    if (bookingDateTime < now) {
      return NextResponse.json(
        { error: 'No se puede reservar en un horario pasado' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verificar si el horario está disponible consultando reservas existentes
    console.log('Verificando disponibilidad para:', { date, time })
    
    const bookingDate = new Date(date)
    const startDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(date + 'T23:59:59.999Z')
    
    // Buscar si ya existe una reserva confirmada para esa fecha y hora
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        time: time,
        status: 'confirmed',
      },
    })

    console.log('Reserva existente:', existingBooking)

    if (existingBooking) {
      return NextResponse.json(
        { error: 'El horario seleccionado ya está reservado' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Crear la reserva
    const booking = await prisma.booking.create({
      data: {
        name,
        email,
        phone,
        date: bookingDate,
        time,
        status: 'confirmed',
        source: source || 'web',
        notes: notes || null,
      },
    })

    console.log('Reserva creada:', booking.id)

    return NextResponse.json({ booking }, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500, headers: corsHeaders })
  }
}

// PUT - Actualizar reserva
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, email, phone, date, time, status, source, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400, headers: corsHeaders })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (date) updateData.date = new Date(date)
    if (time) updateData.time = time
    if (status) updateData.status = status
    if (source) updateData.source = source
    if (notes !== undefined) updateData.notes = notes

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ booking }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Error al actualizar la reserva' }, { status: 500, headers: corsHeaders })
  }
}

// DELETE - Eliminar reserva
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400, headers: corsHeaders })
    }

    // Obtener la reserva antes de eliminarla
    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404, headers: corsHeaders })
    }

    // Eliminar la reserva
    await prisma.booking.delete({
      where: { id },
    })

    console.log('Reserva eliminada:', id)

    return NextResponse.json({ message: 'Reserva eliminada correctamente' }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Error al eliminar la reserva' }, { status: 500, headers: corsHeaders })
  }
}
