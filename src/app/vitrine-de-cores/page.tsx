import { Box, Heading, Text, Button, Stack, Container, Grid, Badge } from '@chakra-ui/react'

export default function Home() {
  return (
    <Container maxW="container.lg" py={10}>
      <Stack gap={8}>
        <Box textAlign="center" py={10} bg="accent.solid" color="white" borderRadius="md">
          <Heading size="3xl">Mazzotini Rooms</Heading>
          <Text fontSize="xl" mt={2} opacity={0.9}>Identidade Visual do Sistema</Text>
        </Box>

        {/* Seção da Marca Principal (Dourado) */}
        <Box>
          <Heading size="lg" mb={4}>Cores da Marca (Gold)</Heading>
          <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }} gap={4}>
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((tone) => (
              <Box key={tone} p={4} bg={`brand.${tone}`} borderRadius="md" boxShadow="sm">
                <Text fontWeight="bold" color={tone > 500 ? "white" : "black"}>Brand {tone}</Text>
              </Box>
            ))}
          </Grid>
        </Box>

        {/* Seção da Cor Complementar (Azul) */}
        <Box>
          <Heading size="lg" mb={4}>Cor Complementar (Navy)</Heading>
          <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }} gap={4}>
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((tone) => (
              <Box key={tone} p={4} bg={`accent.${tone}`} borderRadius="md" boxShadow="sm">
                <Text fontWeight="bold" color={tone > 400 ? "white" : "black"}>Accent {tone}</Text>
              </Box>
            ))}
          </Grid>
        </Box>

        {/* Teste de Componentes */}
        <Box>
          <Heading size="lg" mb={4}>Teste de Componentes</Heading>
          <Stack direction="row" gap={4} wrap="wrap">
            {/* Botões usando a paleta Brand */}
            <Button colorPalette="brand" variant="solid">Botão Principal</Button>
            <Button colorPalette="brand" variant="outline">Botão Outline</Button>
            <Button colorPalette="brand" variant="ghost">Botão Ghost</Button>
            
            {/* Botões usando a paleta Accent */}
            <Button colorPalette="accent" variant="solid">Ação Secundária</Button>
            <Button colorPalette="accent" variant="surface">Surface Accent</Button>
          </Stack>
          
          <Stack direction="row" mt={4} gap={4}>
             <Badge colorPalette="brand" size="lg">Status Pendente</Badge>
             <Badge colorPalette="accent" size="lg">Status Confirmado</Badge>
             <Badge colorPalette="red" size="lg">Cancelado</Badge>
          </Stack>
        </Box>
      </Stack>
    </Container>
  )
}