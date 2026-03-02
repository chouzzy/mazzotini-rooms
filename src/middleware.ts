import { withAuth } from "next-auth/middleware";

// O withAuth envolve todo o sistema e verifica se existe uma sessão válida
export default withAuth({
  pages: {
    signIn: '/login', // Se não estiver logado, manda para cá!
  },
});

export const config = {
  // O matcher define QUAIS rotas vão exigir login.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (a página de login)
     * - api/auth (rotas do NextAuth)
     * - api/upload (rotas públicas de API)
     * - _next/static (arquivos estáticos do Next)
     * - _next/image (imagens otimizadas)
     * - favicon.ico (ícone do site)
     * - Qualquer arquivo terminando em .png, .jpg, .jpeg, .svg
     */
    "/((?!login|api/auth|api/upload|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg)$).*)",
  ]
};