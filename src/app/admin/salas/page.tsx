import { Box, Heading, Text, Table, Badge, Button, Flex } from '@chakra-ui/react'
import { prisma } from '@/lib/prisma' // Importamos nossa conexão direta

export const dynamic = 'force-dynamic' // Garantir que a página seja sempre renderizada dinamicamente
// Server Component: A função é async para poder esperar o banco de dados
export default async function AdminSalasPage() {
  // 1. Busca os dados no Banco (Server-side)
  // Isso acontece antes da página chegar no navegador do usuário!
  const rooms = await prisma.room.findMany({
    orderBy: { name: 'asc' } // Ordenado por nome
  })

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="brand.900">Gerenciar Salas</Heading>
          <Text color="gray.600">Visualize e edite as salas de reunião.</Text>
        </Box>
        <Button colorPalette="brand" size="sm">
          + Nova Sala
        </Button>
      </Flex>

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
            {rooms.map((room) => (
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
            
            {rooms.length === 0 && (
               <Table.Row>
                 <Table.Cell colSpan={4} textAlign="center" py={10}>
                   Nenhuma sala encontrada.
                 </Table.Cell>
               </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  )
}