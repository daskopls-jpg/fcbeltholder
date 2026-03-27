export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getTournaments } from '../actions/tournaments';

const formatDate = (dateString: string) =>
  new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR');

export default async function BeltHolder() {
  const tournaments = await getTournaments();

  const getLatest = (type: 'Minor' | 'Major') => {
    const relevant = tournaments
      .filter((t) => t.type === type && t.winner)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return relevant[0] ?? null;
  };

  const minor = getLatest('Minor');
  const major = getLatest('Major');

  const belts = [
    { key: 'Minor', label: 'Ceinture Mineure', data: minor },
    { key: 'Major', label: 'Ceinture Majeure', data: major },
  ];

  return (
    <main className="px-4 pb-10 pt-8 md:pt-10">
      <section className="section-shell">
        <div className="mb-7">
          <p className="status-chip mb-3">Détenteurs des ceintures</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {belts.map(({ key, label, data }) => (
            <article key={key} className="glass-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
              {data ? (
                <>
                  <h2 className="text-3xl font-semibold mt-3">{data.winner}</h2>
                  <p className="text-slate-300 mt-2">Depuis le {formatDate(data.date)}</p>
                  <Link href="/tournaments" className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 block cursor-pointer transition hover:border-white/20 hover:bg-white/10">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Tournoi de reference</p>
                    <p className="text-base mt-1">{data.name}</p>
                  </Link>
                </>
              ) : (
                <p className="text-slate-400 italic mt-3">Aucun tournoi enregistre pour cette ceinture.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}