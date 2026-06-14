import React from 'react';

interface TierEntry { tier: string; teams: string[] }

interface Props {
  isThreePlayer: boolean;
  tournamentName: string;
  setTournamentName: (v: string) => void;
  tournamentType: 'Minor' | 'Major' | 'Ceinture Unifiée';
  setTournamentType: (v: 'Minor' | 'Major' | 'Ceinture Unifiée') => void;
  date: string;
  setDate: (v: string) => void;
  players: string[];
  tierEntries: TierEntry[];
  bannedTiers: string[];
  toggleTierBan: (t: string) => void;
}

export default function InfoStep({ isThreePlayer, tournamentName, setTournamentName, tournamentType, setTournamentType, date, setDate, players, tierEntries, bannedTiers, toggleTierBan }: Props) {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-5">
      <h2 className="text-2xl font-semibold">Étape 2 - {isThreePlayer ? 'Infos, joueurs et bans' : 'Infos et bans'}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Nom du tournoi</label>
          <input
            className="surface-input"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Ex: Ligue de Printemps"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Type du tournoi</label>
          {isThreePlayer ? (
            <div className="surface-input opacity-70 flex items-center h-[42px]">Ceinture Unifiée</div>
          ) : (
            <select className="surface-input h-[42px]" value={tournamentType} onChange={(e) => setTournamentType(e.target.value as 'Minor'|'Major')}>
              <option value="Minor">Mineur</option>
              <option value="Major">Majeur</option>
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Date</label>
          <input className="surface-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {isThreePlayer && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {players.map((player) => (
            <div key={player} className="rounded-2xl border border-white/15 bg-black/20 p-3 text-center">
              <p className="text-sm text-slate-300">Joueur</p>
              <p className="mt-2 text-lg font-semibold text-white">{player}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Bannir des tiers</h3>
        <div className="flex flex-wrap gap-2">
          {tierEntries.map(({ tier, teams }) => {
            const active = bannedTiers.includes(tier);
            return (
              <button
                key={tier}
                type="button"
                onClick={() => toggleTierBan(tier)}
                className={`rounded-2xl border px-3 py-2 text-sm transition ${active ? 'bg-rose-500/10 border-rose-400/20 text-rose-200' : 'bg-white/5 border-white/10 text-slate-200'}`}
              >
                Tier {tier}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
