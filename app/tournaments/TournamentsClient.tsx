'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { deleteTournament } from '../actions/tournaments';
import type { ITournament } from '../../lib/models/Tournament';

const formatDate = (dateString: string) =>
  new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR');

const formatType = (type: string) =>
  type === 'Minor' ? 'Mineur' : type === 'Major' ? 'Majeur' : 'Créateur';

interface Props {
  initialTournaments: ITournament[];
}

export default function TournamentsClient({ initialTournaments }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = !!session;
  const [tournaments, setTournaments] = useState<ITournament[]>(initialTournaments);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const sortedTournaments = [...tournaments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((tournament) => {
      const query = searchQuery.toLowerCase();
      return tournament.name.toLowerCase().includes(query);
    });

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('Supprimer ce tournoi ?');
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteTournament(id);
        setTournaments((prev) => prev.filter((t) => t._id !== id));
      } catch (error) {
        console.error('Failed to delete tournament.', error);
      }
    });
  };

  return (
    <main className="px-4 pb-10 pt-8 md:pt-10">
      <section className="section-shell">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
          <div>
            <p className="status-chip mb-2">Base De Matchs</p>
            <h1 className="text-4xl md:text-5xl font-bold">Historique des Tournois</h1>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher un tournoi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="surface-input w-full md:w-80"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedTournaments.map((tournament) => (
            <article
              key={tournament._id}
              className="glass-panel rounded-2xl p-5 cursor-pointer"
              onClick={() => tournament._id && router.push(`/tournaments/${tournament._id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{tournament.name}</h2>
                  <p className="text-slate-300 text-sm mt-1">{formatDate(tournament.date)}</p>
                </div>
                <span className="status-chip">{formatType(tournament.type)}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <p>
                  Gagnant: <span className="font-semibold">{tournament.winner || '—'}</span>
                </p>
                <p>Participants: {tournament.participants.join(', ')}</p>
              </div>
              {isAdmin && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tournament._id) handleDelete(tournament._id);
                    }}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[var(--danger)] text-white font-semibold hover:brightness-105 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
