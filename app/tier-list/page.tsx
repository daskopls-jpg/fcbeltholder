export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import TierListClient from './TierListClient';
import { getTierList } from '../actions/tierList';

export const metadata: Metadata = {
  title: "Évaluateur d'Équipes FC (1-10)",
  description: 'Classez vos équipes FC de 1 à 10 par glisser-déposer.',
};

export default async function TierListPage() {
  const initialTiers = await getTierList();
  return <TierListClient initialTiers={initialTiers} />;
}