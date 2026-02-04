import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#F9F6EE" },
          100: { value: "#F0EAD6" },
          200: { value: "#E6DBC0" },
          300: { value: "#DCD0AA" },
          400: { value: "#D2C594" },
          500: { value: "#d2be82" }, // Cor Principal
          600: { value: "#B8A76E" },
          700: { value: "#9E905A" },
          800: { value: "#847946" },
          900: { value: "#6A6232" },
        },
        // Azul Marinho Complementar (Accent)
        accent: {
          50: { value: "#E3F2FD" },
          100: { value: "#BBDEFB" },
          200: { value: "#90CAF9" },
          300: { value: "#64B5F6" },
          400: { value: "#42A5F5" },
          500: { value: "#0C356A" }, // Azul Profundo Principal
          600: { value: "#0A2C58" },
          700: { value: "#082346" },
          800: { value: "#05152A" },
          900: { value: "#030A14" },
        }
      },
    },
    semanticTokens: {
      colors: {
        // Aqui definimos os "papéis" das cores
        // Ex: Quando eu usar "primary.solid", ele usa o Brand 500
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "{colors.brand.100}" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.200}" },
          subtle: { value: "{colors.brand.50}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.500}" },
        },
        accent: {
          solid: { value: "{colors.accent.500}" },
          contrast: { value: "#ffffff" }, // Texto branco no fundo azul
          fg: { value: "{colors.accent.700}" },
          muted: { value: "{colors.accent.200}" },
          subtle: { value: "{colors.accent.50}" },
          emphasized: { value: "{colors.accent.300}" },
          focusRing: { value: "{colors.accent.500}" },
        }
      },
    },
  },
})

export const system = createSystem(defaultConfig, customConfig)