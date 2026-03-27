export const dynamic = 'force-dynamic';

import { getTournaments } from '../actions/tournaments';
import TournamentsClient from './TournamentsClient';

export default async function TournamentsPage() {
  const tournaments = await getTournaments();
  return <TournamentsClient initialTournaments={tournaments} />;
}
