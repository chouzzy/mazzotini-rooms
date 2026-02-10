import { prisma } from '@/lib/prisma';
import { createOnlineMeeting } from '@/lib/microsoftGraph';

// LISTAR AGENDAMENTOS (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const email = searchParams.get('email');

    const where: any = {};
    
    if (roomId) {
      where.roomId = roomId;
    }

    if (email) {
      where.user = {
        email: email
      };
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

    // 1. Validação
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

    // 2. Verificar Conflito
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: roomId,
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

    // 3. Integração com Microsoft Teams
    let onlineMeetingUrl = null;
    
    // Tenta criar a reunião, mas não bloqueia o agendamento se falhar (falha graciosa)
    // ou bloqueia se for requisito obrigatório. Aqui, vamos apenas logar o erro.
    try {
      // Verifica se as variáveis de ambiente do Teams estão configuradas antes de tentar
      if (process.env.AZURE_AD_CLIENT_ID && process.env.TEAMS_ORGANIZER_ID) {
        const meeting = await createOnlineMeeting(title, start, end);
        onlineMeetingUrl = meeting.joinWebUrl;
      }
    } catch (teamsError) {
      console.error("Falha ao criar reunião no Teams:", teamsError);
      // Opcional: Adicionar aviso na resposta, mas prosseguir com o agendamento da sala física
    }

    // 4. Salvar no Banco
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId,
        title,
        startTime: start,
        endTime: end,
        onlineMeetingUrl, // Salva o link se tiver sido gerado
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

// CANCELAR AGENDAMENTO (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID do agendamento é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.booking.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao deletar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}