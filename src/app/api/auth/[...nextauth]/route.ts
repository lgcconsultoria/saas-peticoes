import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compareSync } from "bcrypt-ts"

// Estender os tipos do NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
  }
}

const handler = NextAuth({
  debug: true,
  pages: {
    signIn: "/"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Email" },
        password: { label: "Password", type: "password", placeholder: "Password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credenciais incompletas");
          throw new Error("Email e senha são obrigatórios");
        }

        console.log(`Tentativa de login para: ${credentials.email}`);
        
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          console.log(`Usuário não encontrado: ${credentials.email}`);
          throw new Error("Usuário não encontrado");
        }

        console.log(`Usuário encontrado: ${user.email}, verificando senha...`);
        
        const isPasswordHashed = user.password.startsWith('$2') && user.password.length > 50;
        console.log(`Senha está em formato hash: ${isPasswordHashed}`);
        
        if (!isPasswordHashed) {
          console.log("AVISO: A senha no banco de dados não parece estar em formato hash!");
        }
        
        const isPasswordValid = compareSync(credentials.password, user.password);
        console.log(`Senha válida: ${isPasswordValid}`);

        if (!isPasswordValid) {
          throw new Error("Senha incorreta");
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
});

export { handler as GET, handler as POST }