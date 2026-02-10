import { prisma } from '@/lib/prisma';

// LISTAR SALAS (GET)
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return new Response(JSON.stringify(rooms), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}

// CRIAR SALA (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, capacity, description } = body;

    if (!name || !capacity) {
      return new Response(
        JSON.stringify({ error: 'Nome e Capacidade são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const room = await prisma.room.create({
      data: {
        name,
        capacity: Number(capacity),
        description,
        isActive: true,
      },
    });

    return new Response(JSON.stringify(room), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro ao criar sala' }), { status: 500 });
  }
}

// ATUALIZAR SALA (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, capacity, description, isActive } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID da sala é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verifica se a sala existe
    const existingRoom = await prisma.room.findUnique({ where: { id } });
    if (!existingRoom) {
      return new Response(JSON.stringify({ error: 'Sala não encontrada' }), { status: 404 });
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        name: name || undefined, // Só atualiza se vier valor
        capacity: capacity ? Number(capacity) : undefined,
        description: description || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return new Response(JSON.stringify(updatedRoom), { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    return new Response(JSON.stringify({ error: 'Erro ao atualizar sala' }), { status: 500 });
  }
}

// DELETAR SALA (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID é obrigatório' }), { status: 400 });
    }

    // PROTEÇÃO: Verificar se existem agendamentos para esta sala
    const bookingsCount = await prisma.booking.count({
      where: { roomId: id }
    });

    if (bookingsCount > 0) {
      return new Response(
        JSON.stringify({ error: 'Não é possível excluir uma sala que possui agendamentos. Tente inativá-la.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await prisma.room.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });

  } catch (error) {
    console.error('Erro ao deletar sala:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}