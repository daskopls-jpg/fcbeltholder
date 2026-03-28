import { TeamModel } from './models/Team';

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

let hasSeeded = false;

export async function ensureTeamsSeeded() {
  // Prevent multiple concurrent seed attempts
  if (hasSeeded) return;

  try {
    const count = await TeamModel.countDocuments();
    if (count > 0) {
      hasSeeded = true;
      return; // Already seeded
    }

    console.log('📚 Seeding teams database...');

    const teams: Array<{ name: string; country: string; logoUrl: string | null }> = [];

    for (const [country, leagueName] of Object.entries(LEAGUES)) {
      try {
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(leagueName)}`,
          { signal: AbortSignal.timeout(10000) } // 10s timeout per league
        );

        if (!response.ok) continue;

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

        console.log(`  ✓ ${country}: ${leagueTeams.length} teams`);
      } catch (error) {
        console.warn(`  ⚠ ${country}: ${String(error)}`);
      }
    }

    if (teams.length === 0) {
      console.warn('⚠️  No teams fetched, skipping seed');
      return;
    }

    // Remove duplicates
    const seen = new Set<string>();
    const unique = teams.filter((team) => {
      const key = team.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Save to database
    await TeamModel.insertMany(unique);
    console.log(`✅ Seeded ${unique.length} teams`);
    hasSeeded = true;
  } catch (error) {
    console.error('❌ Seed failed:', error);
    // Don't throw, let application continue
  }
}
