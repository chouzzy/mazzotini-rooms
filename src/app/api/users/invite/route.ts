import { inviteGuestUser } from '@/lib/microsoftGraph';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'E-mail e Nome são obrigatórios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // A URL para onde a Microsoft deve mandar o usuário após ele aceitar o convite
    const redirectUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000/login';

    // Dispara o convite na Microsoft
    const msResponse = await inviteGuestUser(email, name, redirectUrl);

    // Opcional: Já cria um "placeholder" (rascunho) do usuário no nosso banco
    // Assim, quando ele logar pela primeira vez, ele já tem a Role de 'USER' preparada e aparece na lista
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email,
          name,
          role: 'USER',
        }
      });
    }

    return new Response(JSON.stringify({ success: true, msResponse }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro na API de convite:', error);
    return new Response(
      JSON.stringify({ error: 'Falha ao processar o convite no Azure AD.' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}