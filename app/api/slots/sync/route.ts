import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

// OPTIONS - Manejar preflight
export async function OPTIONS() {
  return handleCorsOptions()
}

// POST - Sincronizar slots con reservas reales
export async function POST() {
  try {
    // Obtener todos los slots
    const slots = await prisma.availableSlot.findMany()

    // Para cada slot, contar las reservas reales
    for (const slot of slots) {
      const bookingsCount = await prisma.booking.count({
        where: {
          date: slot.date,
          time: slot.time,
          status: 'confirmed',
        },
      })

      // Actualizar el slot con el conteo correcto
      await prisma.availableSlot.update({
        where: { id: slot.id },
        data: {
          currentBookings: bookingsCount,
          isAvailable: bookingsCount < slot.maxBookings,
        },
      })
    }

    return NextResponse.json({ 
      message: 'Slots sincronizados correctamente',
      slotsUpdated: slots.length 
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error syncing slots:', error)
    return NextResponse.json({ error: 'Error al sincronizar slots' }, { status: 500, headers: corsHeaders })
  }
}
