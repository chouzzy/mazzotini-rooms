/**
 * Bateria de testes para as funcionalidades implementadas:
 * 1. Remanejamento pelo usuário (PATCH /api/bookings)
 * 2. Aprovação/Recusa de remanejamento pelo admin (PUT com action)
 * 3. Geração de cancelToken no POST
 * 4. Cancelamento via token (GET /api/bookings/cancel)
 * 5. sendApprovalEmail recebe cancelToken no fluxo de aprovação
 */

import { POST, PUT, PATCH } from '@/app/api/bookings/route';
import { GET as cancelByToken } from '@/app/api/bookings/cancel/route';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import * as emailService from '../../lib/email';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../lib/email', () => ({
  sendPendingEmail: jest.fn().mockResolvedValue(true),
  sendApprovalEmail: jest.fn().mockResolvedValue(true),
  sendRejectionEmail: jest.fn().mockResolvedValue(true),
  sendCancellationEmail: jest.fn().mockResolvedValue(true),
  sendGuestInvitationEmail: jest.fn().mockResolvedValue(true),
  sendRescheduleRequestedEmail: jest.fn().mockResolvedValue(true),
  sendRescheduleApprovedEmail: jest.fn().mockResolvedValue(true),
  sendRescheduleRejectedEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../lib/microsoftGraph', () => ({
  createOnlineMeeting: jest.fn().mockResolvedValue({ joinWebUrl: 'https://teams.microsoft.com/fake-link' }),
  getMicrosoftToken: jest.fn().mockResolvedValue('fake-token'),
}));

