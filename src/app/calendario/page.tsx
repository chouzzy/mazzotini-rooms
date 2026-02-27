import { Container, Box, Heading } from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import RoomCalendar from '@/components/RoomCalendar';

export default function CalendarPage() {
  return (
    <>
      <Heading mb={6}>Calendário de Ocupação</Heading>
      <RoomCalendar />
    </>
  );
}