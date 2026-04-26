import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
      })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt' },
    callbacks: {
      async signIn({ user, account }) {
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
          await fetch(`${apiBase}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              avatar: user.image,
              googleId: account?.providerAccountId
            })
          });
        } catch (error) {
          console.error('Could not sync Google user with API', error);
        }
        return true;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).id = token.sub;
        }
        return session;
      }
    },
    pages: { signIn: '/signin' }
  });
}
