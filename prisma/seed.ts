import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed COMPLETO do banco de dados...');

  // 1. LIMPEZA (Ordem importa por causa das relações)
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Banco limpo.');

  // 2. CRIAR USUÁRIOS
  const usersData = [
    { name: 'Admin System', email: 'admin@mazzotini.com' },
    { name: 'João Silva', email: 'joao.silva@empresa.com' },
    { name: 'Maria Oliveira', email: 'maria.oliveira@empresa.com' },
    { name: 'Carlos Santos', email: 'carlos.santos@empresa.com' },
    { name: 'Ana Souza', email: 'ana.souza@empresa.com' },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    users.push(user);
  }
  console.log(`✅ ${users.length} Usuários criados.`);

  // 3. CRIAR SALAS
  const roomsData = [
    {
      name: 'Sala Executiva (Boardroom)',
      capacity: 12,
      description: 'Mesa de mármore, cadeiras de couro, TV 4K de 75" e sistema de videoconferência dedicado.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000',
    },
    {
      name: 'Sala de Inovação',
      capacity: 8,
      description: 'Ambiente descontraído com paredes riscáveis, post-its, pufes e iluminação natural.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000',
    },
    {
      name: 'Auditório Principal',
      capacity: 50,
      description: 'Espaço para town-halls e treinamentos. Possui sistema de som, microfones e projetor duplo.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41e157d44305?auto=format&fit=crop&q=80&w=1000',
    },
    {
      name: 'Cabine Foco A',
      capacity: 1,
      description: 'Cabine acústica para chamadas privadas e trabalho concentrado.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000',
    },
    {
      name: 'Cabine Foco B',
      capacity: 1,
      description: 'Cabine acústica para chamadas privadas e trabalho concentrado.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000',
    },
    {
      name: 'Sala de Reunião 101',
      capacity: 4,
      description: 'Sala básica para alinhamentos rápidos. Possui monitor HDMI.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=1000',
    },
    {
      name: 'Sala de Manutenção',
      capacity: 4,
      description: 'Em reforma (pintura). Indisponível para reservas.',
      isActive: false,
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&q=80&w=1000',
    },
  ];

  const rooms = [];
  for (const r of roomsData) {
    const room = await prisma.room.create({ data: r });
    rooms.push(room);
  }
  console.log(`✅ ${rooms.length} Salas criadas.`);

  // 4. CRIAR AGENDAMENTOS (Distribuição Temporal)
  const today = new Date();
  
  // Helper para ajustar datas rapidamente
  const addHours = (date: Date, h: number) => new Date(date.getTime() + h * 60 * 60 * 1000);
  const addDays = (date: Date, d: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + d);
    return newDate;
  };

  // Base de horário: Hoje às 08:00
  const baseTime = new Date(today.setHours(8, 0, 0, 0));

  const bookingsData = [
    // --- HOJE ---
    {
      title: 'Daily Scrum - Tech Team',
      start: baseTime, // 08:00
      end: addHours(baseTime, 0.5), // 08:30
      room: rooms[1], // Inovação
      user: users[1], // João
      link: 'https://teams.microsoft.com/l/meetup-join/fake-1',
    },
    {
      title: 'Alinhamento Comercial',
      start: addHours(baseTime, 2), // 10:00
      end: addHours(baseTime, 3),   // 11:00
      room: rooms[0], // Executiva
      user: users[2], // Maria
      link: null,
    },
    {
      title: 'Entrevista Candidato Dev',
      start: addHours(baseTime, 6), // 14:00
      end: addHours(baseTime, 7),   // 15:00
      room: rooms[5], // 101
      user: users[3], // Carlos
      link: 'https://teams.microsoft.com/l/meetup-join/fake-2',
    },
    {
      title: 'Workshop de Design Thinking',
      start: addHours(baseTime, 5), // 13:00
      end: addHours(baseTime, 9),   // 17:00 (4h duração)
      room: rooms[1], // Inovação
      user: users[4], // Ana
      link: null,
    },

    // --- ONTEM (Passado) ---
    {
      title: 'Reunião Mensal de Resultados',
      start: addDays(baseTime, -1), // Ontem 08:00
      end: addHours(addDays(baseTime, -1), 2), // Ontem 10:00
      room: rooms[2], // Auditório
      user: users[0], // Admin
      link: null,
    },

    // --- AMANHÃ (Futuro) ---
    {
      title: 'Apresentação para Cliente',
      start: addHours(addDays(baseTime, 1), 6), // Amanhã 14:00
      end: addHours(addDays(baseTime, 1), 8),   // Amanhã 16:00
      room: rooms[0], // Executiva
      user: users[1], // João
      link: 'https://teams.microsoft.com/l/meetup-join/fake-3',
    },
    {
      title: 'Call com Fornecedor',
      start: addHours(addDays(baseTime, 1), 2), // Amanhã 10:00
      end: addHours(addDays(baseTime, 1), 3),   // Amanhã 11:00
      room: rooms[3], // Cabine A
      user: users[3], // Carlos
      link: 'https://teams.microsoft.com/l/meetup-join/fake-4',
    },
  ];

  for (const b of bookingsData) {
    await prisma.booking.create({
      data: {
        roomId: b.room.id,
        userId: b.user.id,
        title: b.title,
        startTime: b.start,
        endTime: b.end,
        onlineMeetingUrl: b.link,
      },
    });
  }

  console.log(`✅ ${bookingsData.length} Agendamentos criados.`);
  console.log('🚀 Seed COMPLETO finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });