import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 10 * 60 * 1000;
const authAttempts = new Map<string, { count: number; resetAt: number }>();

function isLocked(username: string): boolean {
  const entry = authAttempts.get(username);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    authAttempts.delete(username);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function trackFailure(username: string): void {
  const now = Date.now();
  const current = authAttempts.get(username);
  if (!current || current.resetAt <= now) {
    authAttempts.set(username, { count: 1, resetAt: now + LOCK_WINDOW_MS });
    return;
  }
  current.count += 1;
}

function clearFailures(username: string): void {
  authAttempts.delete(username);
}

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
        const username = String(credentials?.username || '');

        if (!username || isLocked(username)) {
          return null;
        }

        if (
          username === adminUser &&
          credentials?.password === adminPass
        ) {
          clearFailures(username);
          return { id: '1', name: adminUser as string };
        }

        trackFailure(username);
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
});
