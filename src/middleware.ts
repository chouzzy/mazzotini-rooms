export { default } from "next-auth/middleware";

export const config = {
  // Protege estas rotas. Se não estiver logado, manda pro login.
  matcher: [
    "/minhas-reservas", 
    "/calendario",
    "/api/bookings/:path*" // Protege API de agendamentos (exceto GET se for público)
  ],
};