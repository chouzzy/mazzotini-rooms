import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, capacity, description } = body;

    // Validação básica
    if (!name || !capacity) {
      return new Response(
        JSON.stringify({ error: 'Nome e Capacidade são obrigatórios' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Criação no banco de dados
    const room = await prisma.room.create({
      data: {
        name,
        capacity: Number(capacity),
        description,
        isActive: true,
      },
    });

    // Retornamos usando Response padrão para evitar problemas de stream no Jest
    return new Response(JSON.stringify(room), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na API de Salas:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao criar sala' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}