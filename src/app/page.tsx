import { Box, Flex } from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import RoomCarousel from '@/components/RoomCarousel';
import { Welcome } from '@/components/Welcome';

export default function Home() {
  return (
    <Flex 
      flexDir="column" 
      alignItems="center" 
      justifyContent="center" 
      gap={{ base: 10, md: 16 }} 
      px={{ base: 4, md: 8 }} // Padding lateral para o mobile respirar
      w="100%"
      maxW="8xl"
      mx="auto"
      color='fg.DEFAULT'
    >
      <Welcome />
      <RoomCarousel />
    </Flex>
  );
}