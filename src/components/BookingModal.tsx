'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, Button, Input, Stack, Text, Separator, Field,
  Flex, Box, IconButton, Alert
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useSession } from 'next-auth/react'; 

interface Room {
  id: string;
  name: string;
}

interface SuggestedRoom extends Room {
  capacity: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: Room | null;
  onSuccess: () => void;
}

export default function BookingModal({ isOpen, onClose, selectedRoom, onSuccess }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession(); 
  
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [guests, setGuests] = useState<{name: string, email: string, phone: string}[]>([]);
  const [minDateTime, setMinDateTime] = useState('');

  // ESTADO DA SUGESTÃO DE SALA
  const [suggestion, setSuggestion] = useState<SuggestedRoom | null>(null);

  const getMinBookingDateTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const isBusinessHours = hour >= 8 && hour < 18;
    
    let minDate = new Date(now);
    if (isBusinessHours) { minDate.setHours(now.getHours() + 4); } 
    else {
      if (hour >= 18) { minDate.setDate(now.getDate() + 1); }
      minDate.setHours(10, 30, 0, 0);
    }
    minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());
    return minDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isOpen) {
      setMinDateTime(getMinBookingDateTime());
      setGuests([]); setIsOnline(false); setStartTime(''); setEndTime(''); setTitle('');
      setSuggestion(null); // Limpa a sugestão ao abrir
    }
  }, [isOpen]);

  const handleAddGuest = () => setGuests([...guests, { name: '', email: '', phone: '' }]);
  const handleRemoveGuest = (index: number) => {
    const newGuests = [...guests];
    newGuests.splice(index, 1);
    setGuests(newGuests);
  };

  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return v.substring(0, 15);
  };

  const handleGuestChange = (index: number, field: 'name' | 'email' | 'phone', value: string) => {
    const newGuests = [...guests];
    if (field === 'phone') newGuests[index][field] = formatPhone(value);
    else if (field === 'email') newGuests[index][field] = value.toLowerCase().replace(/\s/g, '');
    else newGuests[index][field] = value.replace(/\s{2,}/g, ' ');
    setGuests(newGuests);
  };

  // Função que envia para a API. Aceita um ID de sala opcional caso o usuário aceite a sugestão
  const handleSubmit = async (overrideRoomId?: string) => {
    const targetRoomId = overrideRoomId || selectedRoom?.id;
    if (!targetRoomId) return;
    
    if (!title || !startTime || !endTime) return toaster.create({ title: 'Preencha os campos', type: 'warning' });
    if (new Date(endTime) <= new Date(startTime)) return toaster.create({ title: 'A hora de término deve ser após o início', type: 'error' });
    if (!session || !session.user || !session.user.id) return toaster.create({ title: 'Você precisa estar logado', type: 'error' });

    setLoading(true);
    setSuggestion(null); // Limpa sugestão anterior

    try {
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: targetRoomId,
          userId: session.user.id,
          title,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          isOnline,
          guests
        }),
      });

      if (!bookingRes.ok) {
        const errorData = await bookingRes.json();
        
        // CAPTURA A SUGESTÃO DE OTIMIZAÇÃO (STATUS 409)
        if (bookingRes.status === 409 && errorData.suggestion) {
           setSuggestion(errorData.suggestion);
           return; // Para aqui e mostra a sugestão no frontend
        }
        throw new Error(errorData.error || 'Erro ao agendar sala');
      }

      toaster.create({ title: 'Solicitação enviada!', description: 'Sua reserva está pendente de aprovação.', type: 'success' });
      onSuccess();
      onClose();

    } catch (error: any) {
      toaster.create({ title: 'Atenção', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(2px)" />
      <Dialog.Positioner>
        <Dialog.Content maxW="2xl" borderRadius="xl">
          <Dialog.Header>
            <Dialog.Title>Reservar {selectedRoom?.name}</Dialog.Title>
          </Dialog.Header>
          <Dialog.CloseTrigger />
          
          <Dialog.Body pb={6}>
            <Stack gap={4}>
              
              {/* ALERTA INTELIGENTE DE OTIMIZAÇÃO DE SALA */}
              {suggestion && (
                <Alert.Root status="info" variant="subtle" borderWidth="1px" borderRadius="md" borderColor="blue.200">
                  <Alert.Indicator />
                  <Box w="full">
                    <Alert.Title>Horário Indisponível nesta sala!</Alert.Title>
                    <Alert.Description fontSize="sm" mt={1}>
                      Mas encontramos a <strong>{suggestion.name}</strong> livre neste horário. Ela possui capacidade para {suggestion.capacity} pessoas.
                    </Alert.Description>
                    <Button 
                      mt={3} size="sm" colorPalette="blue" w="full"
                      onClick={() => handleSubmit(suggestion.id)}
                      loading={loading}
                    >
                      Aceitar Sugestão e Agendar na {suggestion.name}
                    </Button>
                  </Box>
                </Alert.Root>
              )}

              <Text fontSize="sm" color="fg.muted">
                Preencha os dados abaixo. <strong>O prazo mínimo é de 4h.</strong>
              </Text>

              <Field.Root required>
                <Field.Label>Assunto da Reunião</Field.Label>
                <Input placeholder="Ex: Reunião de Alinhamento" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field.Root>

              <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
                <Field.Root required flex={1}>
                  <Field.Label>Início</Field.Label>
                  <Input type="datetime-local" value={startTime} min={minDateTime} onChange={(e) => { setStartTime(e.target.value); setSuggestion(null); }} />
                </Field.Root>
                <Field.Root required flex={1}>
                  <Field.Label>Fim</Field.Label>
                  <Input type="datetime-local" value={endTime} min={startTime || minDateTime} onChange={(e) => { setEndTime(e.target.value); setSuggestion(null); }} />
                </Field.Root>
              </Flex>

              <Separator my={2} />

              {/* OPÇÃO DE ONLINE (TEAMS) */}
              <Field.Root>
                <Flex align="center" gap={3}>
                  <input type="checkbox" id="isOnlineCheck" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="isOnlineCheck" style={{ cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Reunião Online ou Híbrida (Gerar link do Teams)</label>
                </Flex>
              </Field.Root>

              {/* CONVIDADOS */}
              <Box mt={2} p={4} bg="gray.50" borderRadius="md" borderWidth="1px">
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontWeight="medium" fontSize="sm">Convidados Externos (Opcional)</Text>
                  <Button size="xs" variant="outline" colorPalette="blue" onClick={handleAddGuest}>+ Adicionar</Button>
                </Flex>
                <Stack gap={3}>
                  {guests.length === 0 && <Text fontSize="xs" color="fg.muted">Nenhum convidado adicionado.</Text>}
                  {guests.map((guest, index) => (
                    <Flex key={index} gap={2} align="center" wrap={{ base: 'wrap', sm: 'nowrap' }} p={3} bg="white" borderWidth="1px" borderRadius="md">
                      <Input flex={{ base: '100%', sm: 1 }} minW="150px" size="sm" placeholder="Nome Completo" value={guest.name} onChange={(e) => handleGuestChange(index, 'name', e.target.value)} />
                      <Input flex={{ base: '100%', sm: 1 }} minW="180px" size="sm" type="email" placeholder="E-mail (ex: joao@gmail.com)" value={guest.email} onChange={(e) => handleGuestChange(index, 'email', e.target.value)} />
                      <Input flex={{ base: '100%', sm: 1 }} minW="140px" size="sm" type="tel" placeholder="(11) 99999-9999" value={guest.phone} onChange={(e) => handleGuestChange(index, 'phone', e.target.value)} />
                      <Button w={{ base: '100%', sm: 'auto' }} size="sm" colorPalette="red" variant="ghost" onClick={() => handleRemoveGuest(index)}>Remover</Button>
                    </Flex>
                  ))}
                </Stack>
              </Box>

            </Stack>
          </Dialog.Body>

          <Dialog.Footer bg="gray.50" borderBottomRadius="xl">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button colorPalette="blue" onClick={() => handleSubmit()} loading={loading}>
              Confirmar Solicitação
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}