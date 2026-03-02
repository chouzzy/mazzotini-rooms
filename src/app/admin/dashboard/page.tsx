'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Heading, Table, Badge, Button, Flex, 
  Spinner, Center, Text, Stack, SimpleGrid, Card
} from '@chakra-ui/react';
import { LuCheck, LuX, LuClock, LuCalendarCheck, LuBan, LuTrash2 } from "react-icons/lu";

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  room: {
    name: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // NOVO: Estado para controlar qual "Aba/Cartão" está selecionado
  const [activeTab, setActiveTab] = useState<'PENDING' | 'CONFIRMED' | 'REJECTED'>('PENDING');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings?all=true');
      if (!res.ok) throw new Error('Falha ao carregar reservas');
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'CONFIRMED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/bookings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Falha na atualização');

      // Atualiza o estado localmente
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      
    } catch (error) {
      console.error("Erro ao atualizar o estado:", error);
      alert("Ocorreu um erro ao atualizar a reserva."); 
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelApproved = async (id: string) => {
    if(!confirm("Deseja realmente cancelar esta reserva já aprovada? O usuário será notificado e a sala será liberada.")) return;
    handleUpdateStatus(id, 'REJECTED');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Filtros
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const rejectedBookings = bookings.filter(b => b.status === 'REJECTED');

  // Define qual lista será renderizada com base na aba ativa
  const currentList = activeTab === 'PENDING' 
    ? pendingBookings 
    : activeTab === 'CONFIRMED' 
    ? confirmedBookings 
    : rejectedBookings;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg" color="gray.800">Visão Geral & Aprovações</Heading>
      </Flex>

      {/* Cartões Interativos (Funcionam como Tabs) */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
        {/* TAB: PENDENTES */}
        <Card.Root 
          cursor="pointer"
          onClick={() => setActiveTab('PENDING')}
          borderWidth="2px"
          borderColor={activeTab === 'PENDING' ? 'yellow.400' : 'yellow.100'}
          bg={activeTab === 'PENDING' ? 'yellow.50' : 'white'}
          transition="all 0.2s"
          _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
        >
          <Card.Body>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="fg.muted" fontSize="sm" fontWeight="medium">Aguardam Aprovação</Text>
                <Heading size="2xl" color="yellow.600">{pendingBookings.length}</Heading>
              </Box>
              <Box p={3} bg="yellow.100" color="yellow.600" borderRadius="md">
                <LuClock size={24} />
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* TAB: APROVADAS */}
        <Card.Root 
          cursor="pointer"
          onClick={() => setActiveTab('CONFIRMED')}
          borderWidth="2px"
          borderColor={activeTab === 'CONFIRMED' ? 'green.400' : 'green.100'}
          bg={activeTab === 'CONFIRMED' ? 'green.50' : 'white'}
          transition="all 0.2s"
          _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
        >
          <Card.Body>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="fg.muted" fontSize="sm" fontWeight="medium">Reservas Aprovadas</Text>
                <Heading size="2xl" color="green.600">{confirmedBookings.length}</Heading>
              </Box>
              <Box p={3} bg="green.100" color="green.600" borderRadius="md">
                <LuCalendarCheck size={24} />
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* TAB: REJEITADAS */}
        <Card.Root 
          cursor="pointer"
          onClick={() => setActiveTab('REJECTED')}
          borderWidth="2px"
          borderColor={activeTab === 'REJECTED' ? 'red.400' : 'red.100'}
          bg={activeTab === 'REJECTED' ? 'red.50' : 'white'}
          transition="all 0.2s"
          _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
        >
          <Card.Body>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="fg.muted" fontSize="sm" fontWeight="medium">Reservas Rejeitadas</Text>
                <Heading size="2xl" color="red.600">{rejectedBookings.length}</Heading>
              </Box>
              <Box p={3} bg="red.100" color="red.600" borderRadius="md">
                <LuBan size={24} />
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Tabela Responsiva da Aba Ativa */}
      <Box mb={8}>
        <Heading size="md" mb={4} color="gray.700">
          {activeTab === 'PENDING' && 'Ações Pendentes'}
          {activeTab === 'CONFIRMED' && 'Lista de Reservas Aprovadas'}
          {activeTab === 'REJECTED' && 'Histórico de Rejeições'}
        </Heading>

        {loading ? (
          <Center py={10}><Spinner size="xl" color="blue.500" /></Center>
        ) : currentList.length === 0 ? (
          <Box p={6} textAlign="center" borderWidth="1px" borderRadius="lg" bg="white" color="fg.muted">
            Nenhuma reserva encontrada nesta categoria.
          </Box>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" bg="white" overflowX="auto">
            <Table.Root size="md" variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader whiteSpace="nowrap">Reunião & Sala</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap">Requerente</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap">Data e Hora</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right" whiteSpace="nowrap">Ação / Status</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {currentList.map((booking) => (
                  <Table.Row key={booking.id}>
                    <Table.Cell>
                      <Text fontWeight="bold" whiteSpace="nowrap">{booking.title}</Text>
                      <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">{booking.room.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text whiteSpace="nowrap">{booking.user?.name || 'Usuário Desconhecido'}</Text>
                      <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">{booking.user?.email}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text whiteSpace="nowrap">{formatDate(booking.startTime)}</Text>
                      <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">até {formatDate(booking.endTime)}</Text>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      
                      {/* Renderização Condicional da Ação baseada na Aba */}
                      {activeTab === 'PENDING' && (
                        <Stack direction="row" gap={2} justify="flex-end">
                          <Button 
                            size="sm" 
                            colorPalette="green" 
                            onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                            loading={processingId === booking.id}
                          >
                            <LuCheck /> Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            colorPalette="red" 
                            variant="outline"
                            onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                            loading={processingId === booking.id}
                          >
                            <LuX /> Rejeitar
                          </Button>
                        </Stack>
                      )}

                      {activeTab === 'CONFIRMED' && (
                        <Stack direction="row" gap={3} justify="flex-end" align="center">
                          <Badge colorPalette="green" size="sm">Aprovada</Badge>
                          {/* Botão extra para o Admin conseguir cancelar uma reserva já aprovada */}
                          <Button 
                            size="xs" 
                            colorPalette="red" 
                            variant="ghost"
                            title="Revogar Aprovação"
                            onClick={() => handleCancelApproved(booking.id)}
                            loading={processingId === booking.id}
                          >
                            <LuBan /> Cancelar
                          </Button>
                        </Stack>
                      )}

                      {activeTab === 'REJECTED' && (
                        <Badge colorPalette="red" size="sm">Rejeitada</Badge>
                      )}

                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>
    </Box>
  );
}