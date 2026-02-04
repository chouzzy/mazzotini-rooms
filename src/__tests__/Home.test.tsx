import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import '@testing-library/jest-dom'
// ESTRATÉGIA: Mock do Chakra UI
// Em vez de carregar a engine de estilos complexa (que causa os erros),
// transformamos os componentes visuais em HTML simples.
// O teste foca no CONTEÚDO, não na biblioteca.
jest.mock('@chakra-ui/react', () => {
  return {
    Box: ({ children, ...props }: any) => <div data-testid="box" {...props}>{children}</div>,
    Heading: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    Text: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    // Mock do Provider para ele não fazer nada além de renderizar os filhos
    ChakraProvider: ({ children }: any) => <>{children}</>,
  };
});

// Mock do next/navigation (necessário pois botões podem usar roteamento)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

describe('Página Inicial', () => {
  it('deve renderizar o título corretamente', () => {
    // Renderizamos direto, sem Providers complexos
    render(<Home />);

    // Como mockamos o Heading para ser um <h1>, o teste funciona nativamente
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Mazzotini Rooms/i);
  });

  it('deve ter um botão de entrar', () => {
    render(<Home />);

    const button = screen.getByRole('button', { name: /entrar/i });
    expect(button).toBeInTheDocument();
  });
});