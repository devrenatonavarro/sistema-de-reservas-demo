import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { corsHeaders, handleCorsOptions } from '@/lib/cors';

// OPTIONS - Manejar preflight
export async function OPTIONS() {
  return handleCorsOptions()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Validar que se proporcione la fecha
    if (!dateParam) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro date en formato yyyy-mm-dd' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateParam)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use yyyy-mm-dd (ejemplo: 2025-11-15)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Crear objeto de fecha para el inicio del día
    const startDate = new Date(dateParam + 'T00:00:00.000Z');
    const endDate = new Date(dateParam + 'T23:59:59.999Z');

    // Validar que la fecha sea válida
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Fecha inválida' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Buscar todos los slots disponibles para la fecha especificada
    const availableSlots = await prisma.availableSlot.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        isAvailable: true,
        currentBookings: {
          lt: prisma.availableSlot.fields.maxBookings,
        },
      },
      orderBy: {
        time: 'asc',
      },
      select: {
        id: true,
        date: true,
        time: true,
        isAvailable: true,
        maxBookings: true,
        currentBookings: true,
      },
    });

    // Formatear la respuesta
    const formattedSlots = availableSlots.map(slot => ({
      id: slot.id,
      date: slot.date.toISOString().split('T')[0],
      time: slot.time,
      available: slot.isAvailable,
      spotsLeft: slot.maxBookings - slot.currentBookings,
      maxBookings: slot.maxBookings,
      currentBookings: slot.currentBookings,
    }));

    return NextResponse.json({
      date: dateParam,
      totalAvailable: formattedSlots.length,
      slots: formattedSlots,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error al obtener slots disponibles:', error);
    return NextResponse.json(
      { error: 'Error al obtener los horarios disponibles' },
      { status: 500, headers: corsHeaders }
    );
  }
}
