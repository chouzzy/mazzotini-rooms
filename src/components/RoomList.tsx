'use client';

import { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Button, 
  Table, 
  Badge, 
  IconButton, 
  Flex,
  Spinner,
  Center,
  Alert,
  Stack,
  Image,
  Text
} from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import AdminRoomModal from '@/components/AdminRoomModal';
import { LuPlus, LuTrash2, LuRefreshCw, LuPencil } from "react-icons/lu";
import { toaster } from '@/components/ui/toaster';

interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  isActive: boolean;
  imageUrl?: string;
  amenities?: string[];
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  
  // Controle do Modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    setConnectionError(false);
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error('Falha ao buscar salas');
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error(err);
      setConnectionError(true);
      toaster.create({
        title: 'Erro de Conexão',
        description: 'Não foi possível carregar as salas.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return;

    try {
      const res = await fetch(`/api/rooms?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao excluir');
      }
      
      toaster.create({ title: 'Sala excluída', type: 'success' });
      fetchRooms(); // Recarrega a lista
    } catch (error: any) {
      toaster.create({ 
        title: 'Erro', 
        description: error.message, 
        type: 'error' 
      });
    }
  };

  // Abre modal em modo Criação
  const handleCreate = () => {
    setRoomToEdit(null); // MUITO IMPORTANTE: Passa null para criar nova
    setIsAdminModalOpen(true);
  };

  // Abre modal em modo Edição
  const handleEdit = (room: Room) => {
    setRoomToEdit(room); // Passa a sala selecionada
    setIsAdminModalOpen(true);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <Box minH="100vh" bg="bg.canvas">
      {/* O Navbar agora é global, cuidando do seu próprio menu no celular */}
      <Navbar />
      
      <Container maxW="6xl" py={8}>
        {/* RESPONSIVIDADE APLICADA AQUI: Quebra em coluna no celular, botões esticam */}
        <Flex 
          justify="space-between" 
          align={{ base: 'start', sm: 'center' }} 
          mb={6}
          flexDir={{ base: 'column', sm: 'row' }}
          gap={4}
        >
          <Heading size={{ base: 'md', md: 'lg' }}>Gestão de Salas</Heading>
          
          <Stack direction="row" gap={2} w={{ base: 'full', sm: 'auto' }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRooms} 
              disabled={loading}
              flex={{ base: 1, sm: 'auto' }}
            >
              <LuRefreshCw /> Atualizar
            </Button>
            
            <Button 
              colorPalette="blue" 
              size="sm" 
              disabled={connectionError} 
              onClick={handleCreate}
              flex={{ base: 1, sm: 'auto' }}
            >
              <LuPlus /> Nova Sala
            </Button>
          </Stack>
        </Flex>

        {connectionError && (
          <Alert.Root status="error" mb={6}>
            <Alert.Indicator />
            <Alert.Title>Erro de conexão com o servidor.</Alert.Title>
          </Alert.Root>
        )}

        {loading ? (
          <Center py={20}>
            <Spinner size="xl" color="blue.500" />
          </Center>
        ) : (
          <Box overflowX="auto" borderWidth="1px" borderRadius="lg" bg="white">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader whiteSpace="nowrap">Imagem</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap">Nome</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap">Capacidade</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap">Status</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap" textAlign="right">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rooms.map((room) => (
                  <Table.Row key={room.id}>
                    <Table.Cell whiteSpace="nowrap">
                      {room.imageUrl ? (
                        <Image 
                          src={room.imageUrl} 
                          alt={room.name} 
                          boxSize="40px" 
                          objectFit="cover" 
                          borderRadius="md"
                        />
                      ) : (
                        <Box boxSize="40px" bg="gray.100" borderRadius="md" title="Sem imagem" />
                      )}
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap" fontWeight="medium">
                      <Text>{room.name}</Text>
                      {/* Opcional: Mostrar quantas amenidades tem na lista */}
                      <Text fontSize="xs" color="gray.500">
                        {room.amenities?.length ? `${room.amenities.length} comodidades` : 'Sem comodidades'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap">{room.capacity} pessoas</Table.Cell>
                    <Table.Cell whiteSpace="nowrap">
                      <Badge colorPalette={room.isActive ? 'green' : 'red'}>
                        {room.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap" textAlign="right">
                      <Stack direction="row" justify="flex-end" gap={1}>
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="blue"
                          onClick={() => handleEdit(room)}
                          aria-label="Editar sala"
                        >
                          <LuPencil />
                        </IconButton>

                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="red"
                          onClick={() => handleDelete(room.id)}
                          aria-label="Excluir sala"
                        >
                          <LuTrash2 />
                        </IconButton>
                      </Stack>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {rooms.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={5} textAlign="center" color="fg.muted" py={8}>
                      Nenhuma sala cadastrada.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {/* Modal de Criação/Edição COM A PROP CORRETA */}
        <AdminRoomModal 
          isOpen={isAdminModalOpen} 
          onClose={() => setIsAdminModalOpen(false)} 
          onSuccess={fetchRooms}
          roomToEdit={roomToEdit} 
        />
      </Container>
    </Box>
  );
}