'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pt } from 'date-fns/locale/pt'; // Localização em Português
import { Box, Spinner, Center, Text,  } from '@chakra-ui/react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuração do localizador (datas em PT)
const locales = {
  'pt': pt,
};

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

export default function RoomCalendar() {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(Views.WEEK); // Vista padrão: Semana

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (!res.ok) throw new Error('Falha ao carregar agendamentos');
        const data = await res.json();

        // Mapear dados da API para o formato do react-big-calendar
        const formattedEvents = data.map((booking: any) => ({
          id: booking.id,
          title: `${booking.title} (${booking.room.name})`, // Mostra Título + Sala
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
      <Center p={10}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box 
      height="600px" 
      bg="white" 
      p={4} 
      borderRadius="lg" 
      borderWidth="1px"
      css={{
        /* Personalização básica do calendário para combinar com o Chakra */
        '.rbc-calendar': { fontFamily: 'inherit' },
        '.rbc-event': { backgroundColor: '#3182ce' },
        '.rbc-today': { backgroundColor: '#f7fafc' },
        '.rbc-header': { padding: '8px', fontWeight: 'bold', color: 'gray.600' }
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture="pt" // Define a cultura para Português
        view={view}
        onView={setView} // Permite alternar entre Mês, Semana, Dia
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
        onSelectEvent={(event) => alert(`Evento: ${event.title}`)} // Exemplo de interação
      />
    </Box>
  );
}