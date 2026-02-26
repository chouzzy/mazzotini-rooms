'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Container, Heading, Table, Badge, Button, Flex, 
  Spinner, Center, Stack, Text, Avatar,
  Dialog, Input, Field
} from '@chakra-ui/react';
import { LuShield, LuUser, LuRefreshCw, LuMailPlus, LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import { toaster } from '@/components/ui/toaster';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: 'USER' | 'ADMIN';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Estados de Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Estados do Modal de Convite
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  // Efeito de Debounce para a busca (Espera 500ms o usuário parar de digitar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Sempre retorna à página 1 ao fazer uma nova pesquisa
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async (page: number, search: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Falha ao carregar utilizadores');
      
      const data = await res.json();
      
      // O backend agora devolve um objeto com paginação
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalUsers(data.total);
    } catch (error) {
      toaster.create({ title: 'Erro ao carregar lista de usuários', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handleRoleChange = async (id: string, newRole: 'USER' | 'ADMIN') => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole }),
      });

      if (!res.ok) throw new Error('Falha na atualização');

      toaster.create({ title: 'Sucesso', description: `Cargo atualizado para ${newRole}.`, type: 'success' });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (error) {
      toaster.create({ title: 'Erro ao processar', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) {
      toaster.create({ title: 'Campos obrigatórios', description: 'Preencha o nome e o e-mail.', type: 'warning' });
      return;
    }

    setInviting(true);
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao convidar');
      }

      toaster.create({
        title: 'Convite Enviado!',
        description: `O associado receberá as instruções em ${inviteEmail}`,
        type: 'success',
      });
      
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      
      // Volta para a primeira página para ver o novo usuário
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchUsers(1, debouncedSearch); 
      }
    } catch (error: any) {
      toaster.create({ title: 'Erro', description: error.message, type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <Box minH="100vh" bg="bg.canvas">
      <Container maxW="6xl" py={8}>
        <Flex justify="space-between" align="center" mb={6} flexWrap={{ base: 'wrap', md: 'nowrap' }} gap={4}>
          <Heading size="lg" whiteSpace="nowrap">Gestão de Usuários</Heading>
          
          {/* Barra de Busca Dinâmica */}
          <Box position="relative" w="full" maxW="400px">
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="fg.muted" zIndex={1}>
              <LuSearch />
            </Box>
            <Input 
              pl={10} 
              placeholder="Buscar por nome ou e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
            />
          </Box>

          <Stack direction="row" gap={2}>
            <Button variant="outline" size="sm" onClick={() => fetchUsers(currentPage, debouncedSearch)} disabled={loading}>
              <LuRefreshCw /> Atualizar
            </Button>
            <Button colorPalette="blue" size="sm" onClick={() => setIsInviteOpen(true)}>
              <LuMailPlus /> Convidar Associado
            </Button>
          </Stack>
        </Flex>

        {loading ? (
          <Center py={20}><Spinner size="xl" color="blue.500" /></Center>
        ) : (
          <Box borderWidth="1px" borderRadius="lg" bg="white" overflowX="auto" p={4}>
            
            <Text fontSize="sm" color="fg.muted" mb={4}>
              Total de usuários cadastrados: <strong>{totalUsers}</strong>
            </Text>

            <Table.Root size="md">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Usuário</Table.ColumnHeader>
                  <Table.ColumnHeader>E-mail</Table.ColumnHeader>
                  <Table.ColumnHeader>Cargo</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell>
                      <Flex align="center" gap={3}>
                        <Avatar.Root size="sm">
                          <Avatar.Fallback name={user.name || 'User'} />
                          <Avatar.Image src={user.image || undefined} />
                        </Avatar.Root>
                        <Text fontWeight="medium">{user.name || 'Sem nome'}</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{user.email}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={user.role === 'ADMIN' ? 'purple' : 'gray'}>
                        {user.role}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      {user.role === 'USER' ? (
                        <Button 
                          size="xs" colorPalette="purple" variant="outline"
                          onClick={() => handleRoleChange(user.id, 'ADMIN')}
                          loading={processingId === user.id}
                        >
                          <LuShield /> Promover a Admin
                        </Button>
                      ) : (
                        <Button 
                          size="xs" colorPalette="gray" variant="outline"
                          onClick={() => handleRoleChange(user.id, 'USER')}
                          loading={processingId === user.id}
                        >
                          <LuUser /> Remover Admin
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
                {users.length === 0 && !loading && (
                  <Table.Row>
                    <Table.Cell colSpan={4} textAlign="center" py={8} color="fg.muted">
                      Nenhum usuário encontrado na busca.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6} pt={4} borderTopWidth="1px">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <LuChevronLeft /> Anterior
                </Button>
                
                <Text fontSize="sm" fontWeight="medium">
                  Página {currentPage} de {totalPages}
                </Text>

                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Próxima <LuChevronRight />
                </Button>
              </Flex>
            )}

          </Box>
        )}

        {/* Modal de Convite de Associado */}
        <Dialog.Root open={isInviteOpen} onOpenChange={(e) => !e.open && setIsInviteOpen(false)}>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Convidar Associado Externo</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger />
              
              <Dialog.Body>
                <Stack gap={4}>
                  <Text fontSize="sm" color="fg.muted" mb={2}>
                    O associado receberá um e-mail oficial da Microsoft com um link seguro para aceitar o convite e acessar o sistema utilizando seu e-mail pessoal.
                  </Text>
                  
                  <Field.Root required>
                    <Field.Label>Nome Completo</Field.Label>
                    <Input 
                      placeholder="Ex: João Associado" 
                      value={inviteName} 
                      onChange={(e) => setInviteName(e.target.value)} 
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>E-mail Pessoal (Gmail, Hotmail, etc.)</Field.Label>
                    <Input 
                      type="email" 
                      placeholder="Ex: joao@gmail.com" 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)} 
                    />
                  </Field.Root>
                </Stack>
              </Dialog.Body>

              <Dialog.Footer mt={4}>
                <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
                <Button colorPalette="blue" onClick={handleInvite} loading={inviting}>
                  Enviar Convite
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

      </Container>
    </Box>
  );
}