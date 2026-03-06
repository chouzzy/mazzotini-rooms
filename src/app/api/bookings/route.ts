import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOnlineMeeting } from '@/lib/microsoftGraph';
import { sendApprovalEmail, sendRejectionEmail, sendCancellationEmail, sendPendingEmail, sendGuestInvitationEmail } from '@/lib/email';
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
    const { id, status, roomId, startTime, endTime } = body;

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
    let parsedGuests = [];
    
    // Converte os convidados do banco de volta para Array para mandar pra Microsoft
    if (existing.guests) {
      try { parsedGuests = JSON.parse(existing.guests); } catch (e) {}
    }

    // Se aprovada e for tipo ONLINE, gera o link no Teams enviando os convidados
    if (newStatus === BookingStatus.CONFIRMED && existing.type === MeetingType.ONLINE && !onlineMeetingUrl) {
      try {
        const meeting = await createOnlineMeeting(
          existing.title, 
          newStartTime, 
          newEndTime, 
          existing.user.email,
          parsedGuests // <-- ENVIAMOS A LISTA DE CONVIDADOS AQUI
        );
        onlineMeetingUrl = meeting.joinWebUrl;
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
        // Envia para o solicitante
        await sendApprovalEmail(
          existing.user.email, updated.title, updated.room.name, 
          updated.startTime, updated.endTime, updated.onlineMeetingUrl
        );

        // Dispara também nosso e-mail customizado (branded) para os convidados
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