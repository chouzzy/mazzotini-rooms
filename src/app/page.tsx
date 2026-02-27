import { Box, Flex } from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import RoomCarousel from '@/components/RoomCarousel';
import { Welcome } from '@/components/Welcome';
import HowItWorks from '@/components/HowItWorks';

export default function Home() {
  return (
      
        <Flex flexDir={'column'} alignItems={'center'} justifyContent={'center'} gap={16}>
          <Welcome />
          <RoomCarousel />
        </Flex>
  );
}