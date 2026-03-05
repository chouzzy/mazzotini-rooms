import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Box, Flex } from "@chakra-ui/react";
import { AdminSidebar } from "@/components/AdminSideBar";

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
    <Flex minH="100vh" w="100%" color={'fg.DEFAULT'}>
      <Box 
        flex="1" 
        // Padding menor no celular para ganhar espaço
        p={{ base: 4, md: 8 }}
        w="full"
      >
        {children}
      </Box>
    </Flex>
  );
}