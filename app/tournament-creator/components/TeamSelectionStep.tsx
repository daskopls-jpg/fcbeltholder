import React from 'react';

interface Props {
  selectedTeams: string[];
  availableForSelection: string[];
  requiredTeamCount: number;
  toggleSelectedTeam: (team: string) => void;
}

export default function TeamSelectionStep({
  selectedTeams,
  availableForSelection,
  requiredTeamCount,
  toggleSelectedTeam,
}: Props) {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Étape 3 - Choisir {requiredTeamCount} équipes</h2>
      <p className="text-sm text-slate-300">
        Sélection actuelle: <span className="font-semibold text-white">{selectedTeams.length} / {requiredTeamCount}</span>
      </p>

      <div className="rounded-xl border border-white/15 bg-black/20 p-3">
        <p className="text-sm font-semibold text-slate-100 mb-2">Équipes choisies</p>
        {selectedTeams.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune équipe choisie.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedTeams.map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => toggleSelectedTeam(team)}
                className="px-3 py-1.5 rounded-full text-sm border border-cyan-300/50 bg-cyan-400/15 text-cyan-50"
              >
                {team} ×
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/15 bg-black/20 p-3">
        <p className="text-sm font-semibold text-slate-100 mb-3">Pool autorisé</p>
        {availableForSelection.length === 0 ? (
          <p className="text-sm text-slate-400">
            Plus aucune équipe disponible. Retire un ban de tier ou deselectionne une equipe.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableForSelection.map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => toggleSelectedTeam(team)}
                className="px-3 py-1.5 rounded-full text-sm border border-white/20 text-slate-200 hover:bg-white/10"
              >
                {team}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
