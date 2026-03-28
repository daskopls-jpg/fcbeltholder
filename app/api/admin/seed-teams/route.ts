import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TeamModel } from '@/lib/models/Team';
import { auth } from '@/auth';
import { consumeRateLimit, getClientIp } from '@/lib/security/rateLimit';

interface TheSportsDbTeam {
  strTeam?: string;
  strBadge?: string;
  strTeamBadge?: string;
  strLogo?: string;
}

interface TheSportsDbResponse {
  teams?: TheSportsDbTeam[];
}

const LEAGUES = {
  England: 'English Premier League',
  Portugal: 'Portuguese Primeira Liga',
  France: 'French Ligue 1',
  Germany: 'German Bundesliga',
  Turkey: 'Turkish Super Lig',
  Italy: 'Italian Serie A',
  Spain: 'Spanish La Liga',
  Holland: 'Dutch Eredivisie',
  Belgium: 'Belgian Pro League',
};

async function isAuthorized(request: Request): Promise<boolean> {
  const headerKey = request.headers.get('x-admin-seed-key');
  const envKey = process.env.ADMIN_SEED_KEY;

  if (envKey && headerKey && headerKey === envKey) {
    return true;
  }

  const session = await auth();
  return Boolean(session?.user?.name && session.user.name === process.env.ADMIN_USERNAME);
}

async function seedTeams(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = consumeRateLimit(`admin-seed:${ip}`, 5, 10 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      );
    }

    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const teams: Array<{ name: string; country: string; logoUrl: string | null }> = [];

    for (const [country, leagueName] of Object.entries(LEAGUES)) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(leagueName)}`
        );

        if (!response.ok) {
          console.warn(`Failed to fetch teams for ${country}`);
          continue;
        }

        const payload = (await response.json()) as TheSportsDbResponse;
        const leagueTeams = payload.teams ?? [];

        leagueTeams.forEach((team) => {
          const name = (team.strTeam || '').trim();
          if (name) {
            teams.push({
              name,
              country,
              logoUrl: team.strBadge || team.strTeamBadge || team.strLogo || null,
            });
          }
        });

        console.log(`✓ Fetched ${leagueTeams.length} teams from ${country}`);
      } catch (error) {
        console.error(`Error fetching ${country}:`, error);
      }
    }

    // Remove duplicates
    const seen = new Set<string>();
    const unique = teams.filter((team) => {
      const key = team.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (unique.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No teams fetched from upstream source' },
        { status: 502 }
      );
    }

    const now = new Date();
    await TeamModel.bulkWrite(
      unique.map((team) => ({
        updateOne: {
          filter: { name: team.name },
          update: { $set: { country: team.country, logoUrl: team.logoUrl, updatedAt: now } },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    await TeamModel.deleteMany({
      name: { $nin: unique.map((team) => team.name) },
    });

    const savedCount = await TeamModel.countDocuments();

    console.log(`Total unique teams saved: ${savedCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${savedCount} teams to database`,
      teamCount: savedCount,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  return seedTeams(request);
}
