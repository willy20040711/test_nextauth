import NextAuth from "next-auth"
import "next-auth/jwt"
import CognitoProvider from 'next-auth/providers/cognito';
import { SupabaseAdapter } from "@auth/supabase-adapter"


export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { logo: "https://authjs.dev/img/logo-sm.png" },
  adapter: SupabaseAdapter({
    url: 'supabase_url',
    secret:'supabase_secret',
  }),
  providers: [
    CognitoProvider({
      clientId: 'COGNITO_CLIENT_ID',
      clientSecret: 'COGNITO_CLIENT_SECRET',
      issuer: 'COGNITO_ISSUER',
      authorization: { params: { scope: 'openid email' } },
    }),
  ],
  basePath: "/auth",
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname === "/middleware-example") return !!auth
      return true
    },
    jwt({ token, trigger, session, account }) {
      if (trigger === "update") token.name = session.user.name
      if (account?.provider === "keycloak") {
        return { ...token, accessToken: account.access_token }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.accessToken) session.accessToken = token.accessToken

      return session
    },
  },
  experimental: { enableWebAuthn: true },
})

declare module "next-auth" {
  interface Session {
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
  }
}
