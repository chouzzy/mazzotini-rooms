'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views, EventProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pt } from 'date-fns/locale/pt'; // Localização em Português
import { 
  Box, Spinner, Center, Dialog, Text, Flex, Heading, Stack, Badge, Separator 
} from '@chakra-ui/react';
import { LuClock, LuDoorOpen, LuUser } from 'react-icons/lu';
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
  
  // Cores fortes que contrastam bem no Dark Mode
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
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de Navegação e Visualização
  const [view, setView] = useState<View>(Views.WEEK); 
  const [date, setDate] = useState<Date>(new Date()); // <-- NOVO ESTADO: Controla a data atual
  
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
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
    <Box 
      height={{ base: "700px", md: "85vh" }}
      w="100%"
      p={{ base: 2, md: 4 }} 
      css={{
        '& .rbc-calendar': { 
          fontFamily: 'inherit',
          color: 'var(--chakra-colors-gray-100)',
          backgroundColor: 'transparent',
        },
        /* Toolbar (Botões de Navegação) */
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

        /* =========== MAGIA DO DARK MODE (FIM DAS LINHAS BRANCAS) =========== */
        
        /* Grid Principal e Bordas Externas */
        '& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view': {
          borderRadius: '12px',
          border: '1px solid var(--chakra-colors-gray-700)',
          overflow: 'hidden',
          backgroundColor: 'var(--chakra-colors-gray-900)',
          boxShadow: 'var(--chakra-shadows-md)',
        },
        /* Cabeçalho dos dias da semana */
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
        /* Bordas internas verticais (Dias e Colunas) */
        '& .rbc-day-bg + .rbc-day-bg, & .rbc-month-row + .rbc-month-row': {
          borderColor: 'var(--chakra-colors-gray-700)',
        },
        '& .rbc-time-content > * + * > *': {
          borderColor: 'var(--chakra-colors-gray-700)',
        },
        /* Bordas internas horizontais (Horas e Meia-Horas) */
        '& .rbc-timeslot-group': {
          borderBottom: '1px solid var(--chakra-colors-gray-700)',
        },
        '& .rbc-time-slot': {
          borderTop: '1px solid var(--chakra-colors-gray-700) !important', // Mata a linha branca da meia hora
        },
        '& .rbc-day-slot .rbc-time-slot': {
          borderTop: '1px dotted var(--chakra-colors-gray-700)', // Linha pontilhada suave na meia hora
        },
        '& .rbc-time-header-content': {
          borderLeft: '1px solid var(--chakra-colors-gray-700)',
        },
        '& .rbc-time-header-gutter': {
          borderBottom: '1px solid var(--chakra-colors-gray-700)',
        },
        /* Linha indicadora do horário atual */
        '& .rbc-current-time-indicator': {
          backgroundColor: 'var(--chakra-colors-red-500)',
          height: '2px',
        },
        /* Destaque para o Dia de Hoje */
        '& .rbc-today': { 
          backgroundColor: 'var(--chakra-colors-whiteAlpha-50)',
        },
        '& .rbc-time-header .rbc-today': {
          color: 'var(--chakra-colors-brand-300)',
          backgroundColor: 'var(--chakra-colors-whiteAlpha-50)',
        },

        /* =========== AJUSTES DOS EVENTOS =========== */
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
        date={date} // <-- PROPRIEDADE ADICIONADA
        onNavigate={(newDate) => setDate(newDate)} // <-- FUNÇÃO DE NAVEGAÇÃO ADICIONADA
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

      {/* MODAL DE DETALHES DO EVENTO (DARK MODE ADAPTADO) */}
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
  );
}