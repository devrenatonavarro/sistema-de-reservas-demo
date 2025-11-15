import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

// OPTIONS - Manejar preflight
export async function OPTIONS() {
  return handleCorsOptions()
}

// GET - Obtener toda la configuración
export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: {
        key: 'asc',
      },
    })

    // Convertir a objeto key-value
    const configObject = configs.reduce((acc, config) => {
      acc[config.key] = {
        value: config.value,
        description: config.description,
      }
      return acc
    }, {} as Record<string, { value: string; description: string | null }>)

    return NextResponse.json({ config: configObject }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500, headers: corsHeaders })
  }
}

// PUT - Actualizar configuración
export async function PUT(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key y value son requeridos' },
        { status: 400, headers: corsHeaders }
      )
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json({ config }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500, headers: corsHeaders })
  }
}
