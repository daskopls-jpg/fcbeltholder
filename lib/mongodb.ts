import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Cache the connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongooseConn) return global._mongooseConn;

  const shouldAutoSeedTeams = process.env.AUTO_SEED_TEAMS !== 'false';

  global._mongooseConn = mongoose
    .connect(MONGODB_URI)
    .then(async (conn) => {
      // Auto-seed on connect unless explicitly disabled.
      if (shouldAutoSeedTeams) {
        const { ensureTeamsSeeded } = await import('./initDb');
        ensureTeamsSeeded().catch((error) => {
          console.error('Failed to seed teams:', error);
        });
      }
      return conn;
    });
  return global._mongooseConn;
}
