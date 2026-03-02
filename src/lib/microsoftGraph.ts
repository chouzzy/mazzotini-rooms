// Interface para o retorno da reunião
export interface OnlineMeeting {
  id: string;
  joinWebUrl: string;
  subject: string;
}

// 1. Helper para obter o Token (Certifique-se que está com 'export')
export async function getMicrosoftToken(): Promise<string> {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Credenciais do Azure AD não configuradas.");
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha ao obter token da Microsoft: ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erro ao obter token:", error);
    throw error;
  }
}

// 2. Helper para Criar Reunião no Teams e Calendário
export async function createOnlineMeeting(
  subject: string, 
  startTime: Date, 
  endTime: Date, 
  attendeeEmail?: string | null // <-- Novo parâmetro!
): Promise<any> {
  try {
    const token = await getMicrosoftToken();

    const organizerId = process.env.TEAMS_ORGANIZER_ID; 
    
    if (!organizerId) {
        console.warn("TEAMS_ORGANIZER_ID não configurado. Pulando criação de reunião Teams.");
        return { id: "mock-id", joinWebUrl: "", subject }; 
    }

    const meetingEndpoint = `https://graph.microsoft.com/v1.0/users/${organizerId}/events`;

    const meetingData: any = {
      subject: subject,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "UTC"
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "UTC"
      },
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness"
    };

    // MAGIA AQUI: Adiciona o usuário que solicitou a reserva como "Convidado Obrigatório"
    if (attendeeEmail) {
      meetingData.attendees = [
        {
          emailAddress: { address: attendeeEmail },
          type: "required"
        }
      ];
    }

    const response = await fetch(meetingEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao criar reunião no Teams/Calendário: ${errorText}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      joinWebUrl: data.onlineMeeting?.joinUrl || "",
      subject: data.subject
    };

  } catch (error) {
    console.error("Erro no createOnlineMeeting:", error);
    throw error;
  }
}

// 3. Helper para Convidar Usuário Externo (Associado)
export async function inviteGuestUser(email: string, displayName: string, redirectUrl: string) {
  try {
    const token = await getMicrosoftToken();
    const endpoint = `https://graph.microsoft.com/v1.0/invitations`;

    const inviteData = {
      invitedUserEmailAddress: email,
      invitedUserDisplayName: displayName,
      inviteRedirectUrl: redirectUrl, // Para onde o usuário vai depois de aceitar (ex: nosso site)
      sendInvitationMessage: true, // A Microsoft manda o email bonitinho
      invitedUserMessageInfo: {
        customizedMessageBody: "Você foi convidado para acessar o Mazzotini Rooms. Clique no link para aceitar e acessar o sistema de agendamento de salas."
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inviteData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao convidar usuário via Graph: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no inviteGuestUser:", error);
    throw error;
  }
}