import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment.');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to DB');
    const db = client.db();
    const tierColl = db.collection('tierlists');
    const teamColl = db.collection('teams');

    const tierDoc = await tierColl.findOne({ mode: 'worldCup2026' });
    if (!tierDoc) {
      console.log('No worldCup2026 tier document found.');
    } else {
      console.log('worldCup2026 tier document found. Tier keys:', Object.keys(tierDoc.tiers || {}));
      const sample = {};
      for (const k of Object.keys(tierDoc.tiers || {}).slice(0, 10)) {
        sample[k] = (tierDoc.tiers || {})[k] ?? [];
      }
      console.log('Sample tiers (first keys):', sample);
    }

    const totalTeams = await teamColl.countDocuments();
    console.log('Total teams in DB:', totalTeams);

    const wcTeams = await teamColl.find({ country: 'International' }).limit(50).toArray();
    console.log('Sample international teams:', wcTeams.map(t => ({ name: t.name, logoUrl: t.logoUrl })).slice(0, 20));

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Inspect failed:', err);
    try { await client.close(); } catch {}
    process.exit(1);
  }
}

main();
