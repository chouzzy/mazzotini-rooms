import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOnlineMeeting } from '@/lib/microsoftGraph';
import { sendApprovalEmail, sendRejectionEmail, sendCancellationEmail } from '@/lib/email';

// Criamos o status localmente para evitar bugs de cache/importação do Prisma no Next.js
const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
} as const;

// ----------------------------------------------------------------------
// GET - LISTAR RESERVAS
// ----------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const email = searchParams.get('email');
    const all = searchParams.get('all');

    const session = await getServerSession(authOptions);
    if (!session && !all) return new Response('Não autorizado', { status: 401 });

    const where: any = {};
    if (roomId) where.roomId = roomId;
    
    if (email) {
      where.user = { email };
    } else if (!all && session?.user?.role !== 'ADMIN') {
      where.userId = session?.user?.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: true,
        user: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return new Response(JSON.stringify(bookings), { status: 200 });
  } catch (error: any) {
    console.error('❌ ERRO DETALHADO NO GET /api/bookings:', error.message);

    if (error.message?.includes('Inconsistent query result')) {
      console.log('🛠️ Iniciando Auto-Heal: Limpando agendamentos órfãos...');
      
      try {
        const rawBookings = await prisma.booking.findMany();
        const rooms = await prisma.room.findMany({ select: { id: true } });
        const users = await prisma.user.findMany({ select: { id: true } });
        
        const validRoomIds = new Set(rooms.map(r => r.id));
        const validUserIds = new Set(users.map(u => u.id));
        
        const orphanedIds = rawBookings
          .filter(b => !validRoomIds.has(b.roomId) || !validUserIds.has(b.userId))
          .map(b => b.id);
          
        if (orphanedIds.length > 0) {
          await prisma.booking.deleteMany({ where: { id: { in: orphanedIds } } });
          console.log(`✅ Auto-Heal concluído: ${orphanedIds.length} agendamentos órfãos removidos.`);
          
          const healedBookings = await prisma.booking.findMany({
            include: { room: true, user: true },
            orderBy: { startTime: 'asc' },
          });
          
          return new Response(JSON.stringify(healedBookings), { status: 200 });
        }
      } catch (healError) {
        console.error('❌ Erro durante o Auto-Heal:', healError);
      }
    }

    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}

// ----------------------------------------------------------------------
// POST - CRIAR RESERVA (PERMITE CONCORRÊNCIA SE ESTIVER PENDENTE)
// ----------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response('Não autorizado', { status: 401 });

    const body = await request.json();
    const { roomId, title, startTime, endTime } = body;
    const userId = session.user.id;

    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        status: BookingStatus.CONFIRMED,
        startTime: { lt: end }, 
        endTime: { gt: start }  
      },
    });

    if (conflictingBooking) {
      return new Response(JSON.stringify({ 
        error: 'Esta sala já possui uma reserva APROVADA para este horário.' 
      }), { status: 409 });
    }

    // REMOVIDO: Não criamos mais o link do Teams aqui. 
    // O agendamento está pendente e não faz sentido bloquear agenda ainda.
    
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId,
        title,
        startTime: start,
        endTime: end,
        onlineMeetingUrl: null, // O link será gerado apenas na aprovação
        status: BookingStatus.PENDING
      }
    });

    return new Response(JSON.stringify(booking), { status: 201 });
  } catch (error) {
    console.error('❌ ERRO DETALHADO NO POST /api/bookings:', error);
    return new Response('Erro interno', { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PUT - APROVAR/REJEITAR RESERVA E LIMPAR CONCORRENTES
// ----------------------------------------------------------------------
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new Response('Não autorizado', { status: 401 });
    }

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

    if (status === BookingStatus.CONFIRMED) {
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          roomId: booking.roomId,
          status: BookingStatus.CONFIRMED,
          id: { not: booking.id }, 
          startTime: { lt: booking.endTime },
          endTime: { gt: booking.startTime }
        },
      });

      if (conflictingBooking) {
        return new Response(JSON.stringify({ 
          error: 'Impossível aprovar: Outra reserva já foi confirmada para esta sala neste horário.' 
        }), { status: 409 });
      }
    }

    let meetingLink = booking.onlineMeetingUrl;

    // NOVO: Se foi aprovado e não tem link, criamos a reunião no Teams AGORA
    if (status === BookingStatus.CONFIRMED && !meetingLink && process.env.AZURE_AD_CLIENT_ID) {
      try {
        const meeting = await createOnlineMeeting(
          booking.title, 
          booking.startTime, 
          booking.endTime,
          booking.user.email // Passamos o email do usuário para convidá-lo para a reunião
        );
        meetingLink = meeting.joinWebUrl;
      } catch (e) {
        console.error("Erro ao criar Teams na aprovação:", e);
      }
    }

    // Atualizamos a reserva com o novo status e o link do Teams
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: status as any,
        onlineMeetingUrl: meetingLink 
      }
    });

    if (booking.user.email) {
      if (status === BookingStatus.CONFIRMED) {
        await sendApprovalEmail(
          booking.user.email, 
          booking.title, 
          booking.room.name,
          booking.startTime,
          booking.endTime,
          meetingLink
        );
      } else if (status === BookingStatus.REJECTED) {
        await sendRejectionEmail(
          booking.user.email, 
          booking.title, 
          booking.room.name,
          booking.startTime,
          booking.endTime
        );
      }
    }

    // Cancelar Concorrentes se Aprovado
    if (status === BookingStatus.CONFIRMED) {
      const start = booking.startTime;
      const end = booking.endTime;

      const conflictingPendings = await prisma.booking.findMany({
        where: {
          id: { not: booking.id }, 
          roomId: booking.roomId,
          status: BookingStatus.PENDING,
          startTime: { lt: end }, 
          endTime: { gt: start }
        },
        include: { user: true, room: true } 
      });

      if (conflictingPendings.length > 0) {
        const conflictingIds = conflictingPendings.map(b => b.id);
        
        await prisma.booking.updateMany({
          where: { id: { in: conflictingIds } },
          data: { status: BookingStatus.REJECTED as any }
        });

        for (const competitor of conflictingPendings) {
          if (competitor.user.email) {
            await sendRejectionEmail(
              competitor.user.email, 
              competitor.title,
              competitor.room.name,
              competitor.startTime,
              competitor.endTime
            );
          }
        }
      }
    }

    return new Response(JSON.stringify(updatedBooking), { status: 200 });

  } catch (error) {
    console.error('❌ ERRO DETALHADO NO PUT /api/bookings:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE - CANCELAR RESERVA
// ----------------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID do agendamento é obrigatório' }), { status: 400 });
    }

    // Precisamos incluir o usuário e a sala para conseguir os dados para o e-mail
    const existing = await prisma.booking.findUnique({ 
      where: { id },
      include: { user: true, room: true } 
    });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Agendamento não encontrado' }), { status: 404 });
    }

    // Deleta a reserva do banco
    await prisma.booking.delete({ where: { id } });

    // Dispara o e-mail de cancelamento para o usuário
    if (existing.user.email) {
      await sendCancellationEmail(
        existing.user.email,
        existing.title,
        existing.room.name,
        existing.startTime,
        existing.endTime
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('❌ ERRO DETALHADO NO DELETE /api/bookings:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}