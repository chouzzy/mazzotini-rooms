import { Container, Box, Heading, Text, Flex } from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import RoomList from '@/components/RoomList';
import HowItWorks from '@/components/HowItWorks';

export default function SalasPage() {
  return (
    <Flex flexDir={'column'} maxW="8xl" >


      <Box>
        <Heading size="xl" mb={2}>Todas as Salas</Heading>
        <Text color="fg.muted">Explore todos os nossos espaços disponíveis para reserva.</Text>
      </Box>

      {/* Aqui reaproveitamos o seu componente original intocado! */}
      <RoomList />
    </Flex>
  );
}