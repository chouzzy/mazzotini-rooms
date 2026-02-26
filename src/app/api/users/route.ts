import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// LISTAR TODOS OS USUÁRIOS (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Filtro flexível para nome OU email (Case Insensitive)
    const where: any = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Roda a contagem total e a busca paginada em paralelo para mais velocidade
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }, // Ordenando por nome já que createdAt não existe mais
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true, 
        }
      })
    ]);

    return new Response(JSON.stringify({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}

// ATUALIZAR CARGO (ROLE) DO USUÁRIO (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, role } = body;

    // Validação de segurança básica
    if (!id || !['USER', 'ADMIN'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'ID e Role válida são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
    });

    return new Response(JSON.stringify(updatedUser), { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}