import { Container, Box } from '@chakra-ui/react';
import RoomList from '@/components/RoomList';
import Navbar from '@/components/Navbar';
import { Welcome } from '@/components/Welcome';

export default function Home() {
  return (
    <Box minH="100vh" bg="bg.canvas">
      <Navbar />

      <Container maxW="8xl" py={8}>
        <Welcome />
        <RoomList />
      </Container>
    </Box>
  );
}