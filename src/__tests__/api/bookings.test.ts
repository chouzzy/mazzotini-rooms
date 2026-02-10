import { POST, GET, DELETE } from '@/app/api/bookings/route';
import { prisma } from '@/lib/prisma';

describe('API de Agendamentos', () => {
  let roomId: string;
  let userId: string;

  beforeEach(async () => {
    // Limpeza atômica
    await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.room.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const room = await prisma.room.create({
      data: {
        name: 'Sala de Teste',
        capacity: 10,
        description: 'Sala para testes',
        isActive: true
      }
    });
    roomId = room.id;

    const user = await prisma.user.create({
      data: {
        name: 'Tester',
        email: 'tester@example.com',
      }
    });
    userId = user.id;
  });

  describe('POST /api/bookings', () => {
    it('deve criar um agendamento com sucesso', async () => {
      const body = {
        roomId,
        userId,
        title: 'Daily Meeting',
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
      expect(data.title).toBe('Daily Meeting');
      expect(data.userId).toBe(userId);
    });
  
    it('deve impedir agendamento em horário conflitante', async () => {
      await prisma.booking.create({
        data: {
          roomId,
          userId,
          title: 'Reunião Existente',
          startTime: new Date('2026-10-10T09:00:00Z'),
          endTime: new Date('2026-10-10T10:00:00Z'),
        }
      });
  
      const body = {
        roomId,
        userId,
        title: 'Conflito',
        startTime: new Date('2026-10-10T09:00:00Z').toISOString(),
        endTime: new Date('2026-10-10T10:00:00Z').toISOString(),
      };
  
      const request = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });
  
      const response = await POST(request);
      expect(response.status).toBe(409);
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
      expect(data[0].room).toHaveProperty('name', 'Sala de Teste');
      expect(data[0].user).toHaveProperty('name', 'Tester');
    });

    it('deve filtrar agendamentos por roomId', async () => {
      const room2 = await prisma.room.create({
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
          roomId: room2.id,
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

    it('deve filtrar agendamentos por email do usuário', async () => {
      // 1. Criar outro usuário
      const otherUser = await prisma.user.create({
        data: { name: 'Outro', email: 'outro@test.com' }
      });

      // 2. Agendamento do Usuário Principal
      await prisma.booking.create({
        data: {
          roomId,
          userId: userId, // tester@example.com
          title: 'Reunião Minha',
          startTime: new Date('2026-10-16T10:00:00Z'),
          endTime: new Date('2026-10-16T11:00:00Z'),
        }
      });

      // 3. Agendamento do Outro Usuário
      await prisma.booking.create({
        data: {
          roomId,
          userId: otherUser.id,
          title: 'Reunião Dele',
          startTime: new Date('2026-10-16T12:00:00Z'),
          endTime: new Date('2026-10-16T13:00:00Z'),
        }
      });

      // 4. Filtrar pelo email do usuário principal
      const request = new Request(`http://localhost:3000/api/bookings?email=tester@example.com`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Reunião Minha');
      expect(data[0].user.email).toBe('tester@example.com');
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

    it('deve retornar 400 se não passar ID', async () => {
      const request = new Request(`http://localhost:3000/api/bookings`, {
        method: 'DELETE',
      });
      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('ID do agendamento é obrigatório');
    });
  });
});