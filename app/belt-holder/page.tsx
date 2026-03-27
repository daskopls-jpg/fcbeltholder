export const dynamic = 'force-dynamic';

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
          <p className="status-chip mb-3">Etat Actuel Des Ceintures</p>
          <h1 className="text-4xl md:text-5xl font-bold">Belt Holder</h1>
          <p className="text-slate-300 mt-2 max-w-2xl">
            Retrouvez en un coup d'oeil les detenteurs des ceintures mineure et majeure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {belts.map(({ key, label, data }) => (
            <article key={key} className="glass-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
              {data ? (
                <>
                  <h2 className="text-3xl font-semibold mt-3">{data.winner}</h2>
                  <p className="text-slate-300 mt-2">Depuis le {formatDate(data.date)}</p>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Tournoi de reference</p>
                    <p className="text-base mt-1">{data.name}</p>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 italic mt-3">Aucun tournoi enregistre pour cette ceinture.</p>
              )}
            </article>
          ))}
        </div>

        <div className="glass-panel rounded-2xl p-5 mt-6">
          <p className="text-sm text-slate-300">
            Astuce: pour mettre a jour les champions, ajoutez un nouveau tournoi avec le gagnant sur la page Tournois.
          </p>
        </div>
      </section>
    </main>
  );
}