import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
          prompt: "select_account", // <-- ADICIONE ESTA LINHA: Força a Microsoft a perguntar qual conta usar
        },
      },
      // ESTA É A LINHA MÁGICA QUE RESOLVE O SEU ERRO:
      // Permite que o NextAuth junte o login da Microsoft com o usuário "rascunho" que criamos no convite
      allowDangerousEmailAccountLinking: true,
      
      profile(profile) {
        return {
          id: profile.sub || profile.oid,
          name: profile.name,
          email: profile.email || profile.preferred_username || profile.upn,
          image: profile.picture,
          // Definimos um valor padrão, mas o banco vai sobrescrever
          role: 'USER', 
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // 1. Quando o token JWT é criado/atualizado, nós buscamos a role real no banco
    async jwt({ token, user }) {
      if (user && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    // 2. Passamos o ID e a Role do token para a Sessão que o frontend usa
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub; 
        session.user.role = (token.role as 'ADMIN' | 'USER') || 'USER';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};