import { Container, Box, Heading } from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import RoomCalendar from '@/components/RoomCalendar';

export default function CalendarPage() {
  return (
    <Box minH="100vh" bg="bg.canvas">
      <Navbar />
      
      <Container maxW="6xl" py={8}>
        <Heading mb={6}>Calendário de Ocupação</Heading>
        <RoomCalendar />
      </Container>
    </Box>
  );
}