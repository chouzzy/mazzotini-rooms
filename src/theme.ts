import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

// Criamos uma configuração customizada partindo do padrão do Chakra
const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // A Paleta Dourada da Mazzotini (Substituindo o Azul)
        brand: {
          50: { value: "#F9F6EE" },
          100: { value: "#F0EAD6" },
          200: { value: "#E6DBC0" },
          300: { value: "#DCD0AA" },
          400: { value: "#D2C594" },
          500: { value: "#d2be82" },
          600: { value: "#B8A76E" },
          700: { value: "#9E905A" },
          800: { value: "#847946" },
          900: { value: "#6A6232" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Substituímos a paleta global "blue" pela nossa "brand"
        blue: {
          50: { value: '{colors.brand.50}' },
          100: { value: '{colors.brand.100}' },
          200: { value: '{colors.brand.200}' },
          300: { value: '{colors.brand.300}' },
          400: { value: '{colors.brand.400}' },
          500: { value: '{colors.brand.500}' },
          600: { value: '{colors.brand.600}' },
          700: { value: '{colors.brand.700}' },
          800: { value: '{colors.brand.800}' },
          900: { value: '{colors.brand.900}' },
        },
        // Configuração semântica para forçar os fundos a serem escuros
        bg: {
          canvas: { value: '#171717' }, // Fundo principal super escuro (Slate 900)
          panel: { value: '#272727' },  // Fundo dos painéis e modais (Slate 800)
          subtle: { value: '#6A6232' }, // Fundo sutil (Slate 700)
        },
        fg: {
          DEFAULT: { value: '#f8fafc' }, // Texto principal branco/cinza claríssimo
          muted: { value: '#cbd5e1' },   // Texto secundário (Slate 300)
        },
        border: {
          DEFAULT: { value: '#334155' }, // Bordas escuras
          muted: { value: '#475569' },
        }
      },
    },
  },
  // Força o sistema a usar os tokens de cores escuras que definimos acima
  globalCss: {
    body: {
      bg: "bg.canvas",
      color: "fg.DEFAULT",
    }
  }
})

// Mesclamos a nossa configuração customizada com os componentes padrão do Chakra
export const system = createSystem(defaultConfig, customConfig)