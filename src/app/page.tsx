// src/app/page.tsx
import { Box, Heading, Text, Button } from '@chakra-ui/react'

export default function Home() {
  return (
    <Box p={5}>
      <Heading>Bem-vindo ao Mazzotini Rooms</Heading>
      <Text mt={4}>Sistema de Agendamento</Text>
      <Button colorPallete="blue" variant='solid' mt={4}>Entrar</Button>
    </Box>
  )
}
