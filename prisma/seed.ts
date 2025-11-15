import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrador',
      email: 'admin@example.com',
      role: 'admin',
    },
  })

  console.log('✅ Usuario admin creado:', admin)

  // Crear horarios disponibles (próximos 30 días)
  const slots = []
  const today = new Date()
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ]

  for (let day = 1; day <= 30; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() + day)
    
    // Saltar domingos
    if (date.getDay() === 0) continue

    for (const time of timeSlots) {
      slots.push({
        date: date,
        time: time,
        isAvailable: true,
        maxBookings: 1,
        currentBookings: 0,
      })
    }
  }

  const createdSlots = await prisma.availableSlot.createMany({
    data: slots,
    skipDuplicates: true,
  })

  console.log(`✅ ${createdSlots.count} horarios disponibles creados`)

  // Crear configuración del sistema
  const configs = [
    { key: 'business_name', value: 'Mi Negocio', description: 'Nombre del negocio' },
    { key: 'business_hours', value: '09:00-18:00', description: 'Horario de atención' },
    { key: 'booking_duration', value: '30', description: 'Duración de citas en minutos' },
    { key: 'max_bookings_per_day', value: '20', description: 'Máximo de citas por día' },
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }

  console.log('✅ Configuración del sistema creada')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
