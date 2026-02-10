'use client';

import { useState } from 'react';
import {
  Box,
  Heading,
  Input,
  Button,
  Stack,
  Card,
  Text,
  Field,
  Separator,
  Center,
  Spinner,
  Dialog,
  Link as ChakraLink
} from '@chakra-ui/react';
import { LuCalendarX, LuSearch, LuBadgeAlert, LuVideo } from "react-icons/lu";
import { toaster } from './ui/toaster';

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  onlineMeetingUrl?: string | null; // Novo campo opcional
  room: {
    name: string;
  };
}

export default function MyBookings() {
  const [email, setEmail] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para controlar o cancelamento
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [idToConfirm, setIdToConfirm] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Erro ao buscar agendamentos');
      
      const data = await res.json();
      setBookings(data);
      setIsSearched(true);
    } catch (error) {
      toaster.create({
        title: 'Erro',
        description: 'Não foi possível carregar seus agendamentos.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!idToConfirm) return;
    
    const id = idToConfirm;
    setCancelingId(id);
    setIdToConfirm(null);

    try {
      const res = await fetch(`/api/bookings?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Falha ao cancelar');

      toaster.create({
        title: 'Sucesso',
        description: 'Agendamento cancelado.',
        type: 'success',
      });

      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      toaster.create({
        title: 'Erro',
        description: 'Não foi possível cancelar o agendamento.',
        type: 'error',
      });
    } finally {
      setCancelingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box mt={10} p={6} borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="lg" mb={6}>Meus Agendamentos</Heading>

      <Stack gap={4} direction={{ base: 'column', sm: 'row' }} align="flex-end" mb={8}>
        <Field.Root flex="1">
          <Field.Label>Consultar por E-mail</Field.Label>
          <Input 
            placeholder="Seu e-mail cadastrado..." 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
          />
        </Field.Root>
        <Button 
          onClick={fetchBookings} 
          loading={loading}
          colorPalette="blue"
        >
          <LuSearch /> Buscar
        </Button>
      </Stack>

      <Separator mb={6} />

      {loading && (
        <Center py={10}>
          <Spinner size="lg" color="blue.500" />
        </Center>
      )}

      {!loading && isSearched && bookings.length === 0 && (
        <Box textAlign="center" py={10} color="fg.muted">
          <Text fontSize="lg">Nenhum agendamento encontrado para este e-mail.</Text>
        </Box>
      )}

      <Stack gap={4}>
        {bookings.map((booking) => (
          <Card.Root key={booking.id} size="sm" variant="subtle">
            <Card.Body>
              <Stack 
                direction={{ base: 'column', md: 'row' }} 
                justify="space-between" 
                align={{ base: 'start', md: 'center' }}
                gap={4}
              >
                <Box>
                  <Heading size="sm" mb={1}>{booking.title}</Heading>
                  <Text fontSize="sm" color="fg.muted" fontWeight="bold">
                    {booking.room.name}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {formatDate(booking.startTime)} - {formatDate(booking.endTime)}
                  </Text>
                </Box>

                <Stack direction="row" gap={3}>
                  {/* Botão do Teams (Visível apenas se houver link) */}
                  {booking.onlineMeetingUrl && (
                    <Button
                      onClick={() => window.open(booking.onlineMeetingUrl!, '_blank', 'noopener,noreferrer')}
                      size="sm"
                      colorPalette="purple" // Roxo/Azul para destacar o Teams
                      variant="solid"
                    >
                      <LuVideo /> Entrar no Teams
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    colorPalette="red" 
                    variant="outline"
                    loading={cancelingId === booking.id}
                    onClick={() => setIdToConfirm(booking.id)}
                  >
                    <LuCalendarX /> Cancelar
                  </Button>
                </Stack>
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </Stack>

      {/* Dialog de Confirmação */}
      <Dialog.Root 
        open={!!idToConfirm} 
        onOpenChange={(e) => !e.open && setIdToConfirm(null)}
        role="alertdialog"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Stack direction="row" align="center" gap={2}>
                <LuBadgeAlert color="orange" />
                <Dialog.Title>Cancelar Agendamento</Dialog.Title>
              </Stack>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setIdToConfirm(null)}>
                Voltar
              </Button>
              <Button colorPalette="red" onClick={handleConfirmCancel}>
                Sim, Cancelar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}