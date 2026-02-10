'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Table, Badge, Button, Flex, 
  Spinner, Center,  Stack, Text 
} from '@chakra-ui/react';
import Navbar from '@/components/Navbar';
import { LuCheck, LuX } from "react-icons/lu";
import { toaster } from '@/components/ui/toaster';

// Replicando o Enum aqui para uso no front (ou importar do prisma se estivesse num shared lib)
enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  user: { name: string; email: string };
  room: { name: string };
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings'); 
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      
      // Ordena: Pendentes primeiro
      const sorted = data.sort((a: Booking, b: Booking) => {
        if (a.status === BookingStatus.PENDING && b.status !== BookingStatus.PENDING) return -1;
        if (a.status !== BookingStatus.PENDING && b.status === BookingStatus.PENDING) return 1;
        return 0;
      });
      
      setBookings(sorted);
    } catch (error) {
      toaster.create({ title: 'Erro ao carregar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Falha na atualização');

      toaster.create({
        title: newStatus === BookingStatus.CONFIRMED ? 'Confirmado' : 'Rejeitado',
        description: `E-mail de notificação enviado.`,
        type: newStatus === BookingStatus.CONFIRMED ? 'success' : 'info',
      });

      setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));

    } catch (error) {
      toaster.create({ title: 'Erro ao processar', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return <Badge colorPalette="green">Confirmado</Badge>;
      case BookingStatus.REJECTED: return <Badge colorPalette="red">Rejeitado</Badge>;
      case BookingStatus.CANCELLED: return <Badge colorPalette="gray">Cancelado</Badge>;
      default: return <Badge colorPalette="yellow">Pendente</Badge>;
    }
  };

  return (
    <Box minH="100vh" bg="bg.canvas">
      <Navbar />
      
      <Container maxW="6xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Painel de Aprovações</Heading>
          <Button variant="outline" size="sm" onClick={fetchBookings}>Atualizar</Button>
        </Flex>

        {loading ? (
          <Center py={20}><Spinner size="xl" color="blue.500" /></Center>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" bg="white" overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Evento</Table.ColumnHeader>
                  <Table.ColumnHeader>Sala</Table.ColumnHeader>
                  <Table.ColumnHeader>Solicitante</Table.ColumnHeader>
                  <Table.ColumnHeader>Data/Hora</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {bookings.map((booking) => (
                  <Table.Row key={booking.id} bg={booking.status === BookingStatus.PENDING ? 'yellow.50' : 'transparent'}>
                    <Table.Cell>{getStatusBadge(booking.status)}</Table.Cell>
                    <Table.Cell fontWeight="medium">{booking.title}</Table.Cell>
                    <Table.Cell>{booking.room.name}</Table.Cell>
                    <Table.Cell>
                      <Stack gap={0}>
                        <Text fontSize="sm">{booking.user.name}</Text>
                        <Text fontSize="xs" color="fg.muted">{booking.user.email}</Text>
                      </Stack>
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap">
                      {formatDate(booking.startTime)}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      {booking.status === BookingStatus.PENDING && (
                        <Flex gap={2} justify="flex-end">
                          <Button 
                            size="xs" 
                            colorPalette="green" 
                            variant="solid"
                            onClick={() => handleStatusChange(booking.id, BookingStatus.CONFIRMED)}
                            loading={processingId === booking.id}
                            disabled={!!processingId}
                          >
                            <LuCheck /> Aprovar
                          </Button>
                          <Button 
                            size="xs" 
                            colorPalette="red" 
                            variant="outline"
                            onClick={() => handleStatusChange(booking.id, BookingStatus.REJECTED)}
                            loading={processingId === booking.id}
                            disabled={!!processingId}
                          >
                            <LuX /> Rejeitar
                          </Button>
                        </Flex>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
                {bookings.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center" py={8}>
                      Nenhuma solicitação encontrada.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Container>
    </Box>
  );
}