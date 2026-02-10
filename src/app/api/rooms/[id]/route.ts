import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params agora é uma Promise
) {
  try {
    // É obrigatório fazer o await do params antes de ler o ID
    const { id } = await params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return new Response(JSON.stringify({ error: 'Sala não encontrada' }), { status: 404 });
    }

    return new Response(JSON.stringify(room), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar sala:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}