// GUARD: impede testes de rodarem contra banco de produção
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.includes('mongodb+srv') || dbUrl.includes('atlas')) {
  throw new Error(
    '\n\n🚨 PERIGO: DATABASE_URL aponta para o MongoDB Atlas (produção).\n' +
    'Crie um arquivo .env.test com uma DATABASE_URL de banco de testes.\n' +
    'Os testes de integração deletam dados — NUNCA rode contra produção.\n'
  );
}

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