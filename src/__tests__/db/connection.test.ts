import { prisma } from '@/lib/prisma';

describe('Infraestrutura de Dados', () => {
  it('deve conectar ao banco de dados com sucesso', async () => {
    // Tenta executar uma operação simples de leitura.
    // Usamos count() pois funciona tanto em SQL quanto em MongoDB e serve como um "ping".
    // Se o banco estiver offline, isso vai lançar um erro.
    const result = await prisma.user.count();
    
    expect(typeof result).toBe('number');
    // Apenas garantimos que não deu erro de conexão
  });

  // Opcional: Teste de escrita/leitura rápida
  it('deve conseguir escrever e ler um usuário de teste', async () => {
    const email = `connection-test-${Date.now()}@test.com`;
    
    const user = await prisma.user.create({
      data: {
        name: 'Connection Check',
        email: email,
      },
    });

    const found = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(found).not.toBeNull();
    expect(found?.email).toBe(email);

    // Limpeza
    await prisma.user.delete({ where: { id: user.id } });
  });
});