// Helper para criar Request
const makeRequest = (method: string, body?: object, url = 'http://localhost:3000/api/bookings') =>
  new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Novas Funcionalidades — Remanejamento e Cancelamento por Token', () => {
  let roomId: string;
  let userId: string;
  let adminId: string;
  let userEmail: string;
  let adminEmail: string;

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.room.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const room = await prisma.room.create({
      data: { name: 'Sala Teste', capacity: 8, isActive: true },
    });
    roomId = room.id;

    userEmail = 'user@test.com';
    const user = await prisma.user.create({
      data: { name: 'Usuário Comum', email: userEmail, isVip: false },
    });
    userId = user.id;

    adminEmail = 'admin@test.com';
    const admin = await prisma.user.create({
      data: { name: 'Administrador', email: adminEmail, role: 'ADMIN' },
    });
    adminId = admin.id;

    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. GERAÇÃO DE cancelToken NO POST
  // ─────────────────────────────────────────────────────────────────────────
  describe('POST /api/bookings — cancelToken', () => {
    it('deve gerar um cancelToken único ao criar uma reserva', async () => {
      const body = {
        roomId, userId,
        title: 'Reunião com Token',
        startTime: new Date('2027-06-01T10:00:00Z').toISOString(),
        endTime: new Date('2027-06-01T11:00:00Z').toISOString(),
      };

      const res = await POST(makeRequest('POST', body));
      expect(res.status).toBe(201);

      const data = await res.json();
      const booking = await prisma.booking.findUnique({ where: { id: data.id } });

      expect(booking?.cancelToken).toBeDefined();
      expect(typeof booking?.cancelToken).toBe('string');
      expect(booking?.cancelToken?.length).toBeGreaterThan(10);
    });

    it('cada nova reserva deve ter um cancelToken diferente', async () => {
      const base = {
        roomId, userId,
        startTime: new Date('2027-06-02T10:00:00Z').toISOString(),
        endTime: new Date('2027-06-02T11:00:00Z').toISOString(),
      };

      const [res1, res2] = await Promise.all([
        POST(makeRequest('POST', { ...base, title: 'Reserva A' })),
        POST(makeRequest('POST', { ...base, title: 'Reserva B',
          startTime: new Date('2027-06-03T10:00:00Z').toISOString(),
          endTime: new Date('2027-06-03T11:00:00Z').toISOString(),
        })),
      ]);

      const [d1, d2] = await Promise.all([res1.json(), res2.json()]);
      const [b1, b2] = await Promise.all([
        prisma.booking.findUnique({ where: { id: d1.id } }),
        prisma.booking.findUnique({ where: { id: d2.id } }),
      ]);

      expect(b1?.cancelToken).not.toBe(b2?.cancelToken);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. sendApprovalEmail COM cancelToken NO FLUXO DE APROVAÇÃO
  // ─────────────────────────────────────────────────────────────────────────
  describe('PUT /api/bookings — sendApprovalEmail recebe cancelToken', () => {
    it('deve chamar sendApprovalEmail passando o cancelToken ao confirmar reserva PENDING', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: adminId, email: adminEmail, role: 'ADMIN' },
      });

      const token = 'token-fixo-para-teste';
      const booking = await prisma.booking.create({
        data: {
          roomId, userId, title: 'Reunião Pendente',
          startTime: new Date('2027-07-01T09:00:00Z'),
          endTime: new Date('2027-07-01T10:00:00Z'),
          status: BookingStatus.PENDING,
          cancelToken: token,
        },
      });

      const res = await PUT(makeRequest('PUT', { id: booking.id, status: 'CONFIRMED' }));
      expect(res.status).toBe(200);

      expect(emailService.sendApprovalEmail).toHaveBeenCalledTimes(1);
      const callArgs = (emailService.sendApprovalEmail as jest.Mock).mock.calls[0];
      // cancelToken deve ser o último argumento (índice 6)
      expect(callArgs[6]).toBe(token);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. PATCH /api/bookings — SOLICITAÇÃO DE REMANEJAMENTO PELO USUÁRIO
  // ─────────────────────────────────────────────────────────────────────────
  describe('PATCH /api/bookings — solicitação de remanejamento', () => {
    let confirmedBookingId: string;

    beforeEach(async () => {
      // Sessão: usuário comum
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: userId, email: userEmail, role: 'USER' },
      });

      const booking = await prisma.booking.create({
        data: {
          roomId, userId, title: 'Reunião Confirmada',
          startTime: new Date('2027-08-01T10:00:00Z'),
          endTime: new Date('2027-08-01T11:00:00Z'),
          status: BookingStatus.CONFIRMED,
        },
      });
      confirmedBookingId = booking.id;
    });

    it('deve retornar 401 se não estiver autenticado', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await PATCH(makeRequest('PATCH', {
        id: confirmedBookingId,
        requestedStartTime: new Date('2027-08-01T14:00:00Z').toISOString(),
        requestedEndTime: new Date('2027-08-01T15:00:00Z').toISOString(),
      }));

      expect(res.status).toBe(401);
    });

    it('deve retornar 403 se o usuário não é o dono da reserva', async () => {
      const outro = await prisma.user.create({
        data: { name: 'Intruso', email: 'intruso@test.com' },
      });
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: outro.id, email: 'intruso@test.com', role: 'USER' },
      });

      const res = await PATCH(makeRequest('PATCH', {
        id: confirmedBookingId,
        requestedStartTime: new Date('2027-08-01T14:00:00Z').toISOString(),
        requestedEndTime: new Date('2027-08-01T15:00:00Z').toISOString(),
      }));

      expect(res.status).toBe(403);
    });

    it('deve retornar 400 se reserva não está CONFIRMED', async () => {
      const bookingPending = await prisma.booking.create({
        data: {
          roomId, userId, title: 'Ainda Pendente',
          startTime: new Date('2027-08-02T10:00:00Z'),
          endTime: new Date('2027-08-02T11:00:00Z'),
          status: BookingStatus.PENDING,
        },
      });

      const res = await PATCH(makeRequest('PATCH', {
        id: bookingPending.id,
        requestedStartTime: new Date('2027-08-02T14:00:00Z').toISOString(),
        requestedEndTime: new Date('2027-08-02T15:00:00Z').toISOString(),
      }));

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/confirmadas/i);
    });

    it('deve retornar 400 se horário de fim é anterior ou igual ao início', async () => {
      const res = await PATCH(makeRequest('PATCH', {
        id: confirmedBookingId,
        requestedStartTime: new Date('2027-08-01T14:00:00Z').toISOString(),
        requestedEndTime: new Date('2027-08-01T13:00:00Z').toISOString(),
      }));

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/término deve ser posterior/i);
    });

    it('deve retornar 409 se há conflito de horário no novo slot solicitado', async () => {
      // Cria outra reserva confirmada no mesmo slot alvo
      await prisma.booking.create({
        data: {
          roomId, userId, title: 'Ocupando o novo slot',
          startTime: new Date('2027-08-01T14:00:00Z'),
          endTime: new Date('2027-08-01T15:00:00Z'),
          status: BookingStatus.CONFIRMED,
        },
      });

      const res = await PATCH(makeRequest('PATCH', {
        id: confirmedBookingId,
        requestedStartTime: new Date('2027-08-01T14:00:00Z').toISOString(),
        requestedEndTime: new Date('2027-08-01T15:00:00Z').toISOString(),
      }));

      expect(res.status).toBe(409);
    });

    it('deve mudar status para RESCHEDULE_PENDING e salvar horários solicitados', async () => {
      const newStart = new Date('2027-08-01T14:00:00Z');
      const newEnd = new Date('2027-08-01T15:00:00Z');

      const res = await PATCH(makeRequest('PATCH', {
        id: confirmedBookingId,
        requestedStartTime: newStart.toISOString(),
        requestedEndTime: newEnd.toISOString(),
      }));

      expect(res.status).toBe(200);

      const booking = await prisma.booking.findUnique({ where: { id: confirmedBookingId } });
      expect(booking?.status).toBe(BookingStatus.RESCHEDULE_PENDING);
      expect(booking?.requestedStartTime?.toISOString()).toBe(newStart.toISOString());
      expect(booking?.requestedEndTime?.toISOString()).toBe(newEnd.toISOString());
      // Horários originais devem permanecer intactos
      expect(booking?.startTime.toISOString()).toBe(new Date('2027-08-01T10:00:00Z').toISOString());
    });

    it('deve enviar email sendRescheduleRequestedEmail ao usuário', async () => {
      await PATCH(makeRequest('PATCH', {
        id: confirmedBookingId,
        requestedStartTime: new Date('2027-08-01T14:00:00Z').toISOString(),
        requestedEndTime: new Date('2027-08-01T15:00:00Z').toISOString(),
      }));

      expect(emailService.sendRescheduleRequestedEmail).toHaveBeenCalledTimes(1);
      const args = (emailService.sendRescheduleRequestedEmail as jest.Mock).mock.calls[0];
      expect(args[0]).toBe(userEmail);
    });

    it('não deve conflitar consigo mesmo ao solicitar remanejamento (ignorar a própria reserva)', async () => {
      // Pede um horário que sobrepõe a si mesmo (deve ser permitido, pois é a mesma reserva)
      const res = await PATCH(makeRequest('PATCH', {
        id: confirmedBookingId,
        requestedStartTime: new Date('2027-08-01T10:30:00Z').toISOString(),
        requestedEndTime: new Date('2027-08-01T11:30:00Z').toISOString(),
      }));

      expect(res.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. PUT /api/bookings com action: 'approve_reschedule'
  // ─────────────────────────────────────────────────────────────────────────
  describe('PUT /api/bookings — admin aprova remanejamento', () => {
    let bookingId: string;
    const originalStart = new Date('2027-09-01T10:00:00Z');
    const originalEnd = new Date('2027-09-01T11:00:00Z');
    const requestedStart = new Date('2027-09-01T14:00:00Z');
    const requestedEnd = new Date('2027-09-01T15:00:00Z');

    beforeEach(async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: adminId, email: adminEmail, role: 'ADMIN' },
      });

      const booking = await prisma.booking.create({
        data: {
          roomId, userId, title: 'Pedido de Remanejar',
          startTime: originalStart,
          endTime: originalEnd,
          status: BookingStatus.RESCHEDULE_PENDING,
          requestedStartTime: requestedStart,
          requestedEndTime: requestedEnd,
          cancelToken: 'cancel-token-remanejar',
        },
      });
      bookingId = booking.id;
    });

    it('deve aprovar: atualizar startTime/endTime e limpar campos requested', async () => {
      const res = await PUT(makeRequest('PUT', { id: bookingId, action: 'approve_reschedule' }));
      expect(res.status).toBe(200);

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      expect(booking?.status).toBe(BookingStatus.CONFIRMED);
      expect(booking?.startTime.toISOString()).toBe(requestedStart.toISOString());
      expect(booking?.endTime.toISOString()).toBe(requestedEnd.toISOString());
      expect(booking?.requestedStartTime).toBeNull();
      expect(booking?.requestedEndTime).toBeNull();
    });

    it('deve enviar sendRescheduleApprovedEmail com os novos horários', async () => {
      await PUT(makeRequest('PUT', { id: bookingId, action: 'approve_reschedule' }));

      expect(emailService.sendRescheduleApprovedEmail).toHaveBeenCalledTimes(1);
      const args = (emailService.sendRescheduleApprovedEmail as jest.Mock).mock.calls[0];
      expect(args[0]).toBe(userEmail);
      expect(args[6]).toBe('cancel-token-remanejar'); // cancelToken passado
    });

    it('deve retornar 409 se o novo horário já está ocupado por outra reserva CONFIRMED', async () => {
      // Cria uma reserva que ocupa o novo horário solicitado
      await prisma.booking.create({
        data: {
          roomId, userId, title: 'Bloqueando o novo slot',
          startTime: requestedStart,
          endTime: requestedEnd,
          status: BookingStatus.CONFIRMED,
        },
      });

      const res = await PUT(makeRequest('PUT', { id: bookingId, action: 'approve_reschedule' }));
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toMatch(/conflito|impossível|aprovar|horário/i);
    });

    it('deve retornar 400 se a reserva não está em RESCHEDULE_PENDING', async () => {
      const normalBooking = await prisma.booking.create({
        data: {
          roomId, userId, title: 'Normal',
          startTime: new Date('2027-09-05T10:00:00Z'),
          endTime: new Date('2027-09-05T11:00:00Z'),
          status: BookingStatus.CONFIRMED,
        },
      });

      const res = await PUT(makeRequest('PUT', { id: normalBooking.id, action: 'approve_reschedule' }));
      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. PUT /api/bookings com action: 'reject_reschedule'
  // ─────────────────────────────────────────────────────────────────────────
  describe('PUT /api/bookings — admin recusa remanejamento', () => {
    let bookingId: string;
    const originalStart = new Date('2027-10-01T10:00:00Z');
    const originalEnd = new Date('2027-10-01T11:00:00Z');

    beforeEach(async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: adminId, email: adminEmail, role: 'ADMIN' },
      });

      const booking = await prisma.booking.create({
        data: {
          roomId, userId, title: 'Pedido Recusado',
          startTime: originalStart,
          endTime: originalEnd,
          status: BookingStatus.RESCHEDULE_PENDING,
          requestedStartTime: new Date('2027-10-01T14:00:00Z'),
          requestedEndTime: new Date('2027-10-01T15:00:00Z'),
        },
      });
      bookingId = booking.id;
    });

    it('deve manter startTime/endTime originais e limpar campos requested', async () => {
      const res = await PUT(makeRequest('PUT', { id: bookingId, action: 'reject_reschedule' }));
      expect(res.status).toBe(200);

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      expect(booking?.status).toBe(BookingStatus.CONFIRMED);
      expect(booking?.startTime.toISOString()).toBe(originalStart.toISOString());
      expect(booking?.endTime.toISOString()).toBe(originalEnd.toISOString());
      expect(booking?.requestedStartTime).toBeNull();
      expect(booking?.requestedEndTime).toBeNull();
    });

    it('deve enviar sendRescheduleRejectedEmail informando horário original mantido', async () => {
      await PUT(makeRequest('PUT', { id: bookingId, action: 'reject_reschedule' }));

      expect(emailService.sendRescheduleRejectedEmail).toHaveBeenCalledTimes(1);
      const args = (emailService.sendRescheduleRejectedEmail as jest.Mock).mock.calls[0];
      expect(args[0]).toBe(userEmail);
      expect(args[1]).toBe('Pedido Recusado');
    });

    it('a reserva original deve continuar CONFIRMED e acessível', async () => {
      await PUT(makeRequest('PUT', { id: bookingId, action: 'reject_reschedule' }));

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      expect(booking?.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. GET /api/bookings/cancel — CANCELAMENTO POR TOKEN
  // ─────────────────────────────────────────────────────────────────────────
  describe('GET /api/bookings/cancel — cancelamento por e-mail', () => {
    let bookingId: string;
    const cancelToken = 'token-unico-de-teste-abc123';

    beforeEach(async () => {
      const booking = await prisma.booking.create({
        data: {
          roomId, userId, title: 'Reserva Para Cancelar',
          startTime: new Date('2027-11-01T10:00:00Z'),
          endTime: new Date('2027-11-01T11:00:00Z'),
          status: BookingStatus.CONFIRMED,
          cancelToken,
        },
      });
      bookingId = booking.id;
    });

    const makeCancelRequest = (token: string) =>
      new Request(`http://localhost:3000/api/bookings/cancel?token=${token}`);

    it('deve cancelar a reserva e redirecionar para página de sucesso', async () => {
      const res = await cancelByToken(makeCancelRequest(cancelToken));

      expect(res.status).toBe(302); // redirect

      const location = res.headers.get('location') || '';
      expect(location).toContain('/cancelar-reserva');
      expect(location).toContain('cancelado');
    });

    it('deve atualizar status para CANCELLED no banco', async () => {
      await cancelByToken(makeCancelRequest(cancelToken));

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      expect(booking?.status).toBe(BookingStatus.CANCELLED);
    });

    it('deve enviar sendCancellationEmail ao usuário', async () => {
      await cancelByToken(makeCancelRequest(cancelToken));

      expect(emailService.sendCancellationEmail).toHaveBeenCalledTimes(1);
      const args = (emailService.sendCancellationEmail as jest.Mock).mock.calls[0];
      expect(args[0]).toBe(userEmail);
    });

    it('deve redirecionar com erro para token inválido', async () => {
      const res = await cancelByToken(makeCancelRequest('token-que-nao-existe'));

      expect(res.status).toBe(302);
      const location = res.headers.get('location') || '';
      expect(location).toContain('/cancelar-reserva');
      expect(location).toContain('error');
    });

    it('deve redirecionar com status "ja_cancelado" se reserva já foi cancelada', async () => {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      const res = await cancelByToken(makeCancelRequest(cancelToken));
      const location = res.headers.get('location') || '';
      expect(location).toContain('ja_cancelado');
    });

    it('deve redirecionar com erro se token não é informado', async () => {
      const res = await cancelByToken(
        new Request('http://localhost:3000/api/bookings/cancel')
      );

      expect(res.status).toBe(302);
      const location = res.headers.get('location') || '';
      expect(location).toContain('error');
    });

    it('não deve cancelar reserva já REJECTED', async () => {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.REJECTED },
      });

      const res = await cancelByToken(makeCancelRequest(cancelToken));
      const location = res.headers.get('location') || '';
      // Deve tratar como já encerrado
      expect(location).toContain('ja_cancelado');
    });
  });
});
