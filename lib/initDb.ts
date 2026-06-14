import { TeamModel } from './models/Team';
import { TierListModel } from './models/TierList';
import { DEFAULT_TIERS } from './tiers';

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

// Minimal default world-cup tiers used only for initial seeding when DB is empty.
// For initial seeding ensure we include the full 48-team list.
const DEFAULT_WORLD_CUP_TIERS: Record<string, string[]> = {
  '1': [],
  '2': [],
  '3': [],
  '4': [],
  '5': [
    'Argentine','Australie','Algérie','Allemagne','Angleterre','Arabie Saoudite','Autriche','Belgique',
    'Bosnie-Herzégovine','Brésil','Canada','Cap-Vert','Colombie','Côte d\'Ivoire','Corée du Sud','Croatie',
    'Curaçao','Égypte','Écosse','Équateur','Espagne','France','Ghana','Haïti',
    'Irak','Iran','Japon','Jordanie','Maroc','Mexique','Norvège','Nouvelle-Zélande',
    'Pays-Bas','Panama','Paraguay','Portugal','Qatar','République tchèque','RD Congo','Sénégal',
    'Suède','Suisse','Tunisie','Turquie','Afrique du Sud','États-Unis','Ouzbékistan','Uruguay',
  ],
  '6': [],
  '7': [],
  '8': [],
  '9': [],
  '10': [],
};

async function fetchNationalTeamLogo(teamName: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as TheSportsDbResponse;
    const teams = payload.teams ?? [];
    const normalizedQuery = teamName.toLowerCase().trim();
    const exactMatch = teams.find((team) =>
      (team.strTeam || '').toLowerCase().trim() === normalizedQuery
    );

    const selected = exactMatch || teams[0];
    return selected ? selected.strBadge || selected.strTeamBadge || selected.strLogo || null : null;
  } catch {
    return null;
  }
}

let hasSeeded = false;

export async function ensureTeamsSeeded() {
  // Prevent multiple concurrent seed attempts
  if (hasSeeded) return;

  try {
    const teamCount = await TeamModel.countDocuments();
    const clubTierExists = await TierListModel.exists({ mode: 'club' });
    const worldCupTierExists = await TierListModel.exists({ mode: 'worldCup2026' });

    if (!clubTierExists) {
      console.log('📚 Seeding default club tier list document...');
      await TierListModel.create({ tiers: DEFAULT_TIERS, mode: 'club' });
    }

    if (!worldCupTierExists) {
      console.log('📚 Seeding default CDM 2026 tier list document...');
      await TierListModel.create({ tiers: DEFAULT_WORLD_CUP_TIERS, mode: 'worldCup2026' });
    }

    if (teamCount === 0) {
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
      } else {
        const seen = new Set<string>();
        const unique = teams.filter((team) => {
          const key = team.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        await TeamModel.insertMany(unique);
        console.log(`✅ Seeded ${unique.length} teams`);
      }
    }

    // World Cup tiers and national teams should be managed from the DB/admin UI.
    // Ensure national teams referenced by the initial world-cup tiers exist in the DB.
    const worldCupTeams = Array.from(new Set(Object.values(DEFAULT_WORLD_CUP_TIERS).flat()));
    const existingWorldCupTeams = await TeamModel.find({ name: { $in: worldCupTeams } }).lean();
    const missingWorldCupTeams = worldCupTeams.filter(
      (team) => !existingWorldCupTeams.some((existing) => existing.name === team)
    );

    if (missingWorldCupTeams.length > 0) {
      await TeamModel.insertMany(
        missingWorldCupTeams.map((name) => ({ name, country: 'International', logoUrl: null }))
      );
      console.log(`✅ Seeded ${missingWorldCupTeams.length} missing national teams`);
    }

    // Attempt to fetch logos for national teams that lack one.
    const nationalTeamsWithoutLogo = await TeamModel.find({
      name: { $in: worldCupTeams },
      $or: [{ logoUrl: null }, { logoUrl: '' }],
    }).lean();

    for (const team of nationalTeamsWithoutLogo) {
      const logoUrl = await fetchNationalTeamLogo(team.name);
      if (logoUrl) {
        await TeamModel.updateOne({ _id: team._id }, { logoUrl });
        console.log(`  ✓ Found logo for national team ${team.name}`);
      }
    }

    // Ensure the world-cup tier document contains exactly the seeded 48 world cup teams.
    {
      const doc = await TierListModel.findOne({ mode: 'worldCup2026' }).lean();
      const current = doc?.tiers ?? DEFAULT_WORLD_CUP_TIERS;
      const worldCupSet = new Set(worldCupTeams);

      const next: Record<string, string[]> = {};
      for (let i = 1; i <= 10; i++) {
        const key = String(i);
        const arr = Array.isArray(current[key]) ? current[key] : [];
        next[key] = arr.filter((name) => !worldCupSet.has(name));
      }

      next['5'] = [...worldCupTeams];

      await TierListModel.findOneAndUpdate({ mode: 'worldCup2026' }, { tiers: next, mode: 'worldCup2026' }, { upsert: true });
      console.log(`Reset worldCup2026 tier 5 to ${worldCupTeams.length} seeded teams.`);
    }

    hasSeeded = true;
  } catch (error) {
    console.error('❌ Seed failed:', error);
    // Don't throw, let application continue
  }
}

