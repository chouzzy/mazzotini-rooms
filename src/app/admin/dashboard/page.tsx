'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Heading, Table, Badge, Button, Flex, 
  Spinner, Center, Text, Stack, SimpleGrid, Card
} from '@chakra-ui/react';
import { LuCheck, LuX, LuClock, LuCalendarCheck, LuBan } from "react-icons/lu";

// Nota: Não importamos mais a Navbar aqui, pois o AdminLayout já cuida da navegação lateral!

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

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Assumindo que a API devolve todas as reservas para o Admin
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

      // Atualiza o estado localmente para não precisar fazer um novo fetch imediato
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      
    } catch (error) {
      console.error("Erro ao atualizar o estado:", error);
      alert("Ocorreu um erro ao atualizar a reserva."); // Pode substituir pelo toaster se preferir
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Filtros para os painéis e tabelas
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const rejectedBookings = bookings.filter(b => b.status === 'REJECTED');

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg" color="gray.800">Visão Geral & Aprovações</Heading>
      </Flex>

      {/* Cartões de Resumo (Métricas) */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
        <Card.Root>
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

        <Card.Root>
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

        <Card.Root>
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

      {/* Tabela de Aprovações Pendentes */}
      <Box mb={8}>
        <Heading size="md" mb={4} color="gray.700">Ações Pendentes</Heading>
        {loading ? (
          <Center py={10}><Spinner size="xl" color="purple.500" /></Center>
        ) : pendingBookings.length === 0 ? (
          <Box p={6} textAlign="center" borderWidth="1px" borderRadius="lg" bg="white" color="fg.muted">
            Não há reservas a aguardar aprovação no momento.
          </Box>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" bg="white" overflowX="auto">
            <Table.Root size="md" variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Reunião & Sala</Table.ColumnHeader>
                  <Table.ColumnHeader>Requerente</Table.ColumnHeader>
                  <Table.ColumnHeader>Data e Hora</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Ação</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {pendingBookings.map((booking) => (
                  <Table.Row key={booking.id}>
                    <Table.Cell>
                      <Text fontWeight="bold">{booking.title}</Text>
                      <Text fontSize="sm" color="fg.muted">{booking.room.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{booking.user?.name || 'Utilizador Desconhecido'}</Text>
                      <Text fontSize="sm" color="fg.muted">{booking.user?.email}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{formatDate(booking.startTime)}</Text>
                      <Text fontSize="sm" color="fg.muted">até {formatDate(booking.endTime)}</Text>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
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