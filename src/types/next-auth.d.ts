import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Estende a interface Session padrão para incluir o ID do usuário
   * Isso permite acessar session.user.id sem erro de tipagem
   */
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}