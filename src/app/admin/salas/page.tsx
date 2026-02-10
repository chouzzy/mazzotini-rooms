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
      console.log('📦 Salas carregadas:', data);
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
    setRoomToEdit(null);
    setIsAdminModalOpen(true);
  };

  // Abre modal em modo Edição
  const handleEdit = (room: Room) => {
    setRoomToEdit(room);
    setIsAdminModalOpen(true);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <Box minH="100vh" bg="bg.canvas">
      <Navbar />
      
      <Container maxW="6xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Gestão de Salas</Heading>
          
          <Stack direction="row" gap={2}>
            <Button variant="outline" size="sm" onClick={fetchRooms} disabled={loading}>
              <LuRefreshCw /> Atualizar
            </Button>
            
            <Button 
              colorPalette="blue" 
              size="sm" 
              disabled={connectionError} 
              onClick={handleCreate} // Usando o novo handler
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
                  <Table.ColumnHeader>Imagem</Table.ColumnHeader>
                  <Table.ColumnHeader>Nome</Table.ColumnHeader>
                  <Table.ColumnHeader>Capacidade</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rooms.map((room) => (
                  <Table.Row key={room.id}>
                    <Table.Cell>
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
                    <Table.Cell fontWeight="medium">{room.name}</Table.Cell>
                    <Table.Cell>{room.capacity} pessoas</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={room.isActive ? 'green' : 'red'}>
                        {room.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Stack direction="row" justify="flex-end" gap={1}>
                        {/* Botão de Editar */}
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="blue"
                          onClick={() => handleEdit(room)}
                          aria-label="Editar sala"
                        >
                          <LuPencil />
                        </IconButton>

                        {/* Botão de Excluir */}
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

        {/* Modal de Criação/Edição */}
        <AdminRoomModal 
          isOpen={isAdminModalOpen} 
          onClose={() => setIsAdminModalOpen(false)} 
          onSuccess={fetchRooms}
          roomToEdit={roomToEdit} // Passando a sala selecionada (ou null)
        />
      </Container>
    </Box>
  );
}