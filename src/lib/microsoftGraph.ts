interface OnlineMeeting {
  id: string;
  joinWebUrl: string;
  subject: string;
}

// 1. Helper para obter o token de aplicação (App-Only) do Microsoft Graph
export async function getMicrosoftToken(): Promise<string> {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Credenciais do Azure AD não configuradas no .env");
  }

  // Endpoint de autenticação Client Credentials (S2S - Server to Server)
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("client_secret", clientSecret);
  params.append("grant_type", "client_credentials");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao obter token do Microsoft Graph: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// 2. Helper para Criar Reunião no Teams e Calendário
export async function createOnlineMeeting(
  subject: string, 
  startTime: Date, 
  endTime: Date, 
  attendeeEmail?: string | null,
  guests?: { email: string; name?: string }[]
): Promise<OnlineMeeting> {
  try {
    const token = await getMicrosoftToken();

    // O ID do utilizador organizador (conta de serviço) deve estar no .env
    const organizerId = process.env.TEAMS_ORGANIZER_ID; 
    
    if (!organizerId) {
        console.warn("TEAMS_ORGANIZER_ID não configurado. Saltando a criação de reunião no Teams.");
        return { id: "mock-id", joinWebUrl: "", subject }; 
    }

    // Usamos o endpoint /events para gravar na agenda (Outlook) da conta de serviço
    const meetingEndpoint = `https://graph.microsoft.com/v1.0/users/${organizerId}/events`;

    const meetingData: any = {
      subject: subject,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "America/Sao_Paulo" // <-- MELHORIA: Forçar Fuso Horário Local
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "America/Sao_Paulo"
      },
      // 📍 O TOQUE DE MESTRE: Endereço Físico do Escritório
      location: {
        displayName: "Mazzotini Advogados Associados",
        locationType: "default",
        address: {
          street: "Av. Dr. Cardoso de Melo, 878 - 14º Andar - Vila Olímpia, São Paulo - SP", // Substitua pelo endereço real
          city: "São Paulo",
          state: "SP",
          countryOrRegion: "Brasil",
          postalCode: "04548-003"
        }
      },
      // Estas duas flags dizem à Microsoft para gerar um link do Teams para este evento
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness"
    };

    // MAGIA: Lista de Participantes (Attendees)
    const attendeesList = [];

    // Adiciona o utilizador interno que solicitou
    if (attendeeEmail) {
      attendeesList.push({
        emailAddress: { address: attendeeEmail },
        type: "required"
      });
    }

    // Adiciona os convidados externos
    // Isso fará a Microsoft enviar o convite de calendário oficial (.ics) com botões Aceitar/Recusar
    if (guests && guests.length > 0) {
      for (const guest of guests) {
        if (guest.email) {
          attendeesList.push({
            emailAddress: { 
              address: guest.email,
              name: guest.name || ''
            },
            type: "required"
          });
        }
      }
    }

    // Se houver participantes, injeta no payload
    if (attendeesList.length > 0) {
      meetingData.attendees = attendeesList;
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
      // No endpoint de eventos, o link do Teams vem dentro do objeto onlineMeeting
      joinWebUrl: data.onlineMeeting?.joinUrl || "",
      subject: data.subject
    };

  } catch (error) {
    console.error("Erro no createOnlineMeeting:", error);
    throw error;
  }
}