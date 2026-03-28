const endpoint = process.env.SEED_ENDPOINT || 'http://localhost:3000/api/admin/seed-teams';
const seedKey = process.env.ADMIN_SEED_KEY;

if (!seedKey) {
  console.error('Missing ADMIN_SEED_KEY in environment.');
  process.exit(1);
}

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-admin-seed-key': seedKey,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Seed request failed:', response.status, payload);
    process.exit(1);
  }

  console.log(JSON.stringify(payload, null, 2));
} catch (error) {
  console.error('Seed request error:', error);
  process.exit(1);
}
