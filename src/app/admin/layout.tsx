import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Box, Container, Alert, AlertTitle, AlertDescription, Flex } from "@chakra-ui/react"; // Chakra v3 updates below
import { AdminSidebar } from "@/components/AdminSideBar";
import Navbar from "@/components/Navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pega a sessão diretamente no lado do servidor (Super seguro)
  const session = await getServerSession(authOptions);

  // Se não estiver logado, ou se a role NÃO FOR ADMIN, joga para a Home
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Se for ADMIN, renderiza a página normalmente
  return (
    <Flex flexDir={'column'} minH="100vh" bg="gray.50" w='100%'>
      <AdminSidebar />
      {/* Conteúdo Principal (empurrado 250px para a direita) */}
      <Box ml="250px" p={8}>
        {children}
      </Box>
    </Flex>
  )
}