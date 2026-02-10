// Interface para o retorno da reunião
export interface OnlineMeeting {
  id: string;
  joinWebUrl: string;
  subject: string;
}

// 1. Helper para obter o Token (Client Credentials Flow)
async function getMicrosoftToken(): Promise<string> {
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
    console.error("Erro no getMicrosoftToken:", error);
    throw error;
  }
}

// 2. Helper para Criar Reunião no Teams
export async function createOnlineMeeting(subject: string, startTime: Date, endTime: Date): Promise<OnlineMeeting> {
  try {
    const token = await getMicrosoftToken();

    // O ID do usuário organizador deve estar no .env
    const organizerId = process.env.TEAMS_ORGANIZER_ID; 
    
    if (!organizerId) {
        console.warn("TEAMS_ORGANIZER_ID não configurado. Pulando criação de reunião Teams.");
        // Retorna um objeto "fake" para não quebrar o fluxo em desenvolvimento
        return { id: "mock-id", joinWebUrl: "", subject }; 
    }

    const meetingEndpoint = `https://graph.microsoft.com/v1.0/users/${organizerId}/onlineMeetings`;

    const meetingData = {
      startDateTime: startTime.toISOString(),
      endDateTime: endTime.toISOString(),
      subject: subject,
      isEntryExitAnnounced: true,
    };

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
      throw new Error(`Erro ao criar reunião no Teams: ${errorText}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      joinWebUrl: data.joinWebUrl,
      subject: data.subject
    };

  } catch (error) {
    console.error("Erro no createOnlineMeeting:", error);
    throw error;
  }
}