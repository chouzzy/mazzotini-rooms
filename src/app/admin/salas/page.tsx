import { Box, Heading, Text, Table, Badge, Button, Flex, Stack } from '@chakra-ui/react'
import { prisma } from '@/lib/prisma'

// Força a página a ser dinâmica (sempre busca dados novos no banco)
export const dynamic = 'force-dynamic' 

export default async function AdminSalasPage() {
  let rooms: any[] = [];
  let connectionError = false;

  try {
      rooms = await prisma.room.findMany({
        orderBy: { name: 'asc' }
      })
  } catch (error) {
      console.error("Erro crítico ao conectar no MongoDB:", error);
      connectionError = true;
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="brand.900">Gerenciar Salas</Heading>
          <Text color="gray.600">Visualize e edite as salas de reunião.</Text>
        </Box>
        <Button colorPalette="brand" size="sm" disabled={connectionError}>
          + Nova Sala
        </Button>
      </Flex>

      {/* Alerta de Erro Visual (Só aparece se o banco falhar) */}
      {connectionError && (
        <Box 
          p={4} 
          mb={6} 
          bg="red.50" 
          border="1px solid" 
          borderColor="red.200" 
          borderRadius="md" 
          color="red.700"
        >
          <Text fontWeight="bold" display="flex" alignItems="center" gap={2}>
            ⚠️ Erro de Conexão com o Banco de Dados
          </Text>
          <Text fontSize="sm" mt={1}>
            O sistema não conseguiu carregar a lista de salas. Isso geralmente é temporário.
            <br/>
            Se o erro persistir, verifique a Whitelist de IP no MongoDB Atlas.
          </Text>
        </Box>
      )}

      <Box bg="white" borderRadius="md" boxShadow="sm" overflow="hidden">
        <Table.Root interactive>
          <Table.Header>
            <Table.Row bg="brand.50">
              <Table.ColumnHeader>Nome</Table.ColumnHeader>
              <Table.ColumnHeader>Capacidade</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Ações</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {!connectionError && rooms.map((room) => (
              <Table.Row key={room.id}>
                <Table.Cell fontWeight="medium">{room.name}</Table.Cell>
                <Table.Cell>{room.capacity} pessoas</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={room.isActive ? 'green' : 'red'}>
                    {room.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="end">
                  <Button size="xs" variant="ghost" colorPalette="blue">Editar</Button>
                </Table.Cell>
              </Table.Row>
            ))}
            
            {/* Estado Vazio (Sem erro, mas sem dados) */}
            {!connectionError && rooms.length === 0 && (
               <Table.Row>
                 <Table.Cell colSpan={4} textAlign="center" py={10} color="gray.500">
                   Nenhuma sala encontrada no sistema.
                 </Table.Cell>
               </Table.Row>
            )}

            {/* Estado de Erro na Tabela */}
            {connectionError && (
               <Table.Row>
                 <Table.Cell colSpan={4} textAlign="center" py={10} color="red.400">
                   Não foi possível carregar os dados.
                 </Table.Cell>
               </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  )
}