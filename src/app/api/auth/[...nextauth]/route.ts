import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import { compareSync } from "bcrypt-ts"

const handler = NextAuth({
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
          throw new Error("Email e senha são obrigatórios")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          throw new Error("Usuário não encontrado")
        }

        const isPasswordValid = compareSync(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Senha incorreta")
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name
        }
      }
    })
  ]})

export { handler as GET, handler as POST }