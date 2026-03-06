'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views, EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pt } from 'date-fns/locale/pt'; 
import { 
  Box, Spinner, Center, Dialog, Text, Flex, Heading, Stack, Badge, Separator, Button 
} from '@chakra-ui/react';
import { LuClock, LuDoorOpen, LuUser, LuPrinter } from 'react-icons/lu';
import { useSession } from 'next-auth/react';
import { toaster } from '@/components/ui/toaster';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'pt': pt };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

// COMPONENTE CUSTOMIZADO PARA O BLOCO DO EVENTO
const CustomEvent = ({ event }: EventProps<BookingEvent>) => {
  const isPending = event.resource?.status === 'PENDING';
  
  const bgColor = isPending ? 'orange.500' : 'brand.600';
  const borderColor = isPending ? 'orange.700' : 'brand.800';
  const textColor = isPending ? 'gray.900' : 'white';

  return (
    <Box 
      bg={bgColor} 
      color={textColor} 
      h="100%" 
      w="100%" 
      borderRadius="md" 
      p={1.5} 
      borderLeft="4px solid" 
      borderLeftColor={borderColor}
      boxShadow="sm"
      _hover={{ filter: 'brightness(1.1)' }}
      transition="all 0.2s"
      overflow="hidden"
    >
      <Text fontSize="xs" fontWeight="bold" lineClamp={1} lineHeight="1">
        {event.title}
      </Text>
      <Text fontSize="2xs" opacity={0.9} mt={1} lineClamp={1}>
        {event.resource?.room?.name}
      </Text>
    </Box>
  );
};

