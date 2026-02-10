'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  Button,
  Input,
  Stack,
  Text,
  Separator,
  Field,
} from '@chakra-ui/react';
import { toaster } from './ui/toaster';

interface Room {
  id: string;
  name: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: Room | null;
  onSuccess: () => void;
}

export default function BookingModal({ isOpen, onClose, selectedRoom, onSuccess }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Dados do Formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Estado para guardar a data mínima (agora) formatada para o input datetime-local
  const [minDateTime, setMinDateTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Formato YYYY-MM-DDTHH:MM
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setMinDateTime(now.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedRoom) return;

    if (!name || !email || !title || !startTime || !endTime) {
      toaster.create({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    // Validação extra de data passada no submit
    if (new Date(startTime) < new Date()) {
      toaster.create({
        title: 'Data inválida',
        description: 'Não é possível agendar no passado.',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      // 1. IDENTIFICAÇÃO
      const authRes = await fetch('/api/auth/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      if (!authRes.ok) {
        const err = await authRes.json();
        throw new Error(err.error || 'Erro na identificação');
      }

      const user = await authRes.json();

      // 2. AGENDAMENTO
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          userId: user.id,
          title,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      if (!bookingRes.ok) {
        const err = await bookingRes.json();
        throw new Error(err.error || 'Erro ao agendar');
      }

      toaster.create({
        title: 'Agendamento Confirmado!',
        description: `Sala ${selectedRoom.name} reservada com sucesso.`,
        type: 'success',
        duration: 5000,
      });

      onSuccess();
      onClose();
      
      setTitle('');
      setStartTime('');
      setEndTime('');

    } catch (error: any) {
      toaster.create({
        title: 'Erro',
        description: error.message,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Reservar: {selectedRoom?.name}</Dialog.Title>
          </Dialog.Header>
          <Dialog.CloseTrigger />
          
          <Dialog.Body>
            <Stack gap={4}>
              <Text fontSize="sm" color="fg.muted">
                Identifique-se para realizar o agendamento.
              </Text>

              <Field.Root required>
                <Field.Label>Seu Nome</Field.Label>
                <Input 
                  placeholder="Ex: João Silva" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Seu Email</Field.Label>
                <Input 
                  type="email" 
                  placeholder="Ex: joao@empresa.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </Field.Root>

              <Separator />

              <Field.Root required>
                <Field.Label>Título da Reunião</Field.Label>
                <Input 
                  placeholder="Ex: Daily Scrum" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Início</Field.Label>
                <Input 
                  type="datetime-local" 
                  value={startTime}
                  min={minDateTime} // Bloqueia passado no calendário
                  onChange={(e) => setStartTime(e.target.value)} 
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Fim</Field.Label>
                <Input 
                  type="datetime-local" 
                  value={endTime}
                  min={startTime || minDateTime} // Bloqueia datas anteriores ao início
                  onChange={(e) => setEndTime(e.target.value)} 
                />
              </Field.Root>
            </Stack>
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              colorPalette="blue" 
              onClick={handleSubmit} 
              loading={loading}
              loadingText="Agendando..."
            >
              Confirmar Reserva
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}