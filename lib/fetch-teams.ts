// This is a utility to fetch teams from TheSportsDB for specific countries
// Run this once to generate the teams in database

interface TheSportsDbTeam {
  strTeam?: string;
  strBadge?: string;
  strTeamBadge?: string;
  strLogo?: string;
}

interface TheSportsDbResponse {
  teams?: TheSportsDbTeam[];
}

import { connectDB } from './mongodb';
import { TeamModel } from './models/Team';

// First-division league names from TheSportsDB
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

export async function fetchTeamsFromSportsDb() {
  // Connect to MongoDB
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

  // Clear existing teams and save new ones
  await TeamModel.deleteMany({});
  const saved = await TeamModel.insertMany(unique);

  console.log(`\nTotal unique teams saved: ${saved.length}`);
  return saved;
}

// For running as a script in Node.js
if (require.main === module) {
  fetchTeamsFromSportsDb().then((teams) => {
    console.log(JSON.stringify(teams, null, 2));
  });
}
