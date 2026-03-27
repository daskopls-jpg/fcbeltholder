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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Belt Holder</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Détenteurs actuels</h2>
          <div className="space-y-4">
            {belts.map(({ key, label, data }) => (
              <div key={key} className="border p-4 rounded">
                <h3 className="text-xl font-medium">{label}</h3>
                {data ? (
                  <>
                    <p>Détenteur : <span className="font-semibold">{data.winner}</span></p>
                    <p>Depuis : {formatDate(data.date)} ({data.name})</p>
                  </>
                ) : (
                  <p className="text-gray-400 italic">Aucun tournoi enregistré.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}