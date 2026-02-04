// src/__tests__/Home.test.tsx
import Home from '@/app/page'
import { Providers } from '@/app/providers'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('Página Inicial', () => {
  it('deve renderizar o título corretamente', () => {
    // 1. RENDERIZAR: A gente "monta" a tela no ambiente de teste
    render(
      <Providers>
        <Home />
      </Providers>
    )

    // 2. BUSCAR: A gente procura pelo texto na tela
    const heading = screen.getByRole('heading', {
      name: /bem-vindo ao mazzotini rooms/i,
    })

    // 3. AFIRMAR: A gente garante que ele está lá
    expect(heading).toBeInTheDocument()
  })

  it('deve ter um botão de entrar', () => {
    render(
      <Providers>
        <Home />
      </Providers>
    )

    const button = screen.getByRole('button', { name: /entrar/i })
    expect(button).toBeInTheDocument()
  })
})
