import { withAuth } from "next-auth/middleware";

// O withAuth envolve todo o sistema e verifica se existe uma sessão válida
export default withAuth({
  pages: {
    signIn: '/login', // Se não estiver logado, manda para cá!
  },
});

export const config = {
  // O matcher define QUAIS rotas vão exigir login.
  // Protegemos tudo, EXCETO a página de login, arquivos públicos e as rotas internas de autenticação/upload.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (a página de login)
     * - api/auth (rotas do NextAuth)
     * - api/upload (caso o upload do S3 precise rodar sem auth estrita temporariamente)
     * - _next/static (arquivos estáticos)
     * - _next/image (imagens otimizadas)
     * - favicon.ico (ícone do site)
     */
    "/((?!login|api/auth|api/upload|_next/static|_next/image|favicon.ico).*)",
  ]
};