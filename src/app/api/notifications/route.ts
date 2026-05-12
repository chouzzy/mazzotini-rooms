import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    const notifications = await prisma.notification.findMany({
      where: isAdmin
        ? { forAdmin: true }
        : { forAdmin: false, userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return new Response(JSON.stringify(notifications), { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
    }

    const body = await request.json();
    const isAdmin = session.user.role === 'ADMIN';

    if (body.markAll) {
      await prisma.notification.updateMany({
        where: isAdmin
          ? { forAdmin: true, read: false }
          : { forAdmin: false, userId: session.user.id, read: false },
        data: { read: true },
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { read: true },
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Parâmetro inválido' }), { status: 400 });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 });
  }
}
