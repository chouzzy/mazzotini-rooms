'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, Badge, Menu, Portal, Button, Dialog,
  Stack, Separator, Icon, IconButton
} from '@chakra-ui/react';
import { LuBell, LuCalendarCheck, LuCalendarX, LuCalendarClock, LuRefreshCcw, LuCheckCheck } from 'react-icons/lu';
import { useSession } from 'next-auth/react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  bookingId?: string;
  forAdmin: boolean;
  read: boolean;
  createdAt: string;
}

interface NotificationBody {
  userName?: string;
  roomName?: string;
  startTime?: string;
  endTime?: string;
  requestedStart?: string;
  requestedEnd?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  NEW_BOOKING:              { icon: LuCalendarClock,  color: 'blue',   label: 'Nova Solicitação'          },
  BOOKING_CONFIRMED:        { icon: LuCalendarCheck,  color: 'green',  label: 'Reserva Aprovada'          },
  BOOKING_REJECTED:         { icon: LuCalendarX,      color: 'red',    label: 'Reserva Recusada'          },
  BOOKING_CANCELLED_BY_USER:{ icon: LuCalendarX,      color: 'gray',   label: 'Reserva Cancelada'         },
  RESCHEDULE_REQUESTED:     { icon: LuRefreshCcw,     color: 'cyan',   label: 'Pedido de Remanejamento'   },
  RESCHEDULE_APPROVED:      { icon: LuCalendarCheck,  color: 'green',  label: 'Remanejamento Aprovado'    },
  RESCHEDULE_REJECTED:      { icon: LuCalendarX,      color: 'orange', label: 'Remanejamento Recusado'    },
};

