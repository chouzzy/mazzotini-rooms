// Vamos precisar importar a função de token. 
// Certifique-se de exportar 'getMicrosoftToken' no arquivo src/lib/microsoftGraph.ts se ainda não estiver exportada.
// Se não estiver exportada lá, adicione 'export' antes da função getMicrosoftToken naquele arquivo.
import { getMicrosoftToken } from './microsoftGraph';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: EmailPayload): Promise<boolean> {
  // Em desenvolvimento (sem chaves), mantemos o log para não travar
  if (!process.env.AZURE_AD_CLIENT_ID || !process.env.EMAIL_SENDER) {
    console.log(`📨 [MOCK EMAIL] Para: ${to} | Assunto: ${subject}`);
    return true;
  }

  try {
    const token = await getMicrosoftToken();
    
    // O e-mail que vai "assinar" o envio. Geralmente um 'nao-responda@empresa.com' ou o próprio admin.
    // Precisa ser um e-mail válido dentro do tenant da Microsoft deles.
    const senderEmail = process.env.EMAIL_SENDER;

    const endpoint = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;

    const emailData = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: false, // Não precisa salvar nos itens enviados da conta de serviço
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro Microsoft Graph Mail: ${errorText}`);
    }

    console.log(`✅ E-mail enviado com sucesso para ${to}`);
    return true;

  } catch (error) {
    console.error("❌ Falha ao enviar e-mail:", error);
    // Não queremos quebrar a aplicação se o e-mail falhar, apenas logar
    return false;
  }
}

export async function sendApprovalEmail(userEmail: string, bookingTitle: string, roomName: string) {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #2F855A;">✅ Sua reserva foi Confirmada!</h2>
      <p>Olá,</p>
      <p>Sua solicitação de reserva para <strong>${bookingTitle}</strong> na sala <strong>${roomName}</strong> foi aprovada.</p>
      <hr />
      <p style="font-size: 12px; color: #666;">Sistema de Salas Mazzotini</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Reserva Confirmada - Mazzotini Rooms',
    body: htmlBody
  });
}

export async function sendRejectionEmail(userEmail: string, bookingTitle: string) {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #C53030;">❌ Atualização sobre sua reserva</h2>
      <p>Olá,</p>
      <p>Infelizmente, sua reserva <strong>${bookingTitle}</strong> não pôde ser aprovada neste momento.</p>
      <p>Por favor, verifique outros horários disponíveis no calendário.</p>
      <hr />
      <p style="font-size: 12px; color: #666;">Sistema de Salas Mazzotini</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Status da Reserva - Mazzotini Rooms',
    body: htmlBody
  });
}