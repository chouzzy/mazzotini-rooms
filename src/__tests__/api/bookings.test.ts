import { POST, GET, DELETE } from '../../app/api/bookings/route';
import { prisma } from '../../lib/prisma';
import { getServerSession } from 'next-auth';

// 1. MOCK DO NEXT-AUTH: Evita o erro 'jose' ESM module no Jest
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// 2. MOCK DO SERVIÇO DE E-MAIL
jest.mock('../../lib/email', () => ({
  sendPendingEmail: jest.fn().mockResolvedValue(true),
  sendApprovalEmail: jest.fn().mockResolvedValue(true),
  sendRejectionEmail: jest.fn().mockResolvedValue(true),
  sendCancellationEmail: jest.fn().mockResolvedValue(true),
  sendGuestInvitationEmail: jest.fn().mockResolvedValue(true),
}));

describe('API de Agendamentos', () => {
  let roomId: string;
  let userId: string;
  let vipUserId: string;
  let room2Id: string;

  beforeEach(async () => {
    // Limpeza atômica e segura
    await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.room.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const room = await prisma.room.create({
      data: { name: 'Sala Executiva', capacity: 10, isActive: true }
    });
    roomId = room.id;

    const room2 = await prisma.room.create({
      data: { name: 'Sala de Inovação', capacity: 12, isActive: true }
    });
    room2Id = room2.id;

    const user = await prisma.user.create({
      data: { name: 'Tester Normal', email: 'tester@example.com', isVip: false }
    });
    userId = user.id;

    const vipUser = await prisma.user.create({
      data: { name: 'Sócio VIP', email: 'vip@example.com', isVip: true }
    });
    vipUserId = vipUser.id;

    // Garante que os mocks estejam limpos antes de cada teste
    jest.clearAllMocks();
  });

  describe('POST /api/bookings (Inteligência e VIP)', () => {
    it('deve sugerir outra sala se a principal estiver ocupada por um usuário normal', async () => {
      await prisma.booking.create({
        data: {
          roomId,
          userId,
          title: 'Reunião Existente',
          startTime: new Date('2026-10-10T09:00:00Z'),
          endTime: new Date('2026-10-10T10:00:00Z'),
          status: 'CONFIRMED'
        }
      });
  
      const body = {
        roomId,
        userId,
        title: 'Tentativa de Choque',
        startTime: new Date('2026-10-10T09:00:00Z').toISOString(),
        endTime: new Date('2026-10-10T10:00:00Z').toISOString(),
      };
  
      const request = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });
  
      const response = await POST(request);
      const data = await response.json();
  
      expect(response.status).toBe(409);
      expect(data.error).toBe('Sala Ocupada');
      expect(data.suggestion).toBeDefined();
      expect(data.suggestion.id).toBe(room2Id);
    });

    it('deve PERMITIR o choque de horários (Furar Fila) se o usuário for VIP', async () => {
      await prisma.booking.create({
        data: {
          roomId,
          userId,
          title: 'Reunião dos Estagiários',
          startTime: new Date('2026-10-10T09:00:00Z'),
          endTime: new Date('2026-10-10T10:00:00Z'),
          status: 'CONFIRMED'
        }
      });
  
      const body = {
        roomId,
        userId: vipUserId,
        title: 'Reunião Urgente do Sócio',
        startTime: new Date('2026-10-10T09:00:00Z').toISOString(),
        endTime: new Date('2026-10-10T10:00:00Z').toISOString(),
      };
  
      const request = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });
  
      const response = await POST(request);
      const data = await response.json();
  
      expect(response.status).toBe(201);
      expect(data.status).toBe('PENDING');
    });

    it('deve salvar a flag isOnline e a lista de convidados corretamente', async () => {
      const body = {
        roomId,
        userId,
        title: 'Reunião com Clientes Externos',
        startTime: new Date('2026-10-11T14:00:00Z').toISOString(),
        endTime: new Date('2026-10-11T15:00:00Z').toISOString(),
        isOnline: true,
        guests: [
          { name: 'Cliente A', email: 'cliente.a@gmail.com', phone: '11999999999' }
        ]
      };
  
      const request = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });
  
      const response = await POST(request);
      const data = await response.json();
  
      expect(response.status).toBe(201);
      expect(data.type).toBe('ONLINE');
      expect(data.guests).toBeDefined();
      
      const parsedGuests = JSON.parse(data.guests);
      expect(parsedGuests).toHaveLength(1);
      expect(parsedGuests[0].email).toBe('cliente.a@gmail.com');
    });
  });

  describe('GET /api/bookings', () => {
    it('deve listar os agendamentos com detalhes de sala e usuário', async () => {
      await prisma.booking.create({
        data: {
          roomId,
          userId,
          title: 'Planning',
          startTime: new Date('2026-10-15T14:00:00Z'),
          endTime: new Date('2026-10-15T15:00:00Z'),
        }
      });

      const request = new Request('http://localhost:3000/api/bookings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Planning');
      expect(data[0].room).toHaveProperty('name', 'Sala Executiva');
      expect(data[0].user).toHaveProperty('name', 'Tester Normal');
    });

    it('deve filtrar agendamentos por roomId', async () => {
      const roomOutra = await prisma.room.create({
        data: { name: 'Sala Outra', capacity: 5, isActive: true }
      });

      await prisma.booking.create({
        data: {
          roomId: roomId,
          userId,
          title: 'Reunião Sala 1',
          startTime: new Date('2026-10-15T10:00:00Z'),
          endTime: new Date('2026-10-15T11:00:00Z'),
        }
      });

      await prisma.booking.create({
        data: {
          roomId: roomOutra.id,
          userId,
          title: 'Reunião Sala 2',
          startTime: new Date('2026-10-15T10:00:00Z'),
          endTime: new Date('2026-10-15T11:00:00Z'),
        }
      });

      const request = new Request(`http://localhost:3000/api/bookings?roomId=${roomId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Reunião Sala 1');
    });
  });

  describe('DELETE /api/bookings', () => {
    it('deve cancelar um agendamento existente', async () => {
      const booking = await prisma.booking.create({
        data: {
          roomId,
          userId,
          title: 'Para Cancelar',
          startTime: new Date('2026-10-20T10:00:00Z'),
          endTime: new Date('2026-10-20T11:00:00Z'),
        }
      });

      const request = new Request(`http://localhost:3000/api/bookings?id=${booking.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request);

      expect(response.status).toBe(204);

      const check = await prisma.booking.findUnique({ where: { id: booking.id } });
      expect(check).toBeNull();
    });

    it('deve retornar 404 se tentar cancelar agendamento inexistente', async () => {
      const fakeId = '123456789012345678901234'; 
      const request = new Request(`http://localhost:3000/api/bookings?id=${fakeId}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request);

      expect(response.status).toBe(404);
    });
  });
});