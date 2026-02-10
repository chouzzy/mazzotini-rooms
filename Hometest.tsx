// import { render, screen, waitFor } from '@testing-library/react';
// import '@testing-library/jest-dom'
// import RoomList from '@/components/RoomList';

// // Mock do Chakra UI (Estratégia Simplificada)
// // Isso evita os erros de Context e matchMedia
// jest.mock('@chakra-ui/react', () => {
//   return {
//     Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
//     SimpleGrid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
//     Heading: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
//     Text: ({ children, ...props }: any) => <p {...props}>{children}</p>,
//     Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
//     Spinner: () => <div data-testid="spinner">Carregando...</div>,
//     Alert: ({ children }: any) => <div role="alert">{children}</div>,
//     AlertIcon: () => <span>!</span>,
//     Card: ({ children, ...props }: any) => <div data-testid="room-card" {...props}>{children}</div>,
//     CardHeader: ({ children }: any) => <div>{children}</div>,
//     CardBody: ({ children }: any) => <div>{children}</div>,
//     Stack: ({ children }: any) => <div>{children}</div>,
//     StackDivider: () => <hr />,
//   };
// });

// describe('Componente RoomList', () => {
//   // Mock Global do fetch
//   global.fetch = jest.fn();

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('deve mostrar spinner de carregamento inicialmente', async () => {
//     // Simula uma promessa que nunca resolve imediatamente para podermos ver o loading
//     (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

//     render(<RoomList />);
//     expect(screen.getByTestId('spinner')).toBeInTheDocument();
//   });

//   it('deve renderizar a lista de salas corretamente', async () => {
//     // Dados falsos que a API retornaria
//     const mockRooms = [
//       { id: '1', name: 'Sala Alpha', capacity: 10, description: 'Desc A', isActive: true },
//       { id: '2', name: 'Sala Beta', capacity: 5, description: 'Desc B', isActive: true },
//     ];

//     // Configura o fetch para retornar sucesso com nossos dados
//     (global.fetch as jest.Mock).mockResolvedValueOnce({
//       ok: true,
//       json: async () => mockRooms,
//     });

//     render(<RoomList />);

//     // Aguarda o elemento sair do estado de loading e aparecer na tela
//     await waitFor(() => {
//       expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
//     });

//     // Verifica se os nomes das salas estão na tela
//     expect(screen.getByText('Sala Alpha')).toBeInTheDocument();
//     expect(screen.getByText('Sala Beta')).toBeInTheDocument();
//     expect(screen.getByText('10 Pessoas')).toBeInTheDocument();
//   });

//   it('deve exibir mensagem de erro se a API falhar', async () => {
//     // Configura o fetch para falhar
//     (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Erro de conexão'));

//     render(<RoomList />);

//     await waitFor(() => {
//       expect(screen.getByRole('alert')).toBeInTheDocument();
//     });

//     expect(screen.getByText(/Erro ao carregar as salas/i)).toBeInTheDocument();
//   });

//   it('deve exibir mensagem de "Nenhuma sala" se a lista vier vazia', async () => {
//     (global.fetch as jest.Mock).mockResolvedValueOnce({
//       ok: true,
//       json: async () => [],
//     });

//     render(<RoomList />);

//     await waitFor(() => {
//       expect(screen.getByText(/Nenhuma sala encontrada/i)).toBeInTheDocument();
//     });
//   });
// });