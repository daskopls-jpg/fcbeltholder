'use server';

import { connectDB } from '@/lib/mongodb';
import { TierListModel } from '@/lib/models/TierList';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error('Non autorisé');
}

const initialTeams = [
  'Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Chelsea',
  'Bayern Munich', 'Borussia Dortmund', 'Paris Saint-Germain', 'Juventus', 'Inter Milan',
];

const defaultTiers: Record<string, string[]> = {
  '1': [], '2': [], '3': [], '4': [],
  '5': initialTeams,
  '6': [], '7': [], '8': [], '9': [], '10': [],
};

function sanitizeTiers(tiers: Record<string, string[]>): Record<string, string[]> {
  const cleaned: Record<string, string[]> = {
    '1': [], '2': [], '3': [], '4': [], '5': [],
    '6': [], '7': [], '8': [], '9': [], '10': [],
  };

  const seen = new Set<string>();

  for (let i = 1; i <= 10; i++) {
    const key = String(i);
    const teams = Array.isArray(tiers[key]) ? tiers[key] : [];
    cleaned[key] = teams.filter((team) => {
      if (typeof team !== 'string' || !team.trim() || seen.has(team)) return false;
      seen.add(team);
      return true;
    });
  }

  return cleaned;
}

export async function getTierList(): Promise<Record<string, string[]>> {
  await connectDB();
  const doc = await TierListModel.findOne().lean();
  if (!doc) return defaultTiers;
  return sanitizeTiers(doc.tiers as Record<string, string[]>);
}

export async function saveTierList(tiers: Record<string, string[]>): Promise<void> {
  await requireAuth();
  await connectDB();
  const sanitized = sanitizeTiers(tiers);
  await TierListModel.findOneAndUpdate({}, { tiers: sanitized }, { upsert: true });
  revalidatePath('/tier-list');
}
