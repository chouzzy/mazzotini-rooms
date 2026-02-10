import { POST, PUT } from '@/app/api/bookings/route';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

// CORREÇÃO: Usamos caminho relativo para garantir que o Jest encontre o módulo
import * as emailService from '../../lib/email';

// Mock do serviço de e-mail com caminho relativo
jest.mock('../../lib/email', () => ({
  sendApprovalEmail: jest.fn().mockResolvedValue(true),
  sendRejectionEmail: jest.fn().mockResolvedValue(true),
}));

describe('Fluxo de Aprovação de Reservas', () => {
  let roomId: string;
  let userId: string;

  beforeEach(async () => {
    // Limpeza
    await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.room.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Setup: Sala e Usuário
    const room = await prisma.room.create({
      data: { name: 'Sala Teste', capacity: 5, isActive: true }
    });
    roomId = room.id;

    const user = await prisma.user.create({
      data: { name: 'User Teste', email: 'user@teste.com' }
    });
    userId = user.id;
    
    // Limpa os mocks do jest
    jest.clearAllMocks();
  });

  it('deve criar reserva como PENDING e enviar email ao CONFIRMAR', async () => {
    // 1. Criar Reserva (POST)
    const createBody = {
      roomId,
      userId,
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

    // Verificação 3: Serviço de e-mail deve ter sido chamado
    expect(emailService.sendApprovalEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendApprovalEmail).toHaveBeenCalledWith(
      'user@teste.com', 
      'Reserva Pendente', 
      'Sala Teste'
    );
  });

  it('deve enviar email de rejeição ao REJEITAR', async () => {
    // 1. Setup: Cria reserva direto no banco
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
});