export default function RoomCalendar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<View>(Views.WEEK); 
  const [date, setDate] = useState<Date>(new Date()); 
  
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings?all=true'); // Traz todos para montar o relatório se for admin
        if (!res.ok) throw new Error('Falha ao carregar agendamentos');
        const data = await res.json();

        const validBookings = data.filter((b: any) => b.status !== 'REJECTED' && b.status !== 'CANCELLED');

        const formattedEvents = validBookings.map((booking: any) => ({
          id: booking.id,
          title: booking.title, 
          start: new Date(booking.startTime),
          end: new Date(booking.endTime),
          resource: booking,
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // ----------------------------------------------------------------
  // RELATÓRIO DIÁRIO (COPA) - GERAÇÃO DO PDF
  // ----------------------------------------------------------------
  const handlePrintDailyReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toaster.create({ title: 'Aviso', description: 'Por favor, permita pop-ups no seu navegador.', type: 'warning' });
      return;
    }

    const targetDateStr = format(date, 'yyyy-MM-dd');
    
    // Filtra os eventos APENAS DO DIA SELECIONADO e que já estejam APROVADOS
    const dailyEvents = events.filter(e => {
      const eventDateStr = format(e.start, 'yyyy-MM-dd');
      return eventDateStr === targetDateStr && e.resource.status === 'CONFIRMED';
    });

    // Ordena por horário
    dailyEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    const baseUrl = window.location.origin;
    const dataFormatada = format(date, "dd/MM/yyyy");

    // Monta as linhas da tabela
    const rowsHtml = dailyEvents.length > 0 ? dailyEvents.map(e => {
      const startStr = format(e.start, 'HH:mm');
      const participant = e.resource.user?.name || e.resource.user?.email || 'Desconhecido';
      const roomName = e.resource.room?.name || 'Desconhecida';

      // Lógica de extração dos Convidados do formato JSON para String (Nome1 / Nome2)
      let guestStr = 'Sem convidados externos';
      if (e.resource.guests) {
        try {
          const parsed = JSON.parse(e.resource.guests);
          if (parsed && parsed.length > 0) {
            guestStr = parsed.map((g: any) => g.name || g.email).join(' / ');
          }
        } catch(err) {
          console.error("Erro ao parsear convidados", err);
        }
      }

      return `
        <tr>
          <td style="text-align: center;">${dataFormatada}</td>
          <td style="text-align: center; font-weight: bold;">${startStr}</td>
          <td>${participant}</td>
          <td>${guestStr}</td>
          <td>${roomName}</td>
        </tr>
      `;
    }).join('') : `<tr><td colSpan="5" style="text-align:center; padding: 20px; color: #64748b;">Nenhuma reunião agendada para este dia.</td></tr>`;

    // Template HTML idêntico à necessidade corporativa
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório da Copa - ${dataFormatada}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 1000px; margin: 0 auto; background: #fff; }
            .header-container { display: flex; align-items: center; border-bottom: 3px solid #c7823c; padding-bottom: 15px; margin-bottom: 30px; }
            .logo { height: 60px; margin-right: 20px; }
            .header-titles { flex: 1; text-align: center; }
            h1 { color: #1e293b; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            h2 { color: #64748b; font-size: 16px; margin: 5px 0 0 0; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px 10px; font-size: 14px; }
            th { background-color: #f1f5f9; color: #334155; font-weight: bold; text-transform: uppercase; text-align: left; }
            th:nth-child(1), th:nth-child(2) { text-align: center; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: right; }
            @media print {
              @page { margin: 1cm; size: landscape; } /* Paisagem para caber melhor os dados */
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <img src="${baseUrl}/logo.png" class="logo" onerror="this.style.display='none'" alt="Logo" />
            <div class="header-titles">
              <h1>Agenda Diária (Copa / Apoio)</h1>
              <h2>Mazzotini Advogados Associados — <strong>Referência: ${dataFormatada}</strong></h2>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="12%">Data</th>
                <th width="10%">Horário</th>
                <th width="25%">Participante (Solicitante)</th>
                <th width="33%">Convidado(s)</th>
                <th width="20%">Sala</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Relatório gerado pelo sistema Mazzotini Rooms em ${new Date().toLocaleString('pt-BR')}
          </div>

          <script>setTimeout(function() { window.print(); }, 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };


  if (loading) {
    return (
      <Center p={10} minH="60vh">
        <Stack align="center" gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="fg.muted">Montando calendário...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box w="full">
      {/* HEADER DE AÇÕES: Apenas Admin vê o botão de gerar relatório */}
      {isAdmin && (
        <Flex justify="flex-end" mb={4}>
          <Button 
            colorPalette="purple" 
            size="sm" 
            onClick={handlePrintDailyReport}
            shadow="md"
          >
            <LuPrinter /> Relatório Diário da Copa ({format(date, "dd/MM")})
          </Button>
        </Flex>
      )}

      <Box 
        height={{ base: "700px", md: "80vh" }}
        w="100%"
        p={{ base: 2, md: 4 }} 
        css={{
          '& .rbc-calendar': { 
            fontFamily: 'inherit',
            color: 'var(--chakra-colors-gray-100)',
            backgroundColor: 'transparent',
          },
          '& .rbc-toolbar': { 
            flexWrap: 'wrap', 
            gap: '12px', 
            justifyContent: 'space-between',
            marginBottom: '20px',
          },
          '& .rbc-toolbar button': { 
            fontSize: { base: '12px', md: '14px' }, 
            padding: { base: '6px 12px', md: '6px 16px' },
            borderRadius: '8px',
            border: '1px solid var(--chakra-colors-gray-600)',
            backgroundColor: 'transparent',
            color: 'var(--chakra-colors-gray-200)',
            fontWeight: '500',
            transition: 'all 0.2s ease',
          },
          '& .rbc-toolbar button:hover': {
            backgroundColor: 'var(--chakra-colors-whiteAlpha-200)',
          },
          '& .rbc-toolbar button.rbc-active': {
            backgroundColor: 'var(--chakra-colors-brand-600)',
            borderColor: 'var(--chakra-colors-brand-500)',
            color: 'white',
            boxShadow: 'var(--chakra-shadows-md)',
          },
          '& .rbc-toolbar-label': {
            fontWeight: 'bold',
            fontSize: { base: '16px', md: '20px' },
            textTransform: 'capitalize',
          },

          /* Grid Principal e Bordas Externas */
          '& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view': {
            borderRadius: '12px',
            border: '1px solid var(--chakra-colors-gray-700)',
            overflow: 'hidden',
            backgroundColor: 'var(--chakra-colors-gray-900)',
            boxShadow: 'var(--chakra-shadows-md)',
          },
          '& .rbc-header': { 
            padding: '12px 4px', 
            fontWeight: '600', 
            color: 'var(--chakra-colors-gray-300)',
            borderBottom: '1px solid var(--chakra-colors-gray-700)',
            borderLeft: '1px solid var(--chakra-colors-gray-700)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          },
          '& .rbc-header + .rbc-header': {
            borderLeft: '1px solid var(--chakra-colors-gray-700)',
          },
          '& .rbc-day-bg + .rbc-day-bg, & .rbc-month-row + .rbc-month-row': {
            borderColor: 'var(--chakra-colors-gray-700)',
          },
          '& .rbc-time-content > * + * > *': {
            borderColor: 'var(--chakra-colors-gray-700)',
          },
          '& .rbc-timeslot-group': {
            borderBottom: '1px solid var(--chakra-colors-gray-700)',
          },
          '& .rbc-time-slot': {
            borderTop: '1px solid var(--chakra-colors-gray-700) !important', 
          },
          '& .rbc-day-slot .rbc-time-slot': {
            borderTop: '1px dotted var(--chakra-colors-gray-700)', 
          },
          '& .rbc-time-header-content': {
            borderLeft: '1px solid var(--chakra-colors-gray-700)',
          },
          '& .rbc-time-header-gutter': {
            borderBottom: '1px solid var(--chakra-colors-gray-700)',
          },
          '& .rbc-current-time-indicator': {
            backgroundColor: 'var(--chakra-colors-red-500)',
            height: '2px',
          },
          '& .rbc-today': { 
            backgroundColor: 'var(--chakra-colors-whiteAlpha-50)',
          },
          '& .rbc-time-header .rbc-today': {
            color: 'var(--chakra-colors-brand-300)',
            backgroundColor: 'var(--chakra-colors-whiteAlpha-50)',
          },
          '& .rbc-event': { 
            backgroundColor: 'transparent',
            padding: '0',
            border: 'none',
          },
          '& .rbc-event:focus': {
            outline: 'none'
          }
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture="pt"
          view={view}
          onView={setView} 
          date={date} 
          onNavigate={(newDate) => setDate(newDate)} 
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Sem eventos neste período.",
          }}
          components={{
            event: CustomEvent 
          }}
          onSelectEvent={(event) => setSelectedEvent(event)} 
        />

        {/* MODAL DE DETALHES DO EVENTO */}
        <Dialog.Root open={!!selectedEvent} onOpenChange={(e) => !e.open && setSelectedEvent(null)}>
          <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="xl" shadow="2xl" bg="bg.panel">
              <Dialog.CloseTrigger />
              {selectedEvent && (
                <Box p={6}>
                  <Box mb={5}>
                    <Badge 
                      colorPalette={selectedEvent.resource.status === 'CONFIRMED' ? 'green' : 'yellow'} 
                      mb={3}
                      size="md"
                      variant="solid"
                    >
                      {selectedEvent.resource.status === 'CONFIRMED' ? 'Aprovada' : 'Aguardando Aprovação'}
                    </Badge>
                    <Heading size="xl" lineHeight="1.2" color="fg.DEFAULT">
                      {selectedEvent.title}
                    </Heading>
                  </Box>

                  <Separator mb={5} borderColor="border.muted" />

                  <Stack gap={4}>
                    <Flex align="center" gap={3}>
                      <Box p={2} bg="whiteAlpha.200" borderRadius="md" color="fg.DEFAULT">
                        <LuDoorOpen size={20} />
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="fg.muted" fontWeight="bold" textTransform="uppercase">Espaço</Text>
                        <Text fontWeight="medium" color="fg.DEFAULT">{selectedEvent.resource?.room?.name}</Text>
                      </Box>
                    </Flex>

                    <Flex align="center" gap={3}>
                      <Box p={2} bg="brand.900" borderRadius="md" color="brand.200">
                        <LuClock size={20} />
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="fg.muted" fontWeight="bold" textTransform="uppercase">Horário</Text>
                        <Text fontWeight="medium" color="fg.DEFAULT">
                          {format(selectedEvent.start, "dd 'de' MMMM, HH:mm", { locale: pt })} - {format(selectedEvent.end, "HH:mm")}
                        </Text>
                      </Box>
                    </Flex>

                    <Flex align="center" gap={3}>
                      <Box p={2} bg="whiteAlpha.200" borderRadius="md" color="fg.DEFAULT">
                        <LuUser size={20} />
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="fg.muted" fontWeight="bold" textTransform="uppercase">Reservado por</Text>
                        <Text fontWeight="medium" color="fg.DEFAULT">
                          {selectedEvent.resource?.user?.name || selectedEvent.resource?.user?.email || 'Usuário Desconhecido'}
                        </Text>
                      </Box>
                    </Flex>
                  </Stack>
                </Box>
              )}
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

      </Box>
    </Box>
  );
}