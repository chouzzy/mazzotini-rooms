'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Table, Badge, Button, Flex, 
  Spinner, Center, Stack, Text, Avatar, Dialog, Input, Field
} from '@chakra-ui/react';
import { LuShield, LuUser, LuRefreshCw, LuMailPlus, LuChevronLeft, LuChevronRight, LuSearch, LuStar } from "react-icons/lu";
import { toaster } from '@/components/ui/toaster';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: 'USER' | 'ADMIN';
  isVip: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async (page: number, search: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Falha ao carregar utilizadores');
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalUsers(data.total);
    } catch (error) {
      toaster.create({ title: 'Erro ao carregar lista', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(currentPage, debouncedSearch); }, [currentPage, debouncedSearch]);

  const handleUpdateUser = async (id: string, payload: any) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) throw new Error('Falha na atualização');
      toaster.create({ title: 'Sucesso', description: `Usuário atualizado.`, type: 'success' });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...payload } : u));
    } catch (error) {
      toaster.create({ title: 'Erro ao processar', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) return toaster.create({ title: 'Campos obrigatórios', type: 'warning' });
    setInviting(true);
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      });
      if (!res.ok) throw new Error('Erro ao convidar');
      toaster.create({ title: 'Convite Enviado!', type: 'success' });
      setIsInviteOpen(false); setInviteEmail(''); setInviteName('');
      fetchUsers(1, debouncedSearch); 
    } catch (error: any) {
      toaster.create({ title: 'Erro', description: error.message, type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <Box minH="100vh" bg="bg.canvas">
      <Container py={8}>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} mb={6} flexDir={{ base: 'column', md: 'row' }} gap={4}>
          <Heading size={{ base: 'md', md: 'lg' }} color="fg.DEFAULT">Gestão de Usuários</Heading>
          <Box position="relative" w="full" maxW={{ base: 'full', md: '400px' }}>
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="fg.muted" zIndex={1}><LuSearch /></Box>
            <Input 
              pl={10} 
              size="sm" 
              placeholder="Buscar por nome ou e-mail..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              bg="bg.canvas"
              borderColor="border.muted"
              color="fg.DEFAULT"
            />
          </Box>
          <Stack direction="row" gap={2} w={{ base: 'full', md: 'auto' }}>
            <Button variant="solid" size="sm" onClick={() => fetchUsers(currentPage, debouncedSearch)} disabled={loading} color="fg.DEFAULT" borderColor="border.muted">
              <LuRefreshCw /> Atualizar
            </Button>
            <Button colorPalette="blue" size="sm" onClick={() => setIsInviteOpen(true)}>
              <LuMailPlus /> Convidar
            </Button>
          </Stack>
        </Flex>

        {loading ? (
          <Center py={20}><Spinner size="xl" color="brand.500" /></Center>
        ) : (
          <Flex flexDir={'column'} w='100%'  borderRadius="lg" overflowX="auto" p={{ base: 2, md: 4 }}>
            <Text fontSize="xs" color="fg.muted" mb={4} px={2}>Total de usuários: <strong style={{ color: 'var(--chakra-colors-fg-DEFAULT)' }}>{totalUsers}</strong></Text>
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader whiteSpace="nowrap" color="fg.muted">Usuário</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap" color="fg.muted">E-mail</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap" color="fg.muted">Status</Table.ColumnHeader>
                  <Table.ColumnHeader whiteSpace="nowrap" textAlign="right" color="fg.muted">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell whiteSpace="nowrap">
                      <Flex align="center" gap={3}>
                        <Avatar.Root size="xs" bgColor={user.isVip ? 'yellow.600' : user.role === 'ADMIN' ? 'purple.600' : 'gray.600'}>
                          <Avatar.Fallback name={user.name || 'User'} color="brand.50" />
                          <Avatar.Image src={user.image || undefined} />
                        </Avatar.Root>
                        <Text fontWeight="medium" fontSize="sm" color="fg.DEFAULT">{user.name || 'Sem nome'}</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap" color="fg.muted" fontSize="sm">{user.email}</Table.Cell>
                    <Table.Cell whiteSpace="nowrap">
                      <Flex gap={2}>
                        <Badge size="sm" colorPalette={user.role === 'ADMIN' ? 'purple' : 'cyan'} variant="solid">{user.role}</Badge>
                        {user.isVip && <Badge size="sm" colorPalette="yellow" variant="solid"><LuStar style={{ marginRight: '2px' }}/> VIP</Badge>}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap" textAlign="right">
                      <Stack direction="row" gap={2} justify="flex-end">
                        <Button 
                          size="xs" colorPalette={user.isVip ? "orange" : "yellow"} variant="solid"
                          onClick={() => handleUpdateUser(user.id, { isVip: !user.isVip })}
                          loading={processingId === user.id}
                        >
                          <LuStar /> {user.isVip ? 'Remover VIP' : 'Tornar VIP'}
                        </Button>
                        <Button 
                          size="xs" colorPalette={user.role === 'ADMIN' ? "cyan" : "purple"} variant="solid"
                          onClick={() => handleUpdateUser(user.id, { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                          loading={processingId === user.id}
                          minW={40}
                        >
                          {user.role === 'ADMIN' ? <LuUser /> : <LuShield />}
                          {user.role === 'ADMIN' ? 'Remover Admin' : 'Promover Admin'}
                        </Button>
                      </Stack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>

            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6} pt={4} borderTopWidth="1px" borderColor="border.muted" flexWrap="wrap" gap={3}>
                <Button size="xs" variant="outline" color="fg.DEFAULT" borderColor="border.muted" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><LuChevronLeft /> Anterior</Button>
                <Text fontSize="xs" fontWeight="medium" color="fg.muted">Página {currentPage} de {totalPages}</Text>
                <Button size="xs" variant="outline" color="fg.DEFAULT" borderColor="border.muted" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima <LuChevronRight /></Button>
              </Flex>
            )}
          </Flex>
        )}

        {/* MODAL DE CONVITE DARK MODE */}
        <Dialog.Root open={isInviteOpen} onOpenChange={(e) => !e.open && setIsInviteOpen(false)}>
          <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content mx={4} bg="bg.panel" borderRadius="xl" shadow="2xl">
              <Dialog.Header>
                <Dialog.Title color="fg.DEFAULT">Convidar Associado</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body pb={4}>
                <Stack gap={4}>
                  <Field.Root required>
                    <Field.Label color="fg.DEFAULT">Nome Completo</Field.Label>
                    <Input 
                      size="sm" 
                      value={inviteName} 
                      onChange={(e) => setInviteName(e.target.value)} 
                      bg="bg.canvas"
                      borderColor="border.muted"
                      color="fg.DEFAULT"
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label color="fg.DEFAULT">E-mail</Field.Label>
                    <Input 
                      size="sm" 
                      type="email" 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)} 
                      bg="bg.canvas"
                      borderColor="border.muted"
                      color="fg.DEFAULT"
                    />
                  </Field.Root>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer mt={2} bg="whiteAlpha.50" borderTopWidth="1px" borderColor="border.muted" borderBottomRadius="xl">
                <Button variant="ghost" size="sm" color="fg.muted" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
                <Button colorPalette="blue" size="sm" onClick={handleInvite} loading={inviting}>Enviar Convite</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Container>
    </Box>
  );
}