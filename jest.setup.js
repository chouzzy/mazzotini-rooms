// jest.setup.js
import '@testing-library/jest-dom'

// Polyfill para structuredClone (Necessário para Chakra UI v3 em testes)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => {
    if (val === undefined) return undefined;
    return JSON.parse(JSON.stringify(val));
  }
}

// Mock do matchMedia (Necessário para o Chakra UI não quebrar nos testes)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
