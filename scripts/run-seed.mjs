import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment.');
  process.exit(1);
}

const DEFAULT_WORLD_CUP_TIERS = {
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

async function fetchNationalTeamLogo(teamName) {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const teams = payload.teams || [];
    if (!teams.length) return null;
    const normalized = teamName.toLowerCase().trim();
    const exact = teams.find((t) => (t.strTeam || '').toLowerCase().trim() === normalized);
    const sel = exact || teams[0];
    return sel.strBadge || sel.strTeamBadge || sel.strLogo || null;
  } catch {
    return null;
  }
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db();
    const tierColl = db.collection('tierlists');
    const teamColl = db.collection('teams');

    const existing = await tierColl.findOne({ mode: 'worldCup2026' });
    if (!existing) {
      console.log('Seeding worldCup2026 tier document...');
      await tierColl.insertOne({ tiers: DEFAULT_WORLD_CUP_TIERS, mode: 'worldCup2026', createdAt: new Date() });
    } else {
      console.log('worldCup2026 tier document already exists, skipping tier defaults.');
    }

    const worldCupTeams = Array.from(new Set(Object.values(DEFAULT_WORLD_CUP_TIERS).flat()));
    const existingTeams = await teamColl.find({ name: { $in: worldCupTeams } }).project({ name: 1 }).toArray();
    const existingNames = new Set(existingTeams.map((t) => t.name));
    const missing = worldCupTeams.filter((t) => !existingNames.has(t));
    if (missing.length) {
      console.log(`Inserting ${missing.length} missing national teams...`);
      await teamColl.insertMany(missing.map((name) => ({ name, country: 'International', logoUrl: null, createdAt: new Date() })));
    } else {
      console.log('All national teams already present.');
    }

    // Try to fetch logos for teams without one
    const teamsWithoutLogo = await teamColl.find({ name: { $in: worldCupTeams }, $or: [{ logoUrl: null }, { logoUrl: '' }] }).toArray();
    for (const team of teamsWithoutLogo) {
      const logo = await fetchNationalTeamLogo(team.name);
      if (logo) {
        await teamColl.updateOne({ _id: team._id }, { $set: { logoUrl: logo } });
        console.log(`Fetched logo for ${team.name}`);
      }
    }

    console.log('Seeding completed.');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    try { await client.close(); } catch {}
    process.exit(1);
  }
}

main();
