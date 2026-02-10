import { POST, GET, PUT, DELETE } from '@/app/api/rooms/route';
import { prisma } from '@/lib/prisma';

describe('API de Salas (/api/rooms)', () => {
  // Limpar banco antes de cada teste
  beforeEach(async () => {
    // CORREÇÃO: Usamos transaction para garantir que a limpeza ocorra de uma vez,
    // evitando erros de chave estrangeira se outros testes estiverem rodando.
    await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.room.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  });

  describe('POST e GET', () => {
    it('deve criar e listar salas', async () => {
      const body = { name: 'Sala Teste', capacity: 10 };
      const reqPost = new Request('http://localhost:3000/api/rooms', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      await POST(reqPost);

      const reqGet = new Request('http://localhost:3000/api/rooms');
      const resGet = await GET();
      const data = await resGet.json();

      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Sala Teste');
    });
  });

  describe('PUT (Atualizar)', () => {
    it('deve atualizar o nome e capacidade de uma sala', async () => {
      const room = await prisma.room.create({
        data: { name: 'Sala Velha', capacity: 5, isActive: true }
      });

      const updateBody = {
        id: room.id,
        name: 'Sala Nova',
        capacity: 20
      };

      const request = new Request('http://localhost:3000/api/rooms', {
        method: 'PUT',
        body: JSON.stringify(updateBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Sala Nova');
      expect(data.capacity).toBe(20);
    });

    it('deve retornar 404 se tentar atualizar sala inexistente', async () => {
      const fakeId = '123456789012345678901234'; 
      const updateBody = { id: fakeId, name: 'Nada' };
      
      const request = new Request('http://localhost:3000/api/rooms', {
        method: 'PUT',
        body: JSON.stringify(updateBody)
      });

      const response = await PUT(request);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE (Excluir)', () => {
    it('deve excluir uma sala sem agendamentos', async () => {
      const room = await prisma.room.create({
        data: { name: 'Sala para Deletar', capacity: 5, isActive: true }
      });

      const request = new Request(`http://localhost:3000/api/rooms?id=${room.id}`, {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      expect(response.status).toBe(204);

      const check = await prisma.room.findUnique({ where: { id: room.id } });
      expect(check).toBeNull();
    });

    it('deve IMPEDIR a exclusão se houver agendamentos', async () => {
      const room = await prisma.room.create({
        data: { name: 'Sala Ocupada', capacity: 5, isActive: true }
      });
      const user = await prisma.user.create({
        data: { name: 'User', email: 'u@test.com' }
      });

      await prisma.booking.create({
        data: {
          roomId: room.id,
          userId: user.id,
          title: 'Reunião',
          startTime: new Date(),
          endTime: new Date()
        }
      });

      const request = new Request(`http://localhost:3000/api/rooms?id=${room.id}`, {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/possui agendamentos/i);
    });
  });
});