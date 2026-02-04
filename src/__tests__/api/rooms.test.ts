import { POST } from '@/app/api/rooms/route';
import { prisma } from '@/lib/prisma';

// Mock do Prisma para evitar chamadas reais ao banco durante testes unitários
// Se você estiver usando um banco de memória (como configurado anteriormente), 
// este mock pode ser removido, mas é boa prática isolar se for teste unitário puro.
// Como seus logs mostraram queries reais, assumo que você quer teste de integração.
// Vou manter sem o mock do prisma aqui para usar o setup que você já tem (banco em memória).

describe('API de Salas (POST /api/rooms)', () => {
  // Limpar banco antes de cada teste se necessário
  beforeEach(async () => {
    // A ordem importa: primeiro deletamos os dependentes (Booking), depois as salas (Room)
    await prisma.booking.deleteMany();
    await prisma.room.deleteMany();
  });

  it('deve criar uma sala com sucesso', async () => {
    const body = {
      name: 'Sala de Teste',
      capacity: 10,
      description: 'Sala criada pelo teste automatizado'
    };

    const request = new Request('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    
    // Verificações
    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe(body.name);
    expect(data.capacity).toBe(body.capacity);
  });

  it('deve retornar erro 400 se faltar nome', async () => {
    const body = {
      capacity: 5
      // Faltando 'name'
    };

    const request = new Request('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    // Verificações
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Nome e Capacidade são obrigatórios');
  });
});