import { Container, Box } from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import MyBookings from '@/components/MyBookings';

export default function MyBookingsPage() {
  return (
    <Box minH="100vh" bg="bg.canvas">
      <Navbar />
      
      <Container maxW="6xl" py={8}>
        <MyBookings />
      </Container>
    </Box>
  );
}