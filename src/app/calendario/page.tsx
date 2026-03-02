import { Flex, Heading } from '@chakra-ui/react';
import RoomCalendar from '@/components/RoomCalendar';

export default function CalendarPage() {
  return (
    <Flex 
      flexDir="column" 
      w="100%" 
      maxW="8xl" 
      mx="auto" 
      px={{ base: 4, md: 8 }} 
      py={{ base: 6, md: 8 }}
    >
      <Heading mb={6} size={{ base: 'md', md: 'lg' }}>
        Calendário de Ocupação
      </Heading>
      <RoomCalendar />
    </Flex>
  );
}