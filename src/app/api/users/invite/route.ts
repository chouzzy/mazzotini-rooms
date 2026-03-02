import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMicrosoftToken } from '@/lib/microsoftGraph';
import { sendInviteEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
    }

    const { email, name } = await request.json();

    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Email e Nome são obrigatórios' }), { status: 400 });
    }

    // 1. Obter Token da Microsoft Graph
    let token;
    try {
      token = await getMicrosoftToken();
    } catch (e) {
      console.error("Erro token:", e);
      return new Response(JSON.stringify({ error: 'Erro de autenticação com o Microsoft 365' }), { status: 500 });
    }

    // A URL para onde o usuário será mandado APÓS aceitar o convite
    const redirectUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // 2. Enviar Convite via Graph API
    // MAGIC HAPPENS HERE: sendInvitationMessage = false impede o e-mail feio!
    const inviteData = {
      invitedUserEmailAddress: email,
      invitedUserDisplayName: name,
      inviteRedirectUrl: redirectUrl,
      sendInvitationMessage: false, 
    };

    const inviteResponse = await fetch("https://graph.microsoft.com/v1.0/invitations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(inviteData)
    });

    const inviteResult = await inviteResponse.json();

    if (!inviteResponse.ok) {
      console.error("Erro Graph API Invite:", inviteResult);
      return new Response(JSON.stringify({ 
        error: inviteResult.error?.message || 'Falha ao convidar na Microsoft' 
      }), { status: inviteResponse.status });
    }

    // 3. Pegar o Link Mágico (Redeem URL) da Microsoft
    const redeemUrl = inviteResult.inviteRedeemUrl;

    // 4. Disparar o NOSSO e-mail customizado HTML
    if (redeemUrl) {
      await sendInviteEmail(email, name, redeemUrl);
    }

    // 5. Cadastrar o usuário preventivamente no nosso banco como USER
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

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Convite premium enviado com sucesso!',
      user: inviteResult 
    }), { status: 201 });

  } catch (error: any) {
    console.error("ERRO DETALHADO NO CONVITE:", error);
    return new Response(JSON.stringify({ error: 'Erro interno no servidor' }), { status: 500 });
  }
}