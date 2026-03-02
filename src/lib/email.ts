import { getMicrosoftToken } from './microsoftGraph';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

// Helper para formatar a data para o padrão Brasileiro
const formatarData = (data: Date | string) => {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
  });
};

export async function sendEmail({ to, subject, body }: EmailPayload): Promise<boolean> {
  if (!process.env.AZURE_AD_CLIENT_ID || !process.env.EMAIL_SENDER) {
    console.log(`📨 [MOCK EMAIL] Para: ${to} | Assunto: ${subject}`);
    return true;
  }

  try {
    const token = await getMicrosoftToken();
    const senderEmail = process.env.EMAIL_SENDER;
    const endpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;

    const emailData = {
      message: {
        subject: subject,
        body: { contentType: "HTML", content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: false,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) throw new Error(`Erro Microsoft Graph Mail: ${await response.text()}`);

    console.log(`✅ E-mail enviado com sucesso para ${to}`);
    return true;

  } catch (error) {
    console.error("❌ Falha ao enviar e-mail:", error);
    return false;
  }
}

export async function sendApprovalEmail(
  userEmail: string, bookingTitle: string, roomName: string, 
  startTime: Date | string, endTime: Date | string, meetingLink?: string | null
) {
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Mazzotini Rooms</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #16a34a; margin-top: 0;">✅ Reserva Confirmada</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Olá,</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">A sua solicitação de reserva de sala foi aprovada com sucesso. Verifique os detalhes abaixo:</p>
        
        <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Assunto:</strong> ${bookingTitle}</p>
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Espaço:</strong> ${roomName}</p>
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Início:</strong> ${formatarData(startTime)}</p>
          <p style="margin: 0; color: #1e293b; font-size: 15px;"><strong>Fim:</strong> ${formatarData(endTime)}</p>
        </div>

        ${meetingLink ? `
          <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
            <a href="${meetingLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Ingressar na Reunião (Teams)
            </a>
          </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
        Este é um e-mail automático. Por favor, não responda. <br>
        &copy; ${new Date().getFullYear()} Mazzotini Advogados
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject: `Reserva Confirmada: ${bookingTitle}`, body: htmlBody });
}

export async function sendRejectionEmail(
  userEmail: string, bookingTitle: string, roomName: string, 
  startTime: Date | string, endTime: Date | string
) {
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Mazzotini Rooms</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #dc2626; margin-top: 0;">❌ Reserva Não Aprovada</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Olá,</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Infelizmente, a sua solicitação de reserva não pôde ser aprovada neste momento ou o espaço foi reservado por outro colaborador.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Assunto:</strong> ${bookingTitle}</p>
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Espaço:</strong> ${roomName}</p>
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Data pretendida:</strong> ${formatarData(startTime)}</p>
        </div>

        <p style="color: #334155; font-size: 16px;">Por favor, acesse ao painel e verifique a disponibilidade de outros espaços.</p>
      </div>
      
      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
        Este é um e-mail automático. Por favor, não responda. <br>
        &copy; ${new Date().getFullYear()} Mazzotini Advogados
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject: `Status da Reserva: ${bookingTitle}`, body: htmlBody });
}

export async function sendCancellationEmail(
  userEmail: string, bookingTitle: string, roomName: string, 
  startTime: Date | string, endTime: Date | string
) {
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Mazzotini Rooms</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #64748b; margin-top: 0;">🗑️ Reserva Cancelada</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Olá,</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Confirmamos que a sua reserva foi cancelada com sucesso a seu pedido. A sala já se encontra libertada para outros colaboradores.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #94a3b8; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Assunto:</strong> ${bookingTitle}</p>
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Espaço:</strong> ${roomName}</p>
          <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 15px;"><strong>Início:</strong> ${formatarData(startTime)}</p>
          <p style="margin: 0; color: #1e293b; font-size: 15px;"><strong>Fim:</strong> ${formatarData(endTime)}</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
        Este é um e-mail automático. Por favor, não responda. <br>
        &copy; ${new Date().getFullYear()} Mazzotini Advogados
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject: `Reserva Cancelada: ${bookingTitle}`, body: htmlBody });
}

// -----------------------------------------------------
// NOVO: TEMPLATE DE CONVITE CUSTOMIZADO
// -----------------------------------------------------
export async function sendInviteEmail(userEmail: string, userName: string, redeemUrl: string) {
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Mazzotini Rooms</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #3b82f6; margin-top: 0;">👋 Bem-vindo(a) à Mazzotini Advogados!</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Olá ${userName},</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Você foi convidado(a) para acessar o nosso sistema exclusivo de agendamento de salas de reunião e espaços de trabalho corporativos.</p>
        
        <div style="text-align: center; margin-top: 32px; margin-bottom: 24px;">
          <a href="${redeemUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Aceitar Convite e Acessar
          </a>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 4px;">
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
            <strong>Como funciona?</strong> Ao clicar no botão acima, você será direcionado(a) ao ambiente seguro da Microsoft para confirmar seu acesso utilizando sua conta atual (este e-mail).
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
        Este é um e-mail automático enviado pela plataforma Mazzotini Rooms. <br>
        &copy; ${new Date().getFullYear()} Mazzotini Advogados
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject: "Convite: Acesso ao Sistema Mazzotini Rooms", body: htmlBody });
}