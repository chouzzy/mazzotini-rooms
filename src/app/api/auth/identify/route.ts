import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Tenta encontrar o usuário pelo email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Se não encontrar, cria um novo
    if (!user) {
      if (!name) {
        return new Response(
          JSON.stringify({ error: 'Nome é obrigatório para novos cadastros' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      user = await prisma.user.create({
        data: {
          email,
          name,
        },
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200, // OK
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na identificação:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno na autenticação' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}