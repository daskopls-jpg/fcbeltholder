export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getTierList } from '../actions/tierList';
import TournamentCreatorClient from './TournamentCreatorClient';

export const metadata: Metadata = {
  title: 'Générateur de tournois FC',
  description: 'Créez un tournoi étape par étape avec bans, draft et arbre final.',
};

export default async function TournamentCreatorPage() {
  const session = await auth();
  if (!session) {
    redirect('/login?callbackUrl=/tournament-creator');
  }

  const tiers = await getTierList();
  return <TournamentCreatorClient tiers={tiers} />;
}
