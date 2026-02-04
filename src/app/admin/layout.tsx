import { AdminSidebar } from '@/components/AdminSideBar'
import { Box } from '@chakra-ui/react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Sidebar Fixa */}
      <AdminSidebar />

      {/* Conteúdo Principal (empurrado 250px para a direita) */}
      <Box ml="250px" p={8}>
        {children}
      </Box>
    </Box>
  )
}