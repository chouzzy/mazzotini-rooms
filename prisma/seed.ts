import { PrismaClient, Role, MeetingType, BookingStatus } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// 1. Configura o dotenv para ler o arquivo .env na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Verificação de Segurança
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO CRÍTICO: A variável DATABASE_URL não foi encontrada.')
  process.exit(1)
}

// 2. Instancia o cliente Prisma (Versão Padrão/Estável)
// Sem malabarismos de configuração. O Prisma 5 lê o .env nativamente.
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando o seed...')
  
  // 1. Criar (ou garantir que existe) um Admin
  const adminEmail = 'admin@mazzotini.com.br'
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrador Mazzotini',
      role: Role.ADMIN,
      image: 'https://ui-avatars.com/api/?name=Admin+Mazzotini&background=d2be82&color=fff'
    },
  })
  console.log(`👤 Admin garantido: ${admin.email}`)

  // 2. Criar Salas de Reunião Iniciais
  const roomsData = [
    {
      name: 'Sala Viena (Principal)',
      capacity: 10,
      description: 'Sala ampla com TV 65", mesa oval e vista para a cidade.',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000'
    },
    {
      name: 'Sala Paris (Petit)',
      capacity: 4,
      description: 'Ideal para reuniões rápidas ou entrevistas. Mesa redonda.',
      imageUrl: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=1000'
    },
    {
      name: 'Sala de Vidro',
      capacity: 6,
      description: 'Sala transparente no centro do escritório. Acústica tratada.',
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c54be3852f33?auto=format&fit=crop&q=80&w=1000'
    }
  ]

  for (const room of roomsData) {
    const existingRoom = await prisma.room.findFirst({ where: { name: room.name } })
    
    if (!existingRoom) {
      await prisma.room.create({ data: room })
      console.log(`🏠 Sala criada: ${room.name}`)
    } else {
      console.log(`ℹ️ Sala já existe: ${room.name}`)
    }
  }

  // 3. Criar uma reserva de teste para hoje
  const roomViena = await prisma.room.findFirst({ where: { name: 'Sala Viena (Principal)' } })
  
  if (roomViena && admin) {
    const today = new Date()
    today.setHours(14, 0, 0, 0)
    const endTime = new Date(today)
    endTime.setHours(15, 0, 0, 0)

    const existingBooking = await prisma.booking.findFirst({
        where: { roomId: roomViena.id, startTime: today }
    })

    if (!existingBooking) {
        await prisma.booking.create({
        data: {
            title: 'Reunião de Alinhamento (Seed)',
            startTime: today,
            endTime: endTime,
            userId: admin.id,
            roomId: roomViena.id,
            type: MeetingType.IN_PERSON,
            status: BookingStatus.CONFIRMED
        }
        })
        console.log(`📅 Reserva de teste criada.`)
    }
  }

  console.log('✅ Seed finalizado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })