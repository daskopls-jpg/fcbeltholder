import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Nom d\'utilisateur', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (
          credentials?.username === adminUser &&
          credentials?.password === adminPass
        ) {
          return { id: '1', name: adminUser as string };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
});
