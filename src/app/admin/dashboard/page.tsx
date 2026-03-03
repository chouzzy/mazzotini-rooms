'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Heading, Table, Badge, Button, Flex, 
  Spinner, Center, Text, Stack, SimpleGrid, Card
} from '@chakra-ui/react';
import { LuCheck, LuX, LuClock, LuCalendarCheck, LuBan, LuPrinter } from "react-icons/lu";
import { toaster } from '@/components/ui/toaster';

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
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

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
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
  // MÁGICA DE GERAÇÃO DE PDF NATIVA PARA A COPA (AGORA DINÂMICA)
  // -------------------------------------------------------------
  const handleGenerateCopaPDF = (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toaster.create({ title: 'Erro', description: 'Por favor, permita pop-ups no seu navegador.', type: 'warning' });
        return;
    }

    const start = new Date(booking.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const end = new Date(booking.endTime).toLocaleString('pt-BR', { timeStyle: 'short' });
    
    // Captura a URL base do site para injetar a logo corretamente na impressão
    const baseUrl = window.location.origin;
    
    // Processamento Dinâmico das Comodidades (Amenities)
    const amenities = booking.room.amenities || [];
    const amenitiesText = amenities.length > 0 ? amenities.join(' • ') : 'Nenhum recurso extra listado';
    const amenitiesLower = amenities.map(a => a.toLowerCase());

    console.log("Room stringfado para PDF:", JSON.stringify(booking.room));

    // Constrói o checklist base
    let checklistHtml = `
      <li><span class="box"></span> Limpeza da sala e alinhamento de <strong style="padding: 0 2px;"> ${booking.room.capacity} cadeiras</strong></li>
      <li><span class="box"></span> Verificação de lixeiras e controle do Ar Condicionado posicionado</li>
    `;

    // Adiciona itens ao checklist baseados no que a sala possui
    if (amenitiesLower.some(a => a.includes('café') || a.includes('água'))) {
      checklistHtml += `<li><span class="box"></span> Preparar garrafa de café fresco, água e copos/xícaras suficientes para ${booking.room.capacity} pessoas</li>`;
    }
    
    if (amenitiesLower.some(a => a.includes('tv') || a.includes('hdmi') || a.includes('vídeo') || a.includes('video'))) {
      checklistHtml += `<li><span class="box"></span> Ligar e testar a TV/Projetor/Videoconferência e verificar se cabos (HDMI) estão na mesa</li>`;
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
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
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
              .card { border-color: #000; background: transparent; }
              .amenities-box { border-color: #000; background: transparent; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <!-- Tenta carregar a imagem, se falhar por causa da rota, não quebra o layout -->
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
          
          <div class="amenities-box">
             <p><strong>Recursos da Sala:</strong> ${amenitiesText}</p>
          </div>

          <h3>Checklist de Preparação Focada:</h3>
          <ul class="checklist">
            ${checklistHtml}
          </ul>

          <div class="footer">
            <div class="signature-line"></div>
            <p style="font-size: 14px; color: #64748b; margin:0;">Assinatura do Responsável (Copa/Apoio)</p>
          </div>
          
          <script>
            // Dá um milissegundo extra para a imagem carregar antes de chamar o painel de impressão
            setTimeout(function() {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const rejectedBookings = bookings.filter(b => b.status === 'REJECTED');

  const currentList = activeTab === 'PENDING' ? pendingBookings : activeTab === 'CONFIRMED' ? confirmedBookings : rejectedBookings;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg" color="gray.800">Visão Geral & Aprovações</Heading>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
        <Card.Root cursor="pointer" onClick={() => setActiveTab('PENDING')} borderWidth="2px" borderColor={activeTab === 'PENDING' ? 'yellow.400' : 'transparent'} bg={activeTab === 'PENDING' ? 'yellow.50' : 'white'}>
          <Card.Body>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="fg.muted" fontSize="sm" fontWeight="medium">Aguardam Aprovação</Text>
                <Heading size="2xl" color="yellow.600">{pendingBookings.length}</Heading>
              </Box>
              <Box p={3} bg="yellow.100" color="yellow.600" borderRadius="md"><LuClock size={24} /></Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Card.Root cursor="pointer" onClick={() => setActiveTab('CONFIRMED')} borderWidth="2px" borderColor={activeTab === 'CONFIRMED' ? 'green.400' : 'transparent'} bg={activeTab === 'CONFIRMED' ? 'green.50' : 'white'}>
          <Card.Body>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="fg.muted" fontSize="sm" fontWeight="medium">Reservas Aprovadas</Text>
                <Heading size="2xl" color="green.600">{confirmedBookings.length}</Heading>
              </Box>
              <Box p={3} bg="green.100" color="green.600" borderRadius="md"><LuCalendarCheck size={24} /></Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Card.Root cursor="pointer" onClick={() => setActiveTab('REJECTED')} borderWidth="2px" borderColor={activeTab === 'REJECTED' ? 'red.400' : 'transparent'} bg={activeTab === 'REJECTED' ? 'red.50' : 'white'}>
          <Card.Body>
            <Flex align="center" justify="space-between">
              <Box>
                <Text color="fg.muted" fontSize="sm" fontWeight="medium">Reservas Rejeitadas</Text>
                <Heading size="2xl" color="red.600">{rejectedBookings.length}</Heading>
              </Box>
              <Box p={3} bg="red.100" color="red.600" borderRadius="md"><LuBan size={24} /></Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

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
                      
                      {activeTab === 'PENDING' && (
                        <Stack direction="row" gap={2} justify="flex-end">
                          <Button size="sm" colorPalette="green" onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')} loading={processingId === booking.id}>
                            <LuCheck /> Aprovar
                          </Button>
                          <Button size="sm" colorPalette="red" variant="outline" onClick={() => handleUpdateStatus(booking.id, 'REJECTED')} loading={processingId === booking.id}>
                            <LuX /> Rejeitar
                          </Button>
                        </Stack>
                      )}

                      {activeTab === 'CONFIRMED' && (
                        <Stack direction="row" gap={2} justify="flex-end" align="center">
                          {/* BOTÃO DO PDF PARA A COPA AQUI */}
                          <Button 
                            size="sm" 
                            colorPalette="blue" 
                            variant="outline"
                            title="Gerar Ordem de Serviço para a Copa"
                            onClick={() => handleGenerateCopaPDF(booking)}
                          >
                            <LuPrinter /> Ordem Copa
                          </Button>
                          
                          <Button size="sm" colorPalette="red" variant="ghost" title="Revogar Aprovação" onClick={() => handleCancelApproved(booking.id)} loading={processingId === booking.id}>
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