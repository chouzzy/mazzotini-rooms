import { createOnlineMeeting } from "@/lib/microsoftGraph";

// Mock das variáveis de ambiente necessárias
process.env.AZURE_AD_TENANT_ID = "fake-tenant-id";
process.env.AZURE_AD_CLIENT_ID = "fake-client-id";
process.env.AZURE_AD_CLIENT_SECRET = "fake-secret";
process.env.TEAMS_ORGANIZER_ID = "fake-organizer-id";

describe("Integração Microsoft Teams (Mock)", () => {
  // Salva o fetch original para restaurar depois
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Limpa mocks antes de cada teste
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("deve obter token e criar reunião, retornando o link do Teams", async () => {
    const mockToken = "fake-access-token-123";
    const mockMeetingLink = "https://teams.microsoft.com/l/meetup-join/19%3ameeting_Nz...";
    
    // Mock da sequência de chamadas do fetch
    (global.fetch as jest.Mock)
      // 1ª Chamada: Solicitação do Token (login.microsoftonline.com)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: mockToken }),
      })
      // 2ª Chamada: Criação da Reunião (graph.microsoft.com)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "meeting-id-123",
          joinWebUrl: mockMeetingLink,
          subject: "Reunião de Teste",
        }),
      });

    // Executa a função helper
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 3600000); // +1 hora
    const result = await createOnlineMeeting("Reunião de Teste", startTime, endTime);

    // Verificações
    expect(result).toBeDefined();
    expect(result.joinWebUrl).toBe(mockMeetingLink);
    
    // Verifica se o fetch foi chamado corretamente
    expect(global.fetch).toHaveBeenCalledTimes(2);
    
    // Verifica se o token foi usado na segunda chamada
    const secondCallHeaders = (global.fetch as jest.Mock).mock.calls[1][1].headers;
    expect(secondCallHeaders["Authorization"]).toBe(`Bearer ${mockToken}`);
  });

  it("deve lançar erro se a autenticação falhar", async () => {
    // Mock falha no token
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => "Invalid Client Secret",
    });

    await expect(createOnlineMeeting("Teste Falha", new Date(), new Date()))
      .rejects
      .toThrow("Falha ao obter token da Microsoft");
  });
});