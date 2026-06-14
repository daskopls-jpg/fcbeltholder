'use server';

import { connectDB } from '@/lib/mongodb';
import { TierListModel } from '@/lib/models/TierList';
import { DEFAULT_TIERS } from '@/lib/tiers';
import { emptyWorldCupTiers, type TierListMode } from '@/lib/worldCup';
export type { TierListMode } from '@/lib/worldCup';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error('Non autorisé');
}

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

export async function getTierList(mode: TierListMode = 'club'): Promise<Record<string, string[]>> {
  try {
    await connectDB();
    const query =
      mode === 'club'
        ? { $or: [{ mode: 'club' }, { mode: { $exists: false } }] }
        : { mode };
    const doc = await TierListModel.findOne(query).lean();
    if (!doc) return mode === 'club' ? DEFAULT_TIERS : emptyWorldCupTiers();
    return sanitizeTiers(doc.tiers as Record<string, string[]>);
  } catch (error) {
    console.error('Failed to load tier list from MongoDB.', error);
    return mode === 'club' ? DEFAULT_TIERS : emptyWorldCupTiers();
  }
}

export async function saveTierList(
  tiers: Record<string, string[]>,
  mode: TierListMode = 'club'
): Promise<void> {
  await requireAuth();
  await connectDB();
  const sanitized = sanitizeTiers(tiers);
  await TierListModel.findOneAndUpdate({ mode }, { tiers: sanitized, mode }, { upsert: true });
  revalidatePath('/tier-list');
}
