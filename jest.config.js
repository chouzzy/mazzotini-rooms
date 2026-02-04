const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Fornece o caminho para o seu app Next.js
  dir: './',
})

// Configurações personalizadas do Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)