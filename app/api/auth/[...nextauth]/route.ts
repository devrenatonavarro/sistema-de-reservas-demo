import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text", placeholder: "admin" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Buscar usuario en la base de datos
          const user = await prisma.user.findUnique({
            where: { username: credentials.username }
          })

          if (!user) {
            return null
          }

          // Verificar contraseña
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        } catch (error) {
          console.error('Error en autenticación:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in user) {
        token.role = user.role as string
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token.role) {
        (session.user as any).role = token.role
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
