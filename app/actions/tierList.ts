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
  'AC Milan', 'Atletico Madrid', 'Manchester United', 'Arsenal', 'Tottenham',
  'Napoli', 'Roma', 'Lazio', 'Fiorentina', 'Ajax',
  'PSV Eindhoven', 'Feyenoord', 'Benfica', 'Porto', 'Sporting CP',
  'Sevilla', 'Valencia', 'Villarreal', 'Real Sociedad', 'Athletic Bilbao',
  'Boca Juniors', 'River Plate', 'Flamengo', 'Palmeiras', 'Sao Paulo',
  'Corinthians', 'Gremio', 'Internacional', 'Atletico Mineiro', 'Cruzeiro',
  'Galatasaray', 'Fenerbahce', 'Besiktas', 'Trabzonspor', 'Basaksehir',
  'Celtic', 'Rangers', 'AZ Alkmaar', 'Vitesse',
];

const defaultTiers: Record<string, string[]> = {
  '1': [], '2': [], '3': [], '4': [],
  '5': initialTeams,
  '6': [], '7': [], '8': [], '9': [], '10': [],
};

export async function getTierList(): Promise<Record<string, string[]>> {
  await connectDB();
  const doc = await TierListModel.findOne().lean();
  if (!doc) return defaultTiers;
  return doc.tiers as Record<string, string[]>;
}

export async function saveTierList(tiers: Record<string, string[]>): Promise<void> {
  await requireAuth();
  await connectDB();
  await TierListModel.findOneAndUpdate({}, { tiers }, { upsert: true });
  revalidatePath('/tier-list');
}
