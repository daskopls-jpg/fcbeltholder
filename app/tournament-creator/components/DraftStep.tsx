import React from 'react';

interface Props {
  isThreePlayer: boolean;
  players: string[];
  currentPickerName: string | null;
  currentThreePicker: string | null;
  threeDraftOrder: string[];
  remainingDraftTeams: string[];
  remainingThreeDraftTeams: string[];
  onPickTeam: (team: string) => void;
  onPickTeamThree: (team: string) => void;
  player1: string;
  player2: string;
  player1Teams: string[];
  player2Teams: string[];
  pickedTeamsByPlayer: Record<string, string[]>;
}

export default function DraftStep({
  isThreePlayer,
  players,
  currentPickerName,
  currentThreePicker,
  threeDraftOrder,
  remainingDraftTeams,
  remainingThreeDraftTeams,
  onPickTeam,
  onPickTeamThree,
  player1,
  player2,
  player1Teams,
  player2Teams,
  pickedTeamsByPlayer,
}: Props) {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-5">
      <h2 className="text-2xl font-semibold">Étape 5 - Draft</h2>
      <p className="text-sm text-slate-300">
        {isThreePlayer
          ? currentThreePicker
            ? `Tour actuel: ${currentThreePicker}`
            : 'La draft est terminée. Passe à l’étape suivante.'
          : currentPickerName
          ? `Tour actuel: ${currentPickerName}`
          : 'La draft est terminée. Passe à l’étape suivante.'}
      </p>

      <div className="rounded-xl border border-white/15 bg-black/20 p-3">
        <p className="text-sm font-semibold text-slate-100 mb-3">Choisir une équipe</p>
        {isThreePlayer ? (
          threeDraftOrder.length === 0 ? (
            <p className="text-sm text-slate-400">Générez d'abord l'ordre de draft pour commencer.</p>
          ) : remainingThreeDraftTeams.length === 0 ? (
            <p className="text-sm text-emerald-200">Toutes les équipes sont attribuées.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {remainingThreeDraftTeams.map((team) => (
                <button
                  key={team}
                  type="button"
                  onClick={() => onPickTeamThree(team)}
                  disabled={!currentThreePicker}
                  className="px-3 py-1.5 rounded-full text-sm border border-white/20 text-slate-200 hover:bg-white/10 disabled:opacity-40"
                >
                  {team}
                </button>
              ))}
            </div>
          )
        ) : remainingDraftTeams.length === 0 ? (
          <p className="text-sm text-emerald-200">Toutes les équipes sont attribuées.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {remainingDraftTeams.map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => onPickTeam(team)}
                disabled={!currentPickerName}
                className="px-3 py-1.5 rounded-full text-sm border border-white/20 text-slate-200 hover:bg-white/10 disabled:opacity-40"
              >
                {team}
              </button>
            ))}
          </div>
        )}
      </div>

      {isThreePlayer ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {players.map((player) => (
            <div key={player} className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-sm font-semibold text-slate-100 mb-2">{player}</p>
              <p className="text-sm text-slate-300">
                {pickedTeamsByPlayer[player]?.length > 0
                  ? pickedTeamsByPlayer[player].join(', ')
                  : 'Aucune équipe attribuée.'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/15 bg-black/20 p-3">
            <p className="text-sm font-semibold text-slate-100 mb-2">{player1}</p>
            <p className="text-sm text-slate-300">
              {player1Teams.length > 0 ? player1Teams.join(', ') : 'Aucune équipe attribuée.'}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/20 p-3">
            <p className="text-sm font-semibold text-slate-100 mb-2">{player2}</p>
            <p className="text-sm text-slate-300">
              {player2Teams.length > 0 ? player2Teams.join(', ') : 'Aucune équipe attribuée.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
