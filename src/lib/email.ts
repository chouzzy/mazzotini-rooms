interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

/**
 * Função responsável por disparar e-mails transacionais.
 * Em produção, substituiríamos os console.log por uma chamada ao Resend ou NodeMailer.
 */
export async function sendEmail({ to, subject, body }: EmailPayload): Promise<boolean> {
  console.log(`📨 [MOCK EMAIL SERVICE] Enviando para: ${to}`);
  console.log(`   Assunto: ${subject}`);
  console.log(`   Corpo: ${body}`);
  
  // Simula um delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  return true;
}

export async function sendApprovalEmail(userEmail: string, bookingTitle: string, roomName: string) {
  return sendEmail({
    to: userEmail,
    subject: '✅ Sua reserva foi Confirmada!',
    body: `Olá! Sua reserva "${bookingTitle}" na sala "${roomName}" foi confirmada com sucesso.`
  });
}

export async function sendRejectionEmail(userEmail: string, bookingTitle: string) {
  return sendEmail({
    to: userEmail,
    subject: '❌ Atualização sobre sua reserva',
    body: `Olá. Infelizmente sua reserva "${bookingTitle}" não pôde ser aprovada neste momento.`
  });
}