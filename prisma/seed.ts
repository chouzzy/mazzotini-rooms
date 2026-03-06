import { PrismaClient, Role, MeetingType, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed PREMIUM do banco de dados...');

  // 1. LIMPEZA ATÔMICA
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Banco limpo.');

  // 2. CRIAR USUÁRIOS
  const admin = await prisma.user.create({
    data: { 
      name: 'Admin Mazzotini', 
      email: 'admin@mazzotini.com',
      role: Role.ADMIN,
      isVip: true,
      image: 'https://ui-avatars.com/api/?name=Admin+Mazzotini&background=c7823c&color=fff'
    }
  });

  const vipUser = await prisma.user.create({
    data: { 
      name: 'Dr. Roberto Sócio', 
      email: 'roberto@mazzotini.com',
      role: Role.USER,
      isVip: true,
      image: 'https://ui-avatars.com/api/?name=Roberto+Socio&background=b16a31&color=fff'
    }
  });

  const normalUser1 = await prisma.user.create({
    data: { 
      name: 'Ana Associada', 
      email: 'ana@mazzotini.com',
      role: Role.USER,
      isVip: false,
      image: 'https://ui-avatars.com/api/?name=Ana+Associada&background=334155&color=fff'
    }
  });

  const normalUser2 = await prisma.user.create({
    data: { 
      name: 'Carlos Estagiário', 
      email: 'carlos@mazzotini.com',
      role: Role.USER,
      isVip: false,
    }
  });

  console.log(`✅ Usuários criados (Admin, VIP e Associados).`);

  // 3. CRIAR SALAS PREMIUM
  const roomsData = [
    {
      name: 'Sala Executiva (Boardroom)',
      capacity: 12,
      description: 'Mesa de mármore para 12 lugares, cadeiras ergonômicas de couro, TV 4K de 75", sistema de videoconferência dedicado e vista para a cidade. Ideal para reuniões com clientes importantes e fechamento de contratos.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
      amenities: ['Wi-Fi de alta velocidade', 'TV / Projetor HDMI', 'Videoconferência', 'Água e Café']
    },
    {
      name: 'Sala de Inovação',
      capacity: 6,
      description: 'Ambiente descontraído e criativo. Possui parede de vidro riscável para brainstormings, TV para apresentações rápidas e iluminação natural. Perfeita para reuniões internas e alinhamentos de equipe.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
      amenities: ['Wi-Fi de alta velocidade', 'TV / Projetor HDMI', 'Quadro Branco']
    },
    {
      name: 'Cabine de Foco A',
      capacity: 2,
      description: 'Cabine com tratamento acústico premium para chamadas confidenciais ou trabalho focado que exija silêncio absoluto. Acomoda até 2 pessoas para conversas rápidas.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200',
      amenities: ['Wi-Fi de alta velocidade']
    },
    {
      name: 'Cabine de Foco B',
      capacity: 1,
      description: 'Cabine individual insonorizada. Ideal para participar de audiências online e sustentações orais sem interrupções externas.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
      amenities: ['Wi-Fi de alta velocidade']
    },
    {
      name: 'Auditório Principal',
      capacity: 40,
      description: 'Espaço modular para treinamentos, palestras e town-halls. Equipado com sistema de som completo, microfones sem fio e telão HD.',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41e157d44305?auto=format&fit=crop&q=80&w=1200',
      amenities: ['Wi-Fi de alta velocidade', 'TV / Projetor HDMI', 'Acessibilidade', 'Água e Café']
    },
    {
      name: 'Sala de Mediação',
      capacity: 5,
      description: 'Sala em reforma para troca de mobiliário e instalação de novo carpete acústico.',
      isActive: false, // Inativa para testar a flag no frontend
      imageUrl: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&q=80&w=1200',
      amenities: []
    },
  ];

  const rooms = [];
  for (const r of roomsData) {
    const room = await prisma.room.create({ data: r });
    rooms.push(room);
  }
  console.log(`✅ ${rooms.length} Salas Premium criadas.`);

  // 4. CRIAR AGENDAMENTOS (Distribuição Temporal Estratégica)
  const today = new Date();
  
  // Helpers para simular horários
  const setTime = (hours: number, minutes: number = 0) => {
    const d = new Date(today);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const bookingsData = [
    // --- HISTÓRICO (Realizadas no Passado) ---
    {
      title: 'Reunião de Fechamento (Mês Passado)',
      start: addDays(setTime(14, 0), -5),
      end: addDays(setTime(16, 0), -5),
      roomId: rooms[0].id,
      userId: admin.id,
      status: BookingStatus.CONFIRMED,
      type: MeetingType.IN_PERSON,
    },

    // --- HOJE (Realizadas / Em Andamento / Pendentes) ---
    {
      title: 'Despacho com Cliente A',
      start: setTime(9, 0),
      end: setTime(10, 30),
      roomId: rooms[0].id, // Executiva
      userId: vipUser.id,
      status: BookingStatus.CONFIRMED,
      type: MeetingType.IN_PERSON,
      guests: JSON.stringify([{ name: 'Cliente A', email: 'cliente@teste.com' }])
    },
    {
      title: 'Audiência Trabalhista (Online)',
      start: setTime(14, 0),
      end: setTime(15, 30),
      roomId: rooms[3].id, // Cabine B
      userId: normalUser1.id,
      status: BookingStatus.CONFIRMED,
      type: MeetingType.ONLINE,
      onlineMeetingUrl: 'https://teams.microsoft.com/l/meetup-join/fake-link-audiencia'
    },
    {
      title: 'Alinhamento Interno (Aguardando Admin)',
      start: setTime(16, 0),
      end: setTime(17, 0),
      roomId: rooms[1].id, // Inovação
      userId: normalUser2.id,
      status: BookingStatus.PENDING,
      type: MeetingType.IN_PERSON,
    },

    // --- AMANHÃ (Testar Bloqueios Visuais no Calendário) ---
    {
      title: 'Sustentação Oral Tribunal',
      start: addDays(setTime(10, 0), 1),
      end: addDays(setTime(12, 0), 1),
      roomId: rooms[3].id, // Cabine B
      userId: vipUser.id,
      status: BookingStatus.CONFIRMED,
      type: MeetingType.ONLINE,
      onlineMeetingUrl: 'https://teams.microsoft.com/l/meetup-join/fake-link-sustentacao'
    },
    {
      title: 'Reunião de Sócios',
      start: addDays(setTime(14, 0), 1),
      end: addDays(setTime(18, 0), 1), // Tarde toda bloqueada
      roomId: rooms[0].id, // Executiva
      userId: admin.id,
      status: BookingStatus.CONFIRMED,
      type: MeetingType.IN_PERSON,
    },
    {
      title: 'Treinamento Novo Sistema (Cancelada)',
      start: addDays(setTime(9, 0), 1),
      end: addDays(setTime(11, 0), 1),
      roomId: rooms[4].id, // Auditório
      userId: normalUser1.id,
      status: BookingStatus.CANCELLED,
      type: MeetingType.IN_PERSON,
    },
  ];

  for (const b of bookingsData) {
    await prisma.booking.create({
      data: {
        title: b.title,
        startTime: b.start,
        endTime: b.end,
        roomId: b.roomId,
        userId: b.userId,
        status: b.status,
        type: b.type,
        onlineMeetingUrl: b.onlineMeetingUrl,
        guests: b.guests,
      },
    });
  }

  console.log(`✅ ${bookingsData.length} Agendamentos criados (Passado, Presente e Futuro).`);
  console.log('🚀 Seed PREMIUM finalizado com sucesso! Pode abrir a aplicação.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });