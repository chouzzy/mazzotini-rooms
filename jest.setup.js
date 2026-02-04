import '@testing-library/jest-dom'
import 'whatwg-fetch' 

// Mock do TextEncoder/TextDecoder (Essencial para Next.js App Router em testes)
import { TextEncoder, TextDecoder } from 'util'
Object.assign(global, { TextEncoder, TextDecoder })

// O polyfill para Response.json() foi removido pois estava causando conflito.
// 'whatwg-fetch' já fornece um polyfill adequado para o objeto Response e seus métodos.

// Polyfill para structuredClone (Necessário para Chakra UI v3)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => {
    if (val === undefined) return undefined;
    return JSON.parse(JSON.stringify(val));
  }
}

// Mock do matchMedia (Necessário para Chakra UI Responsivo)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})