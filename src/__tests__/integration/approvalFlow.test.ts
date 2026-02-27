import { POST, PUT } from '@/app/api/bookings/route';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

// CORREÇÃO: Usamos caminho relativo para garantir que o Jest encontre o módulo
import * as emailService from '../../lib/email';

// Mock do next-auth para evitar o erro do pacote 'jose' (ES Modules) no Jest
// e para simular que um Administrador está fazendo as requisições.
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock do serviço de e-mail com caminho relativo
jest.mock('../../lib/email', () => ({
  sendApprovalEmail: jest.fn().mockResolvedValue(true),
  sendRejectionEmail: jest.fn().mockResolvedValue(true),
}));

describe('Fluxo de Aprovação de Reservas', () => {
  let roomId: string;
  let userId: string;
  let adminId: string;

  beforeEach(async () => {
    // Limpeza
    await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.room.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Setup: Sala
    const room = await prisma.room.create({
      data: { name: 'Sala Teste', capacity: 5, isActive: true }
    });
    roomId = room.id;

    // Setup: Usuário Comum
    const user = await prisma.user.create({
      data: { name: 'User Teste', email: 'user@teste.com' }
    });
    userId = user.id;

    // Setup: Administrador
    const admin = await prisma.user.create({
      data: { name: 'Admin Teste', email: 'admin@teste.com', role: 'ADMIN' }
    });
    adminId = admin.id;
    
    // Configura o mock da sessão para retornar o Administrador
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

    // Limpa os mocks do jest
    jest.clearAllMocks();
  });

  it('deve criar reserva como PENDING e enviar email ao CONFIRMAR', async () => {
    // 1. Criar Reserva (POST)
    const createBody = {
      roomId,
      title: 'Reserva Pendente',
      startTime: new Date('2026-12-01T10:00:00Z'),
      endTime: new Date('2026-12-01T11:00:00Z'),
    };

    const createReq = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify(createBody)
    });

    const createRes = await POST(createReq);
    const booking = await createRes.json();

    // Verificação 1: Status inicial deve ser PENDING
    expect(createRes.status).toBe(201);
    expect(booking.status).toBe(BookingStatus.PENDING);

    // 2. Admin Aprova (PUT) - Usando CONFIRMED
    const updateReq = new Request('http://localhost:3000/api/bookings', {
      method: 'PUT',
      body: JSON.stringify({ id: booking.id, status: BookingStatus.CONFIRMED })
    });

    const updateRes = await PUT(updateReq);
    const updatedBooking = await updateRes.json();

    // Verificação 2: Status deve ser CONFIRMED
    expect(updateRes.status).toBe(200);
    expect(updatedBooking.status).toBe(BookingStatus.CONFIRMED);

    // Verificação 3: Serviço de e-mail deve ter sido chamado (para o e-mail do admin que criou)
    expect(emailService.sendApprovalEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendApprovalEmail).toHaveBeenCalledWith(
      'admin@teste.com', 
      'Reserva Pendente', 
      'Sala Teste'
    );
  });

  it('deve enviar email de rejeição ao REJEITAR', async () => {
    // 1. Setup: Cria reserva direto no banco com o usuário comum
    const booking = await prisma.booking.create({
      data: {
        roomId, userId, title: 'Reserva Ruim',
        startTime: new Date('2026-12-02T10:00:00Z'),
        endTime: new Date('2026-12-02T11:00:00Z'),
        status: BookingStatus.PENDING
      }
    });

    // 2. Admin Rejeita (PUT)
    const updateReq = new Request('http://localhost:3000/api/bookings', {
      method: 'PUT',
      body: JSON.stringify({ id: booking.id, status: BookingStatus.REJECTED })
    });

    await PUT(updateReq);

    // Verificação
    expect(emailService.sendRejectionEmail).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar concorrentes automaticamente ao APROVAR uma reserva', async () => {
    // 1. Setup: Criar 2 reservas concorrentes (mesmo horário)
    const bookingWinner = await prisma.booking.create({
      data: {
        roomId, userId, title: 'Reserva Vencedora',
        startTime: new Date('2026-12-05T14:00:00Z'),
        endTime: new Date('2026-12-05T15:00:00Z'),
        status: BookingStatus.PENDING
      }
    });

    const userLoser = await prisma.user.create({
      data: { name: 'Perdedor', email: 'perdedor@teste.com' }
    });

    const bookingLoser = await prisma.booking.create({
      data: {
        roomId, userId: userLoser.id, title: 'Reserva Perdedora',
        startTime: new Date('2026-12-05T14:30:00Z'), // Sobrepõe em 30 min
        endTime: new Date('2026-12-05T15:30:00Z'),
        status: BookingStatus.PENDING
      }
    });

    // 2. Admin Aprova a Vencedora
    const updateReq = new Request('http://localhost:3000/api/bookings', {
      method: 'PUT',
      body: JSON.stringify({ id: bookingWinner.id, status: BookingStatus.CONFIRMED })
    });

    const updateRes = await PUT(updateReq);
    expect(updateRes.status).toBe(200);

    // 3. Verificações no Banco
    const checkWinner = await prisma.booking.findUnique({ where: { id: bookingWinner.id } });
    const checkLoser = await prisma.booking.findUnique({ where: { id: bookingLoser.id } });

    expect(checkWinner?.status).toBe(BookingStatus.CONFIRMED);
    expect(checkLoser?.status).toBe(BookingStatus.REJECTED);

    // 4. Verifica se o e-mail de rejeição foi enviado para o concorrente perdedor
    expect(emailService.sendRejectionEmail).toHaveBeenCalledWith('perdedor@teste.com', 'Reserva Perdedora');
  });

  it('deve impedir a aprovação se já existir uma reserva CONFIRMADA no horário', async () => {
    // 1. Setup: Uma reserva já APROVADA
    await prisma.booking.create({
      data: {
        roomId, userId, title: 'Reserva Já Aprovada',
        startTime: new Date('2026-12-10T09:00:00Z'),
        endTime: new Date('2026-12-10T10:00:00Z'),
        status: BookingStatus.CONFIRMED
      }
    });

    // 2. Setup: Uma reserva PENDENTE a tentar o mesmo horário
    const userLate = await prisma.user.create({
      data: { name: 'Atrasado', email: 'atrasado@teste.com' }
    });

    const bookingLate = await prisma.booking.create({
      data: {
        roomId, userId: userLate.id, title: 'Reserva Atrasada',
        startTime: new Date('2026-12-10T09:30:00Z'),
        endTime: new Date('2026-12-10T10:30:00Z'),
        status: BookingStatus.PENDING
      }
    });

    // 3. Admin (ou duplo clique) tenta aprovar a reserva pendente atrasada
    const updateReq = new Request('http://localhost:3000/api/bookings', {
      method: 'PUT',
      body: JSON.stringify({ id: bookingLate.id, status: BookingStatus.CONFIRMED })
    });

    const updateRes = await PUT(updateReq);

    // 4. Deve ser barrado com status 409 Conflict
    expect(updateRes.status).toBe(409);
    
    const errorData = await updateRes.json();
    expect(errorData.error).toMatch(/Impossível aprovar/i);
  });
});