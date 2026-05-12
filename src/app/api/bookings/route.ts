// src/app/api/bookings/route.ts

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOnlineMeeting } from '@/lib/microsoftGraph';
import {
  sendApprovalEmail, sendRejectionEmail, sendCancellationEmail, sendPendingEmail,
  sendGuestInvitationEmail, sendRescheduleRequestedEmail, sendRescheduleApprovedEmail,
  sendRescheduleRejectedEmail
} from '@/lib/email';
import { BookingStatus, MeetingType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, userId, title, startTime, endTime, isOnline, guests } = body;

    if (!roomId || !userId || !title || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: 'Todos os campos são obrigatórios' }), { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currentRoom = await prisma.room.findUnique({ where: { id: roomId } });
    const isVip = user?.isVip || false;

    // Validação de Backend: Mínimo de 4h
    const now = new Date();
    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (!isVip && diffHours < 3.9) { 
      return new Response(JSON.stringify({ error: 'O agendamento requer antecedência mínima de 4 horas.' }), { status: 400 });
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } }
        ]
      }
    });

    if (conflictingBooking) {
      if (!isVip) {
        const suggestedRoom = await prisma.room.findFirst({
          where: {
            isActive: true,
            id: { not: roomId },
            capacity: { gte: currentRoom?.capacity || 1 },
            bookings: {
              none: {
                status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
                AND: [
                  { startTime: { lt: end } },
                  { endTime: { gt: start } }
                ]
              }
            }
          },
          select: { id: true, name: true, capacity: true }
        });

        if (suggestedRoom) {
          return new Response(JSON.stringify({ 
            error: 'Sala Ocupada', 
            suggestion: suggestedRoom 
          }), { status: 409 });
        }

        return new Response(JSON.stringify({ error: 'A sala já está ocupada neste horário e não há alternativas compatíveis.' }), { status: 409 });
      }
    }

    const { randomUUID } = await import('crypto');
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId,
        title,
        startTime: start,
        endTime: end,
        type: isOnline ? MeetingType.ONLINE : MeetingType.IN_PERSON,
        status: BookingStatus.PENDING,
        guests: guests && guests.length > 0 ? JSON.stringify(guests) : null,
        cancelToken: randomUUID(),
      },
      include: { user: true, room: true }
    });

    if (booking.user.email) {
      await sendPendingEmail(booking.user.email, booking.title, booking.room.name, booking.startTime, booking.endTime);
    }

    return new Response(JSON.stringify(booking), { status: 201 });
  } catch (error) {
    console.error('Erro detalhado no POST /api/bookings:', error);
    return new Response(JSON.stringify({ error: 'Erro ao criar agendamento' }), { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
    }

    const body = await request.json();
    const { id, status, roomId, startTime, endTime, action } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID é obrigatório' }), { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { user: true, room: true }
    });

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), { status: 404 });
    }

    // Aprovação ou recusa de pedido de remanejamento feito pelo usuário
    if (action === 'approve_reschedule' || action === 'reject_reschedule') {
      if (existing.status !== BookingStatus.RESCHEDULE_PENDING) {
        return new Response(JSON.stringify({ error: 'Esta reserva não possui pedido de remanejamento pendente.' }), { status: 400 });
      }

      if (action === 'approve_reschedule') {
        const approvedStart = existing.requestedStartTime!;
        const approvedEnd = existing.requestedEndTime!;

        const conflict = await prisma.booking.findFirst({
          where: {
            roomId: existing.roomId,
            status: BookingStatus.CONFIRMED,
            id: { not: id },
            AND: [{ startTime: { lt: approvedEnd } }, { endTime: { gt: approvedStart } }]
          }
        });
        if (conflict) {
          return new Response(JSON.stringify({ error: 'Não é possível aprovar. Já existe uma reserva confirmada no novo horário solicitado.' }), { status: 409 });
        }

        // Regera link Teams se for reunião online
        let onlineMeetingUrl = existing.onlineMeetingUrl;
        if (existing.type === MeetingType.ONLINE) {
          try {
            if (existing.user.email) {
              let parsedGuests: any[] = [];
              if (existing.guests) { try { parsedGuests = JSON.parse(existing.guests); } catch (e) {} }
              const meeting = await createOnlineMeeting(existing.title, approvedStart, approvedEnd, existing.user.email, parsedGuests);
              onlineMeetingUrl = meeting.joinWebUrl;
            }
          } catch (err) {
            console.error('Erro ao regerar link do Teams no remanejamento:', err);
          }
        }

        const updated = await prisma.booking.update({
          where: { id },
          data: {
            status: BookingStatus.CONFIRMED,
            startTime: approvedStart,
            endTime: approvedEnd,
            requestedStartTime: null,
            requestedEndTime: null,
            onlineMeetingUrl,
          },
          include: { user: true, room: true }
        });

        if (existing.user.email) {
          await sendRescheduleApprovedEmail(
            existing.user.email, updated.title, updated.room.name,
            updated.startTime, updated.endTime, updated.onlineMeetingUrl, existing.cancelToken
          );
        }
        return new Response(JSON.stringify(updated), { status: 200 });
      }

      // reject_reschedule: cancela o pedido, mantém reserva original CONFIRMED
      const restored = await prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CONFIRMED,
          requestedStartTime: null,
          requestedEndTime: null,
        },
        include: { user: true, room: true }
      });

      if (existing.user.email) {
        await sendRescheduleRejectedEmail(
          existing.user.email, restored.title, restored.room.name,
          restored.startTime, restored.endTime
        );
      }
      return new Response(JSON.stringify(restored), { status: 200 });
    }

    const newRoomId = roomId || existing.roomId;
    const newStartTime = startTime ? new Date(startTime) : existing.startTime;
    const newEndTime = endTime ? new Date(endTime) : existing.endTime;
    const newStatus = status as BookingStatus || existing.status;

    if (newStatus === BookingStatus.CONFIRMED) {
      const conflict = await prisma.booking.findFirst({
        where: {
          roomId: newRoomId,
          status: BookingStatus.CONFIRMED,
          id: { not: id },
          AND: [
            { startTime: { lt: newEndTime } },
            { endTime: { gt: newStartTime } }
          ]
        }
      });

      if (conflict) {
        return new Response(JSON.stringify({ error: 'Impossível aprovar ou remanejar. Já existe uma reserva confirmada neste horário.' }), { status: 409 });
      }
    }

    let onlineMeetingUrl = existing.onlineMeetingUrl;
    let parsedGuests: any[] = [];

    if (existing.guests) {
      try { parsedGuests = JSON.parse(existing.guests); } catch (e) {}
    }

    // Se aprovada e for tipo ONLINE, gera o link no Teams enviando os convidados
    if (newStatus === BookingStatus.CONFIRMED && existing.type === MeetingType.ONLINE && !onlineMeetingUrl) {
      try {
        if (existing.user.email) {
          const meeting = await createOnlineMeeting(
            existing.title,
            newStartTime,
            newEndTime,
            existing.user.email,
            parsedGuests
          );
          onlineMeetingUrl = meeting.joinWebUrl;
        }
      } catch (error) {
        console.error("Erro ao gerar link do Teams:", error);
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: newStatus,
        roomId: newRoomId,
        startTime: newStartTime,
        endTime: newEndTime,
        onlineMeetingUrl
      },
      include: { user: true, room: true }
    });

    if (existing.user.email) {
      if (newStatus === BookingStatus.CONFIRMED && existing.status === BookingStatus.PENDING) {
        await sendApprovalEmail(
          existing.user.email, updated.title, updated.room.name,
          updated.startTime, updated.endTime, updated.onlineMeetingUrl, existing.cancelToken
        );

        if (parsedGuests.length > 0) {
          const hostName = updated.user.name || updated.user.email || 'Membro da Equipe';
          for (const guest of parsedGuests) {
            if (guest.email) {
              await sendGuestInvitationEmail(
                guest.email,
                guest.name || 'Convidado(a)',
                updated.title,
                updated.room.name,
                updated.startTime,
                updated.endTime,
                updated.onlineMeetingUrl,
                hostName
              );
            }
          }
        }

        // Rejeita automaticamente as concorrentes
        const pendingConflicts = await prisma.booking.findMany({
          where: {
            roomId: updated.roomId,
            status: BookingStatus.PENDING,
            id: { not: updated.id },
            AND: [
              { startTime: { lt: updated.endTime } },
              { endTime: { gt: updated.startTime } }
            ]
          },
          include: { user: true }
        });

        for (const conflict of pendingConflicts) {
          await prisma.booking.update({
            where: { id: conflict.id },
            data: { status: BookingStatus.REJECTED }
          });
          if (conflict.user.email) {
             await sendRejectionEmail(
               conflict.user.email, conflict.title, updated.room.name,
               conflict.startTime, conflict.endTime
             );
          }
        }
      }
      else if (newStatus === BookingStatus.REJECTED && existing.status !== BookingStatus.REJECTED) {
        await sendRejectionEmail(
          existing.user.email, updated.title, updated.room.name,
          updated.startTime, updated.endTime
        );
      }
    }

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error('Erro no PUT /api/bookings:', error);
    return new Response(JSON.stringify({ error: 'Erro ao atualizar' }), { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }

    const body = await request.json();
    const { id, requestedStartTime, requestedEndTime } = body;

    if (!id || !requestedStartTime || !requestedEndTime) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios ausentes' }), { status: 400 });
    }

    const newStart = new Date(requestedStartTime);
    const newEnd = new Date(requestedEndTime);

    if (newEnd <= newStart) {
      return new Response(JSON.stringify({ error: 'O horário de término deve ser posterior ao início.' }), { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { user: true, room: true }
    });

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), { status: 404 });
    }

    const requestingUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!requestingUser || existing.userId !== requestingUser.id) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 403 });
    }

    if (existing.status !== BookingStatus.CONFIRMED) {
      return new Response(JSON.stringify({ error: 'Apenas reservas confirmadas podem ser remanejadas.' }), { status: 400 });
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: existing.roomId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        id: { not: id },
        AND: [
          { startTime: { lt: newEnd } },
          { endTime: { gt: newStart } }
        ]
      }
    });

    if (conflict) {
      return new Response(JSON.stringify({ error: 'Não há disponibilidade na sala para o novo horário solicitado.' }), { status: 409 });
    }

    const isAdmin = requestingUser.role === 'ADMIN';

    if (isAdmin) {
      // Admin remarca direto — sem precisar de aprovação
      const updated = await prisma.booking.update({
        where: { id },
        data: { startTime: newStart, endTime: newEnd },
        include: { user: true, room: true }
      });
      if (existing.user.email) {
        await sendRescheduleApprovedEmail(
          existing.user.email, updated.title, updated.room.name,
          updated.startTime, updated.endTime, updated.onlineMeetingUrl, existing.cancelToken
        );
      }
      return new Response(JSON.stringify(updated), { status: 200 });
    }

    // Usuário comum: vai para aprovação do admin
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        requestedStartTime: newStart,
        requestedEndTime: newEnd,
        status: BookingStatus.RESCHEDULE_PENDING,
      },
      include: { user: true, room: true }
    });

    if (existing.user.email) {
      await sendRescheduleRequestedEmail(
        existing.user.email, updated.title, updated.room.name, newStart, newEnd
      );
    }

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error('Erro no PATCH /api/bookings:', error);
    return new Response(JSON.stringify({ error: 'Erro ao solicitar remanejamento' }), { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const roomId = searchParams.get('roomId');
    const all = searchParams.get('all');

    let whereClause: any = {};
    if (email) whereClause.user = { email };
    if (roomId) whereClause.roomId = roomId;

    const bookings = await prisma.booking.findMany({
      where: Object.keys(whereClause).length > 0 || all ? whereClause : undefined,
      include: {
        user: { select: { name: true, email: true } },
        room: { select: { name: true, capacity: true, amenities: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    return new Response(JSON.stringify(bookings), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro ao buscar' }), { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return new Response(JSON.stringify({ error: 'ID é obrigatório' }), { status: 400 });

    const existing = await prisma.booking.findUnique({ 
      where: { id }, include: { user: true, room: true } 
    });
    
    if (!existing) return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), { status: 404 });

    await prisma.booking.delete({ where: { id } });

    if (existing.user.email) {
      await sendCancellationEmail(
        existing.user.email, existing.title, existing.room.name, 
        existing.startTime, existing.endTime
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}