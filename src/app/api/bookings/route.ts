import { prisma } from '@/lib/prisma';
import { createOnlineMeeting } from '@/lib/microsoftGraph';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email';
import { BookingStatus } from '@prisma/client';

// LISTAR AGENDAMENTOS (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    const where: any = {};
    
    if (roomId) where.roomId = roomId;
    if (email) where.user = { email: email };
    
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      where.status = status as BookingStatus;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return new Response(JSON.stringify(bookings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao listar agendamentos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// CRIAR AGENDAMENTO (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, userId, title, startTime, endTime } = body;

    if (!roomId || !userId || !title || !startTime || !endTime) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return new Response(
        JSON.stringify({ error: 'O horário de término deve ser após o início' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: roomId,
        status: { notIn: [BookingStatus.REJECTED, BookingStatus.CANCELLED] }, 
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } }
        ]
      }
    });

    if (conflictingBooking) {
      return new Response(
        JSON.stringify({ error: 'Já existe um agendamento para este horário nesta sala' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let onlineMeetingUrl = null;
    try {
      if (process.env.AZURE_AD_CLIENT_ID && process.env.TEAMS_ORGANIZER_ID) {
        const meeting = await createOnlineMeeting(title, start, end);
        onlineMeetingUrl = meeting.joinWebUrl;
      }
    } catch (teamsError) {
      console.error("Falha ao criar reunião no Teams:", teamsError);
    }

    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId,
        title,
        startTime: start,
        endTime: end,
        onlineMeetingUrl,
      },
    });

    return new Response(JSON.stringify(booking), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao criar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ATUALIZAR STATUS (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !Object.values(BookingStatus).includes(status)) {
      return new Response(
        JSON.stringify({ error: 'ID e Status válido são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true, room: true }
    });

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), { status: 404 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus }
    });

    if (booking.user.email) {
      if (status === BookingStatus.CONFIRMED) {
        await sendApprovalEmail(booking.user.email, booking.title, booking.room.name);
      } else if (status === BookingStatus.REJECTED) {
        await sendRejectionEmail(booking.user.email, booking.title);
      }
    }

    return new Response(JSON.stringify(updatedBooking), { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}

// DELETE (CORRIGIDO)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return new Response(JSON.stringify({ error: 'ID é obrigatório' }), { status: 400 });

    // CORREÇÃO: Verificar se existe antes de tentar deletar
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.booking.delete({ where: { id } });
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao deletar:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}