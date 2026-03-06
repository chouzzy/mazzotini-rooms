'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Heading, Table, Badge, Button, Flex, 
  Spinner, Center, Text, Stack, SimpleGrid, Card,
  Dialog, Input, Field, NativeSelect
} from '@chakra-ui/react';
import { 
  LuCheck, LuX, LuClock, LuCalendarCheck, 
  LuBan, LuPrinter, LuHistory, LuTimer, LuCalendarClock
} from "react-icons/lu";
import { toaster } from '@/components/ui/toaster';

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  roomId: string; 
  room: {
    name: string;
    capacity: number;
    amenities: string[];
  };
  user: {
    name: string;
    email: string;
  };
}

interface RoomItem {
  id: string;
  name: string;
  capacity: number;
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'PENDING' | 'CONFIRMED' | 'PAST' | 'REJECTED'>('PENDING');

  // Estados para o Modal de Remanejamento
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([]);
  const [rescheduleData, setRescheduleData] = useState({ roomId: '', startTime: '', endTime: '' });

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
    
    // Atualiza a tela a cada 1 minuto para os cronômetros de urgência não ficarem congelados
    const interval = setInterval(() => setBookings(b => [...b]), 60000);
    return () => clearInterval(interval);
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

      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (newStatus === 'CONFIRMED') {
         toaster.create({ title: 'Reserva Aprovada!', type: 'success' });
      }
      
    } catch (error) {
      toaster.create({ title: 'Ocorreu um erro', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelApproved = async (id: string) => {
    if(!confirm("Deseja realmente cancelar esta reserva já aprovada? O usuário será notificado.")) return;
    handleUpdateStatus(id, 'REJECTED');
  };

  // -------------------------------------------------------------
  // FUNÇÕES DE REMANEJAMENTO (ADMIN)
  // -------------------------------------------------------------
  const handleOpenReschedule = async (booking: Booking) => {
    setBookingToReschedule(booking);
    
    // Formatador para o input datetime-local (Y-M-D T H:M)
    const formatForInput = (dateStr: string) => {
      const d = new Date(dateStr);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };

    setRescheduleData({
      roomId: booking.roomId || '', 
      startTime: formatForInput(booking.startTime),
      endTime: formatForInput(booking.endTime)
    });

    setIsRescheduleOpen(true);

    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      const activeRooms = data.filter((r: any) => r.isActive);
      setAvailableRooms(activeRooms);
      
      if (!booking.roomId && activeRooms.length > 0) {
        const currentRoom = activeRooms.find((r: any) => r.name === booking.room.name);
        if (currentRoom) {
          setRescheduleData(prev => ({ ...prev, roomId: currentRoom.id }));
        }
      }
    } catch (e) {
      console.error("Erro ao buscar salas para remanejamento", e);
    }
  };

  const submitReschedule = async () => {
    if (!bookingToReschedule || !rescheduleData.roomId || !rescheduleData.startTime || !rescheduleData.endTime) {
      toaster.create({ title: 'Preencha todos os campos', type: 'warning' });
      return;
    }

    // NOVA VALIDAÇÃO: Bloqueando a viagem no tempo! ⚡🚗
    if (new Date(rescheduleData.endTime) <= new Date(rescheduleData.startTime)) {
      toaster.create({ 
        title: 'Horário Inválido', 
        description: 'O horário de término deve ser posterior ao horário de início. Ainda é impossível viajar de volta para o passado! 😅⏰🚫', 
        type: 'error' 
      });
      return;
    }

    setProcessingId(bookingToReschedule.id);
    try {
      const res = await fetch(`/api/bookings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: bookingToReschedule.id, 
          roomId: rescheduleData.roomId,
          startTime: new Date(rescheduleData.startTime).toISOString(),
          endTime: new Date(rescheduleData.endTime).toISOString(),
          status: bookingToReschedule.status 
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao remanejar reserva');
      }

      toaster.create({ title: 'Reserva remanejada com sucesso!', type: 'success' });
      setIsRescheduleOpen(false);
      fetchBookings(); 
    } catch (error: any) {
      toaster.create({ title: 'Erro', description: error.message, type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  // -------------------------------------------------------------
  // MÁGICA DE GERAÇÃO DE PDF NATIVA PARA A COPA (Mantido cores claras para impressão)
  // -------------------------------------------------------------
  const handleGenerateCopaPDF = (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toaster.create({ title: 'Erro', description: 'Por favor, permita pop-ups no seu navegador.', type: 'warning' });
        return;
    }

    const start = new Date(booking.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const end = new Date(booking.endTime).toLocaleString('pt-BR', { timeStyle: 'short' });
    const baseUrl = window.location.origin;
    
    const amenities = booking.room.amenities || [];
    const amenitiesText = amenities.length > 0 ? amenities.join(' • ') : 'Nenhum recurso extra listado';
    const amenitiesLower = amenities.map(a => a.toLowerCase());

    let checklistHtml = `
      <li><span class="box"></span> Limpeza da sala e alinhamento de <strong>${booking.room.capacity} cadeiras</strong></li>
      <li><span class="box"></span> Verificação de lixeiras e controle do Ar Condicionado posicionado</li>
    `;

    if (amenitiesLower.some(a => a.includes('café') || a.includes('água'))) {
      checklistHtml += `<li><span class="box"></span> Preparar garrafa de café fresco, água e copos/xícaras suficientes para ${booking.room.capacity} pessoas</li>`;
    }
    if (amenitiesLower.some(a => a.includes('tv') || a.includes('hdmi') || a.includes('vídeo') || a.includes('video'))) {
      checklistHtml += `<li><span class="box"></span> Ligar e testar a TV/Projetor/Videoconferência e verificar cabos na mesa</li>`;
    }
    if (amenitiesLower.some(a => a.includes('quadro'))) {
      checklistHtml += `<li><span class="box"></span> Verificar apagador limpo e canetas de quadro branco com tinta</li>`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OS Copa - ${booking.title}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; background: #fff; }
            .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
            .header img { max-height: 70px; margin-bottom: 12px; }
            .title { font-size: 24px; color: #1e3a8a; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;}
            .subtitle { font-size: 16px; color: #64748b; margin-top: 4px; font-weight: 500;}
            .card { border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px; background: #f8fafc; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; font-size: 16px;}
            .row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .label { font-weight: bold; color: #475569; width: 30%; }
            .value { font-weight: 600; color: #0f172a; width: 70%; text-align: right; }
            .amenities-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 30px; }
            .amenities-box p { margin: 0; color: #1e3a8a; font-size: 15px; font-weight: 500; text-align: center;}
            h3 { color: #1e3a8a; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;}
            .checklist { list-style: none; padding: 0; margin-top: 20px; }
            .checklist li { margin-bottom: 16px; font-size: 17px; display: flex; align-items: flex-start; color: #334155; line-height: 1.4;}
            .box { min-width: 22px; height: 22px; border: 2px solid #64748b; border-radius: 6px; margin-right: 16px; display: inline-block; background: white; margin-top: 2px;}
            .footer { margin-top: 80px; text-align: center; }
            .signature-line { width: 300px; border-bottom: 1px solid #1e293b; margin: 0 auto 10px auto; }
            @media print {
              @page { margin: 1.5cm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${baseUrl}/logo.png" onerror="this.style.display='none'" alt="Mazzotini Advogados Logo" />
            <h1 class="title">Ordem de Serviço (OS)</h1>
            <p class="subtitle">Preparação de Apoio / Copa</p>
          </div>
          <div class="card">
            <div class="row"><span class="label">Assunto:</span> <span class="value">${booking.title}</span></div>
            <div class="row"><span class="label">Espaço:</span> <span class="value">${booking.room.name} (Capacidade: ${booking.room.capacity})</span></div>
            <div class="row"><span class="label">Solicitante:</span> <span class="value">${booking.user.name || booking.user.email}</span></div>
            <div class="row"><span class="label">Horário:</span> <span class="value">${start} até ${end}</span></div>
          </div>
          <div class="amenities-box"><p><strong>Recursos da Sala:</strong> ${amenitiesText}</p></div>
          <h3>Checklist de Preparação Focada:</h3>
          <ul class="checklist">${checklistHtml}</ul>
          <div class="footer">
            <div class="signature-line"></div>
            <p style="font-size: 14px; color: #64748b; margin:0;">Assinatura do Responsável (Copa/Apoio)</p>
          </div>
          <script>setTimeout(function() { window.print(); }, 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // -------------------------------------------------------------
  // LÓGICA DE TEMPO, URGÊNCIA E SEPARAÇÃO DE TABS
  // -------------------------------------------------------------
  const now = new Date();

  const getUrgency = (dateString: string) => {
    const diffMs = new Date(dateString).getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return null; 
    
    if (diffMins <= 60) return { text: `Em ${diffMins} min`, color: 'red' }; 
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return { text: `Em ${diffHours} h`, color: 'orange' }; 
    
    const diffDays = Math.floor(diffHours / 24);
    return { text: `Em ${diffDays} dias`, color: 'purple' }; 
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const pendingBookings = bookings.filter(b => b.status === 'PENDING' && new Date(b.startTime) >= now);
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.endTime) >= now);
  
  const pastBookings = bookings.filter(b => 
    (b.status === 'PENDING' && new Date(b.startTime) < now) || 
    (b.status === 'CONFIRMED' && new Date(b.endTime) < now)
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); 

  const rejectedBookings = bookings.filter(b => b.status === 'REJECTED' || b.status === 'CANCELLED');

  const currentList = activeTab === 'PENDING' ? pendingBookings 
                    : activeTab === 'CONFIRMED' ? confirmedBookings 
                    : activeTab === 'PAST' ? pastBookings
                    : rejectedBookings;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg" color="fg.DEFAULT">Visão Geral & Aprovações</Heading>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={8}>
        <Card.Root 
          cursor="pointer" 
          onClick={() => setActiveTab('PENDING')} 
          borderWidth="1px" 
          borderColor={activeTab === 'PENDING' ? 'yellow.600' : 'yellow.300'} 
          bg={activeTab === 'PENDING' ? 'yellow.500' : 'transparent'}
        >
          <Card.Body p={4}>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color={'#FFFFFF'} fontSize="sm" fontWeight="bold" textTransform="uppercase">Aguardam Aprovação</Text>
                <Heading size="xl" color="#FFFFFF">{pendingBookings.length}</Heading>
              </Box>
              <Box p={3} bgColor={'yellow.500'} color="yellow.50" borderRadius="md"><LuClock size={20} /></Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Card.Root 
          cursor="pointer" 
          onClick={() => setActiveTab('CONFIRMED')} 
          borderWidth="1px"  
          borderColor={activeTab === 'CONFIRMED' ? 'green.600' : 'green.300'} 
          bg={activeTab === 'CONFIRMED' ? 'green.500' : 'transparent'}
        >
          <Card.Body p={4}>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="#FFFFFF" fontSize="sm" fontWeight="bold" textTransform="uppercase">Aprovadas (Futuras)</Text>
                <Heading size="xl" color="#FFFFFF">{confirmedBookings.length}</Heading>
              </Box>
              <Box p={3} bg="green.500" color="green.50" borderRadius="md"><LuCalendarCheck size={20} /></Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Card.Root 
          cursor="pointer" 
          onClick={() => setActiveTab('PAST')} 
          borderWidth="1px"  
          borderColor={activeTab === 'PAST' ? 'gray.500' : 'gray.300'} 
          bg={activeTab === 'PAST' ? 'gray.500' : 'transparent'}
        >
          <Card.Body p={4}>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="#FFFFFF" fontSize="sm" fontWeight="bold" textTransform="uppercase">Histórico / Vencidas</Text>
                <Heading size="xl" color="#FFFFFF">{pastBookings.length}</Heading>
              </Box>
              <Box p={3} bg="gray.500" color="gray.50" borderRadius="md"><LuHistory size={20} /></Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Card.Root 
          cursor="pointer" 
          onClick={() => setActiveTab('REJECTED')} 
          borderWidth="1px"  
          borderColor={activeTab === 'REJECTED' ? 'red.500' : 'red.300'} 
          bg={activeTab === 'REJECTED' ? 'red.500' : 'transparent'}
        >
          <Card.Body p={4}>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="#FFFFFF" fontSize="sm" fontWeight="bold" textTransform="uppercase">Rejeitadas / Canc.</Text>
                <Heading size="xl" color="#FFFFFF">{rejectedBookings.length}</Heading>
              </Box>
              <Box p={3} bg="red.500" color="red.50" borderRadius="md"><LuBan size={20} /></Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Box mb={8}>
        <Heading size="md" mb={4} color="fg.DEFAULT">
          {activeTab === 'PENDING' && 'Ações Pendentes (Ordene por Urgência)'}
          {activeTab === 'CONFIRMED' && 'Lista de Reservas Aprovadas'}
          {activeTab === 'PAST' && 'Histórico de Reservas Realizadas ou Expiradas'}
          {activeTab === 'REJECTED' && 'Histórico de Rejeições'}
        </Heading>

        {loading ? (
          <Center py={10}><Spinner size="xl" color="brand.500" /></Center>
        ) : currentList.length === 0 ? (
          <Box p={6} textAlign="center" borderWidth="1px" borderColor="border.muted" borderRadius="lg" bg="bg.panel" color="fg.muted">
            Nenhuma reserva encontrada nesta categoria.
          </Box>
        ) : (
          <Box borderRadius="lg"  overflowX="auto">
            <Table.Root size="md" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader whiteSpace="nowrap" color="brand.600">Reunião & Sala</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap" color="brand.600">Requerente</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap" color="brand.600">Data e Hora</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right" whiteSpace="nowrap" color="brand.600">Status / Ação</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {currentList.map((booking) => {
                  const urgency = activeTab === 'PENDING' ? getUrgency(booking.startTime) : null;

                  // LÓGICA DE DETECÇÃO DE CONFLITO PARA USUÁRIOS VIP
                  // Verifica se esta reserva bate com os horários de reservas já aprovadas na mesma sala
                  const conflicts = activeTab === 'PENDING' 
                    ? confirmedBookings.filter(cb => 
                        cb.roomId === booking.roomId && 
                        new Date(cb.startTime) < new Date(booking.endTime) && 
                        new Date(cb.endTime) > new Date(booking.startTime)
                      )
                    : [];
                  
                  const hasConflict = conflicts.length > 0;

                  return (
                    <Table.Row 
                      key={booking.id}
                      bg={hasConflict ? 'red.900/20' : 'transparent'} // Fundo avermelhado bem sutil para o conflito
                      transition="background-color 0.3s"
                    >
                      <Table.Cell>
                        <Text fontWeight="bold" color={hasConflict ? "red.300" : "fg.DEFAULT"} whiteSpace="nowrap">{booking.title}</Text>
                        <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">{booking.room.name}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text color="fg.DEFAULT" whiteSpace="nowrap">{booking.user?.name || 'Usuário Desconhecido'}</Text>
                        <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">{booking.user?.email}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex direction="column" gap={1}>
                          <Text color="fg.DEFAULT" whiteSpace="nowrap">{formatDate(booking.startTime)}</Text>
                          <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">até {formatDate(booking.endTime)}</Text>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        
                        {/* AÇÕES DA ABA PENDENTE */}
                        {activeTab === 'PENDING' && (
                          <Flex direction="column" align="flex-end" gap={2}>
                            {urgency && !hasConflict && (
                              <Badge colorPalette={urgency.color} size="sm" variant="solid">
                                <LuTimer style={{ marginRight: '4px' }} /> {urgency.text}
                              </Badge>
                            )}
                            
                            <Stack direction="row" gap={2} mt={1}>
                              {/* Botão Aprovar: Fica desativado se houver conflito! */}
                              <Button 
                                size="xs" 
                                colorPalette="green" 
                                onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')} 
                                loading={processingId === booking.id}
                                disabled={hasConflict}
                              >
                                <LuCheck /> Aprovar
                              </Button>
                              <Button size="xs" colorPalette="cyan" variant="solid" onClick={() => handleOpenReschedule(booking)}>
                                <LuCalendarClock /> Remanejar
                              </Button>
                              <Button size="xs" colorPalette="red" variant="solid" onClick={() => handleUpdateStatus(booking.id, 'REJECTED')} loading={processingId === booking.id}>
                                <LuX /> Rejeitar
                              </Button>
                            </Stack>

                            {/* O ALERTA INTELIGENTE DE CONFLITO */}
                            {hasConflict && (
                              <Box mt={3} p={3} bg="red.950" borderRadius="md" borderWidth="1px" borderColor="red.800" textAlign="left" w="100%" maxW="350px">
                                <Text fontSize="xs" color="red.200" fontWeight="bold" mb={1}>
                                  ⚠️ Requer Remanejamento Prévio
                                </Text>
                                <Text fontSize="xs" color="red.100" mb={3} lineHeight="shorter" opacity={0.8}>
                                  Esta solicitação colide com horários já aprovados nesta sala. Remaneje as reservas abaixo primeiro:
                                </Text>
                                <Stack gap={2}>
                                  {conflicts.map(c => (
                                    <Flex key={c.id} justify="space-between" align="center" bg="blackAlpha.400" p={2} borderRadius="md" borderWidth="1px" borderColor="red.900">
                                      <Box flex="1" overflow="hidden" mr={2}>
                                        <Text fontSize="xs" color="white" fontWeight="medium" lineClamp={1}>{c.title}</Text>
                                        <Text fontSize="2xs" color="whiteAlpha.700" lineClamp={1}>{c.user.name}</Text>
                                      </Box>
                                      {/* Usando o mesmo cyan dos seus botões */}
                                      <Button size="xs" colorPalette="cyan" variant="solid" onClick={() => handleOpenReschedule(c)}>
                                        Remanejar
                                      </Button>
                                    </Flex>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Flex>
                        )}

                        {/* AÇÕES DA ABA APROVADAS */}
                        {activeTab === 'CONFIRMED' && (
                          <Stack direction="row" gap={2} justify="flex-end" align="center">
                            <Button size="xs" colorPalette="cyan" variant="solid" onClick={() => handleOpenReschedule(booking)}>
                                <LuCalendarClock /> Remanejar
                            </Button>
                            <Button size="xs" colorPalette="pink" variant="solid" title="Gerar Ordem de Serviço para a Copa" onClick={() => handleGenerateCopaPDF(booking)}>
                              <LuPrinter /> Copa
                            </Button>
                            <Button size="xs" colorPalette="red" variant="solid" title="Revogar Aprovação" onClick={() => handleCancelApproved(booking.id)} loading={processingId === booking.id}>
                              <LuBan /> Cancelar
                            </Button>
                          </Stack>
                        )}

                        {activeTab === 'PAST' && (
                          <Badge colorPalette={booking.status === 'CONFIRMED' ? 'green' : 'gray'} size="sm" variant="subtle">
                            {booking.status === 'CONFIRMED' ? 'Realizada' : 'Expirou sem Aprovação'}
                          </Badge>
                        )}

                        {activeTab === 'REJECTED' && (
                          <Badge colorPalette="red" size="sm" variant="subtle">
                            {booking.status === 'REJECTED' ? 'Rejeitada' : 'Cancelada pelo Usuário'}
                          </Badge>
                        )}

                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      {/* MODAL DE REMANEJAMENTO */}
      <Dialog.Root open={isRescheduleOpen} onOpenChange={(e) => !e.open && setIsRescheduleOpen(false)} size="lg">
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" shadow="2xl" bg="bg.panel">
            <Dialog.Header>
              <Dialog.Title color="fg.DEFAULT">Remanejar Reunião</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            
            <Dialog.Body pb={6}>
              <Text color="fg.muted" fontSize="sm" mb={4}>
                Altere os detalhes da reserva <strong>{bookingToReschedule?.title}</strong>. 
                Isso notificará o solicitante ({bookingToReschedule?.user.name}) sobre a mudança.
              </Text>
              
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label color="fg.DEFAULT">Nova Sala</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field 
                      value={rescheduleData.roomId} 
                      onChange={(e) => setRescheduleData({...rescheduleData, roomId: e.target.value})}
                      bg="bg.canvas"
                      borderColor="border.muted"
                      color="fg.DEFAULT"
                    >
                      <option value="" style={{ color: 'black' }}>Selecione uma sala</option>
                      {availableRooms.map(room => (
                        <option key={room.id} value={room.id} style={{ color: 'black' }}>{room.name} (Cap. {room.capacity})</option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
                  <Field.Root flex={1}>
                    <Field.Label color="fg.DEFAULT">Novo Início</Field.Label>
                    <Input 
                      type="datetime-local" 
                      value={rescheduleData.startTime}
                      onChange={(e) => setRescheduleData({...rescheduleData, startTime: e.target.value})}
                      bg="bg.canvas"
                      borderColor="border.muted"
                    />
                  </Field.Root>

                  <Field.Root flex={1}>
                    <Field.Label color="fg.DEFAULT">Novo Fim</Field.Label>
                    <Input 
                      type="datetime-local" 
                      value={rescheduleData.endTime}
                      onChange={(e) => setRescheduleData({...rescheduleData, endTime: e.target.value})}
                      bg="bg.canvas"
                      borderColor="border.muted"
                    />
                  </Field.Root>
                </Flex>
              </Stack>
            </Dialog.Body>
            
            <Dialog.Footer bg="whiteAlpha.50" borderTopWidth="1px" borderColor="border.muted" borderBottomRadius="xl">
              <Button variant="solid" onClick={() => setIsRescheduleOpen(false)}>Cancelar</Button>
              <Button colorPalette="blue" onClick={submitReschedule} loading={!!processingId}>
                Salvar Alterações
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

    </Box>
  );
}