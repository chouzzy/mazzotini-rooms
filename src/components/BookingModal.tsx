'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  Button,
  Input,
  Stack,
  Text,
  Separator,
  Field
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react'; // IMPORTAÇÃO DO NEXTAUTH
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
  const { data: session } = useSession(); // PEGA O USUÁRIO LOGADO
  
  // Dados do Formulário (Removido name e email)
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
    
    // Garante que o usuário está logado
    if (!session?.user?.id) {
      toaster.create({ title: 'Erro de Autenticação', description: 'Você precisa estar logado.', type: 'error' });
      return;
    }

    if (!title || !startTime || !endTime) {
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
      // O PASSO 1 (Identificação) FOI REMOVIDO! O NextAuth já fez isso por nós.

      // 2. AGENDAMENTO DIRETO COM O ID DA SESSÃO
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          userId: session.user.id, // USA O ID DO USUÁRIO LOGADO!
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
        title: 'Reserva Submetida com Sucesso!',
        description: `Sala ${selectedRoom.name} foi reservada. Aguarde a confirmação da administração por e-mail.`,
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
                Agendando como: <strong>{session?.user?.name}</strong> ({session?.user?.email})
              </Text>

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