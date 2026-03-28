export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentById } from '../../actions/tournaments';

export const metadata: Metadata = {
  title: 'Détail du Tournoi',
  description: 'Consultez le détail complet d un tournoi.',
};

const formatDate = (value: string) => {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    notFound();
  }

  const creator = tournament.creatorData;
  const renderTeamWithOwner = (team: string | null, ownerIsWinner = false) => {
    if (!team || !creator) return team ?? 'À définir';
    const owner = creator.teamsByPlayer.Maxime.includes(team)
      ? 'Maxime'
      : creator.teamsByPlayer.Damien.includes(team)
        ? 'Damien'
        : null;
    return owner ? (
      <>
        <span className="font-bold">{team}</span> (<span className={ownerIsWinner ? 'font-bold' : 'font-medium'}>{owner}</span>)
      </>
    ) : (
      <span className="font-bold">{team}</span>
    );
  };

  const renderWinnerWithTeam = (team: string | null) => {
    if (!team || !creator) return team ?? 'Non défini';
    const owner = creator.teamsByPlayer.Maxime.includes(team)
      ? 'Maxime'
      : creator.teamsByPlayer.Damien.includes(team)
        ? 'Damien'
        : null;
    return owner ? (
      <>
        <span className="font-bold">{owner}</span> (<span className="font-bold">{team}</span>)
      </>
    ) : (
      <span className="font-bold">{team}</span>
    );
  };

  return (
    <main className="px-4 pb-10 pt-8 md:pt-10">
      <section className="section-shell space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="status-chip mb-2">Détail tournoi</p>
            <h1 className="text-3xl md:text-5xl font-bold">{tournament.name}</h1>
          </div>
          <Link href="/tournaments" className="outline-btn px-4 py-2 text-sm">
            Retour aux tournois
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="rounded-xl border border-white/15 bg-black/20 p-3">
            <p className="text-sm text-slate-300">Date</p>
            <p className="font-semibold text-white">{formatDate(tournament.date)}</p>
          </article>
          <article className="rounded-xl border border-white/15 bg-black/20 p-3">
            <p className="text-sm text-slate-300">Type</p>
            <p className="font-semibold text-white">{tournament.type === 'Minor' ? 'Mineur' : tournament.type === 'Major' ? 'Majeur' : tournament.type}</p>
          </article>
          <article className="rounded-xl border border-white/15 bg-black/20 p-3 md:col-span-2">
            <p className="text-sm text-slate-300">Participants</p>
            <p className="font-semibold text-white">{tournament.participants.join(', ') || '—'}</p>
          </article>
          <article className="rounded-xl border border-white/15 bg-black/20 p-3 md:col-span-2">
            <p className="text-sm text-slate-300">Gagnant</p>
            <p className="font-semibold text-white">{tournament.winner || '—'}</p>
          </article>
        </div>

        {creator && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <article className="rounded-xl border border-white/15 bg-black/20 p-3 md:col-span-2">
                <p className="text-sm text-slate-300">Tiers bannis</p>
                <p className="font-semibold text-white">
                  {creator.bannedTiers.length > 0
                    ? creator.bannedTiers.map((tier) => `Tier ${tier}`).join(', ')
                    : 'Aucun'}
                </p>
              </article>
              <article className="rounded-xl border border-white/15 bg-black/20 p-3 md:col-span-2">
                <p className="text-sm text-slate-300">Équipes bannies</p>
                <p className="font-semibold text-white">
                  {creator.bannedTeams.length > 0 ? creator.bannedTeams.join(', ') : 'Aucune'}
                </p>
              </article>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/15 bg-black/20 p-3">
                <p className="text-sm font-semibold mb-3 text-slate-100">Quarts de finale</p>
                <div className="space-y-3">
                  {creator.quarterFinals.map((match, index) => (
                    <div key={`qf-${index}`} className="rounded-lg border border-white/15 p-2">
                      <p className="text-xs text-slate-400 mb-2">QF {index + 1}</p>
                      {[match.left, match.right].map((team, i) => (
                        <p
                          key={`${team ?? 'empty'}-${i}`}
                          className={`px-2 py-1 rounded text-sm mb-1 last:mb-0 border ${
                            match.winner === team
                              ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                              : 'border-white/15 text-slate-200'
                          }`}
                        >
                          {renderTeamWithOwner(team, match.winner === team)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-black/20 p-3">
                <p className="text-sm font-semibold mb-3 text-slate-100">Demi-finales</p>
                <div className="space-y-3">
                  {creator.semiFinals.map((match, index) => (
                    <div key={`sf-${index}`} className="rounded-lg border border-white/15 p-2">
                      <p className="text-xs text-slate-400 mb-2">SF {index + 1}</p>
                      {[match.left, match.right].map((team, i) => (
                        <p
                          key={`${team ?? 'semi-empty'}-${i}`}
                          className={`px-2 py-1 rounded text-sm mb-1 last:mb-0 border ${
                            match.winner === team
                              ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                              : 'border-white/15 text-slate-200'
                          }`}
                        >
                          {renderTeamWithOwner(team, match.winner === team)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-black/20 p-3">
                <p className="text-sm font-semibold mb-3 text-slate-100">Finale</p>
                <div className="rounded-lg border border-white/15 p-2 mb-3">
                  {[creator.final.left, creator.final.right].map((team, index) => (
                    <p
                      key={`${team ?? 'final-empty'}-${index}`}
                      className={`px-2 py-1 rounded text-sm mb-1 last:mb-0 border ${
                        creator.final.winner === team
                          ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                          : 'border-white/15 text-slate-200'
                      }`}
                    >
                      {renderTeamWithOwner(team, creator.final.winner === team)}
                    </p>
                  ))}
                </div>

                <div className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 p-3">
                  <p className="text-xs text-slate-300 uppercase tracking-wide mb-1">Vainqueur</p>
                  <p className="text-lg font-semibold text-white">
                    {renderWinnerWithTeam(creator.final.winner)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