const formatRelative = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `Há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Ontem';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatDateTime = (dt?: string) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
  });
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60000);
    return () => clearInterval(id);
  }, [session, fetchNotifications]);

  const unread = notifications.filter(n => !n.read).length;

  const markOne = async (n: Notification) => {
    if (!n.read) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    setSelected(n);
    setDialogOpen(true);
  };

  const markAll = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications(prev => prev.map(x => ({ ...x, read: true })));
  };

  if (!session) return null;

  const cfg = selected ? (TYPE_CONFIG[selected.type] ?? TYPE_CONFIG['NEW_BOOKING']) : null;
  let parsedBody: NotificationBody = {};
  if (selected) {
    try { parsedBody = JSON.parse(selected.body); } catch { /* ok */ }
  }

  return (
    <>
      {/* ── SINO ── */}
      <Menu.Root>
        <Menu.Trigger asChild>
          <Box position="relative" cursor="pointer" p={1}>
            <IconButton variant="ghost" size="sm" aria-label="Notificações">
              <LuBell size={20} />
            </IconButton>
            {unread > 0 && (
              <Badge
                position="absolute" top="0" right="0"
                colorPalette="red" borderRadius="full"
                fontSize="2xs" minW="18px" h="18px"
                display="flex" alignItems="center" justifyContent="center"
                pointerEvents="none"
              >
                {unread > 9 ? '9+' : unread}
              </Badge>
            )}
          </Box>
        </Menu.Trigger>

        <Portal>
          <Menu.Positioner>
            <Menu.Content
              w="360px" maxH="480px" overflowY="auto"
              bg="bg.panel" borderWidth="1px" borderColor="border.muted"
              borderRadius="xl" shadow="2xl" p={0}
            >
              {/* Cabeçalho */}
              <Flex px={4} py={3} justify="space-between" align="center" borderBottomWidth="1px" borderColor="border.muted">
                <Text fontWeight="bold" fontSize="sm">Notificações</Text>
                {unread > 0 && (
                  <Button size="xs" variant="ghost" colorPalette="blue" onClick={markAll} gap={1}>
                    <LuCheckCheck size={13} /> Marcar todas lidas
                  </Button>
                )}
              </Flex>

              {notifications.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={10} gap={2} color="fg.muted">
                  <LuBell size={28} />
                  <Text fontSize="sm">Nenhuma notificação</Text>
                </Flex>
              ) : (
                notifications.map((n) => {
                  const c = TYPE_CONFIG[n.type] ?? TYPE_CONFIG['NEW_BOOKING'];
                  return (
                    <Menu.Item
                      key={n.id}
                      value={n.id}
                      onClick={() => markOne(n)}
                      px={4} py={3}
                      bg={n.read ? 'transparent' : `${c.color}.950`}
                      _hover={{ bg: 'bg.subtle' }}
                      cursor="pointer"
                      borderBottomWidth="1px"
                      borderColor="border.muted"
                    >
                      <Flex gap={3} align="flex-start" w="full">
                        <Box
                          p={1.5} borderRadius="md" flexShrink={0} mt={0.5}
                          bg={`${c.color}.900`} color={`${c.color}.300`}
                        >
                          <Icon as={c.icon} boxSize={4} />
                        </Box>
                        <Box flex={1} overflow="hidden">
                          <Text
                            fontSize="sm" fontWeight={n.read ? 'normal' : 'semibold'}
                            color={n.read ? 'fg.muted' : 'fg.DEFAULT'}
                            lineClamp={2}
                          >
                            {n.title}
                          </Text>
                          <Text fontSize="xs" color="fg.muted" mt={0.5}>
                            {formatRelative(n.createdAt)}
                          </Text>
                        </Box>
                        {!n.read && (
                          <Box w="2" h="2" borderRadius="full" bg={`${c.color}.400`} flexShrink={0} mt={1.5} />
                        )}
                      </Flex>
                    </Menu.Item>
                  );
                })
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {/* ── DIALOG DE DETALHE ── */}
      <Dialog.Root open={dialogOpen} onOpenChange={(e) => !e.open && setDialogOpen(false)}>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(2px)" />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" shadow="2xl" bg="bg.panel" maxW="lg">
            {cfg && selected && (
              <>
                <Dialog.Header pb={0}>
                  <Flex align="center" gap={3}>
                    <Box p={2} bg={`${cfg.color}.900`} color={`${cfg.color}.300`} borderRadius="lg">
                      <Icon as={cfg.icon} boxSize={5} />
                    </Box>
                    <Box>
                      <Dialog.Title fontSize="md" color="fg.DEFAULT">{cfg.label}</Dialog.Title>
                      <Text fontSize="xs" color="fg.muted">{formatRelative(selected.createdAt)}</Text>
                    </Box>
                  </Flex>
                </Dialog.Header>

                <Dialog.Body pt={4} pb={6}>
                  <Text fontSize="sm" fontWeight="semibold" color="fg.DEFAULT" mb={4}>
                    {selected.title}
                  </Text>

                  <Stack gap={0} bg="bg.subtle" borderRadius="lg" borderWidth="1px" borderColor="border.muted" overflow="hidden">
                    {parsedBody.roomName && (
                      <Flex px={4} py={3} justify="space-between" borderBottomWidth="1px" borderColor="border.muted">
                        <Text fontSize="sm" color="fg.muted">Espaço</Text>
                        <Text fontSize="sm" fontWeight="medium">{parsedBody.roomName}</Text>
                      </Flex>
                    )}
                    {parsedBody.userName && (
                      <Flex px={4} py={3} justify="space-between" borderBottomWidth="1px" borderColor="border.muted">
                        <Text fontSize="sm" color="fg.muted">Solicitante</Text>
                        <Text fontSize="sm" fontWeight="medium">{parsedBody.userName}</Text>
                      </Flex>
                    )}
                    {parsedBody.startTime && (
                      <Flex px={4} py={3} justify="space-between" borderBottomWidth="1px" borderColor="border.muted">
                        <Text fontSize="sm" color="fg.muted">Início</Text>
                        <Text fontSize="sm" fontWeight="medium">{formatDateTime(parsedBody.startTime as string)}</Text>
                      </Flex>
                    )}
                    {parsedBody.endTime && (
                      <Flex px={4} py={3} justify="space-between"
                        borderBottomWidth={parsedBody.requestedStart ? '1px' : '0px'}
                        borderColor="border.muted"
                      >
                        <Text fontSize="sm" color="fg.muted">Fim</Text>
                        <Text fontSize="sm" fontWeight="medium">{formatDateTime(parsedBody.endTime as string)}</Text>
                      </Flex>
                    )}
                    {parsedBody.requestedStart && (
                      <>
                        <Separator />
                        <Flex px={4} py={2} align="center">
                          <Text fontSize="xs" color="blue.400" fontWeight="bold" textTransform="uppercase">
                            Novo horário solicitado
                          </Text>
                        </Flex>
                        <Flex px={4} py={3} justify="space-between" borderTopWidth="1px" borderColor="border.muted">
                          <Text fontSize="sm" color="fg.muted">Início</Text>
                          <Text fontSize="sm" fontWeight="medium">{formatDateTime(parsedBody.requestedStart as string)}</Text>
                        </Flex>
                        <Flex px={4} py={3} justify="space-between" borderTopWidth="1px" borderColor="border.muted">
                          <Text fontSize="sm" color="fg.muted">Fim</Text>
                          <Text fontSize="sm" fontWeight="medium">{formatDateTime(parsedBody.requestedEnd as string)}</Text>
                        </Flex>
                      </>
                    )}
                  </Stack>
                </Dialog.Body>

                <Dialog.Footer borderTopWidth="1px" borderColor="border.muted" borderBottomRadius="xl">
                  <Button variant="solid" colorPalette="gray" onClick={() => setDialogOpen(false)}>
                    Fechar
                  </Button>
                </Dialog.Footer>
              </>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
