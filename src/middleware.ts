import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: '/login', // Diz ao middleware para onde mandar quem não está logado
  },
});

export const config = {
  // O matcher define QUAIS rotas vão exigir login.
  // Regra de Ouro: NUNCA coloque "/login" ou "/api/auth/:path*" aqui dentro!
  matcher: [
    // Se quiser que o sistema seja 100% fechado (inclusive a Home), descomente a linha abaixo:
    // "/", 
    
    "/minhas-reservas/:path*", 
    "/calendario/:path*",
    "/admin/:path*",
    
    // Protege também as rotas da API (exceto a de autenticação e upload)
    "/api/bookings/:path*",
    "/api/rooms/:path*",
  ]
};