import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where: any = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }, 
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true, 
          isVip: true, // <-- ADICIONADO PARA LISTAGEM
        }
      })
    ]);

    return new Response(JSON.stringify({
      users, total, totalPages: Math.ceil(total / limit), currentPage: page
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, role, isVip } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID é obrigatório' }), { status: 400 });
    }

    // Prepara o objeto de atualização apenas com o que foi enviado
    const dataToUpdate: any = {};
    if (role !== undefined) dataToUpdate.role = role as Role;
    if (isVip !== undefined) dataToUpdate.isVip = isVip;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return new Response(JSON.stringify(updatedUser), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}