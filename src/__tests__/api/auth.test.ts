import { POST } from '@/app/api/auth/identify/route';
import { prisma } from '@/lib/prisma';

describe('API de Identificação (POST /api/auth/identify)', () => {
  
  beforeEach(async () => {
    // Limpeza usando transaction para segurança em testes paralelos
    await prisma.$transaction([
      prisma.booking.deleteMany(),
      prisma.room.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  });

  it('deve criar um novo usuário se o email não existir', async () => {
    const body = {
      email: 'novo@teste.com',
      name: 'Usuário Novo'
    };

    const request = new Request('http://localhost:3000/api/auth/identify', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data.email).toBe(body.email);
    expect(data.name).toBe(body.name);

    // Verifica se realmente salvou no banco
    const userDb = await prisma.user.findUnique({ where: { email: body.email } });
    expect(userDb).toBeTruthy();
  });

  it('deve retornar o usuário existente se o email já estiver cadastrado', async () => {
    // 1. Criar usuário manualmente
    const existingUser = await prisma.user.create({
      data: {
        email: 'antigo@teste.com',
        name: 'Usuário Antigo'
      }
    });

    // 2. Tentar identificar com o mesmo email
    const body = {
      email: 'antigo@teste.com',
      name: 'Outro Nome' // Mesmo mudando o nome, deve retornar o registro original
    };

    const request = new Request('http://localhost:3000/api/auth/identify', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(existingUser.id); // Deve ser o MESMO ID
    expect(data.email).toBe(existingUser.email);
  });

  it('deve exigir email', async () => {
    const body = { name: 'Sem Email' };
    const request = new Request('http://localhost:3000/api/auth/identify', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('deve exigir nome se for um novo cadastro', async () => {
    // Email novo, mas sem nome
    const body = { email: 'incompleto@teste.com' };
    const request = new Request('http://localhost:3000/api/auth/identify', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/nome é obrigatório/i);
  });
});