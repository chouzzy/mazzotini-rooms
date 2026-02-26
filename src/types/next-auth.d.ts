import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Estende a interface Session padrão para incluir o ID do usuário e o Role (Cargo)
   */
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'USER';
    } & DefaultSession["user"]
  }

  interface User {
    role: 'ADMIN' | 'USER';
  }
}