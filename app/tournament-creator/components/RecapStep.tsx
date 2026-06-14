import React, { ReactNode } from 'react';
import type { GroupStage } from '@/store/tournamentCreatorStore';
import type { GroupStanding } from '../utils';

type Matchup = {
  left: string | null;
  right: string | null;
};

type ScoreMap = Record<string, { left: string; right: string }>;

interface Props {
  tournamentName: string;
  date: string;
  bannedTiers: string[];
  bannedTeamList: string[];
  isThreePlayer: boolean;
  players: string[];
  threeGroups: GroupStage[] | null;
  threeGroupScores: ScoreMap;
  threeGroupStandings: GroupStanding[][];
  areAllScoresFilled: boolean;
  threeSemiMatches: Matchup[];
  threeSemiWinners: [string | null, string | null];
  finalMatchThree: Matchup;
  threeFinalWinner: string | null;
  quarterFinals: Matchup[];
  quarterWinners: (string | null)[];
  semiFinals: Matchup[];
  semiWinners: (string | null)[];
  finalMatch: Matchup;
  finalWinner: string | null;
  player1: string;
  player2: string;
  player1Teams: string[];
  player2Teams: string[];
  onUpdateThreeGroupScore: (groupName: string, matchId: string, side: 'left' | 'right', value: string) => void;
  onChooseThreeSemiWinner: (matchIndex: number, winner: string) => void;
  onSetThreeFinalWinner: (team: string) => void;
  onChooseQuarterWinner: (matchIndex: number, winner: string) => void;
  onChooseSemiWinner: (matchIndex: number, winner: string) => void;
  onSetFinalWinner: (team: string) => void;
  renderTeamWithOwner: (team: string | null, ownerIsWinner?: boolean) => ReactNode;
  renderWinnerWithTeam: (team: string | null) => ReactNode;
}

export default function RecapStep({
  tournamentName,
  date,
  bannedTiers,
  bannedTeamList,
  isThreePlayer,
  players,
  threeGroups,
  threeGroupScores,
  threeGroupStandings,
  areAllScoresFilled,
  threeSemiMatches,
  threeSemiWinners,
  finalMatchThree,
  threeFinalWinner,
  quarterFinals,
  quarterWinners,
  semiFinals,
  semiWinners,
  finalMatch,
  finalWinner,
  player1,
  player2,
  player1Teams,
  player2Teams,
  onUpdateThreeGroupScore,
  onChooseThreeSemiWinner,
  onSetThreeFinalWinner,
  onChooseQuarterWinner,
  onChooseSemiWinner,
  onSetFinalWinner,
  renderTeamWithOwner,
  renderWinnerWithTeam,
}: Props) {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Étape 6 - Récapitulatif</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="rounded-xl border border-white/15 bg-black/20 p-3">
          <p className="text-sm text-slate-300">Nom</p>
          <p className="font-semibold text-white">{tournamentName || '—'}</p>
        </article>
        <article className="rounded-xl border border-white/15 bg-black/20 p-3">
          <p className="text-sm text-slate-300">Date</p>
          <p className="font-semibold text-white">{date ? date.split('-').reverse().join('/') : '—'}</p>
        </article>
        <article className="rounded-xl border border-white/15 bg-black/20 p-3 md:col-span-2">
          <p className="text-sm text-slate-300">Tiers bannis</p>
          <p className="font-semibold text-white">{bannedTiers.length > 0 ? bannedTiers.map((tier) => `Tier ${tier}`).join(', ') : 'Aucun'}</p>
        </article>
        <article className="rounded-xl border border-white/15 bg-black/20 p-3 md:col-span-2">
          <p className="text-sm text-slate-300">Équipes bannies</p>
          <p className="font-semibold text-white">{bannedTeamList.length > 0 ? bannedTeamList.join(', ') : 'Aucune'}</p>
        </article>
      </div>

      {isThreePlayer ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/15 bg-black/20 p-3">
            <p className="text-xl font-semibold mb-3">Groupes</p>
            {threeGroups ? (
              <div className="space-y-6">
                {threeGroups.map((group, index) => (
                  <div key={group.name} className="rounded-2xl border border-white/15 p-4 bg-slate-950/60">
                    <h3 className="text-lg font-semibold mb-3">{group.name}</h3>
                    <div className="space-y-3">
                      {group.matches.map((match) => {
                        const score = threeGroupScores[`${group.name}-${match.id}`] ?? { left: '', right: '' };
                        const leftScore = Number(score.left);
                        const rightScore = Number(score.right);
                        const winnerTeam =
                          score.left !== '' && score.right !== '' && !Number.isNaN(leftScore) && !Number.isNaN(rightScore)
                            ? leftScore > rightScore
                              ? match.left
                              : leftScore < rightScore
                              ? match.right
                              : null
                            : null;
                        return (
                          <div key={match.id} className="rounded-xl border border-white/10 p-3 bg-black/20">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                              <span className={`w-full sm:flex-1 text-center font-semibold break-words whitespace-normal ${winnerTeam === match.left ? 'text-emerald-200' : ''}`}>
                                {renderTeamWithOwner(match.left, winnerTeam === match.left)}
                              </span>
                              <div className="w-full sm:w-auto flex justify-center gap-2 items-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={score.left}
                                  onChange={(e) => onUpdateThreeGroupScore(group.name, match.id, 'left', e.target.value)}
                                  className="surface-input w-28 sm:w-12 min-w-[3.5rem] text-center text-sm px-2 py-1"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={score.right}
                                  onChange={(e) => onUpdateThreeGroupScore(group.name, match.id, 'right', e.target.value)}
                                  className="surface-input w-28 sm:w-12 min-w-[3.5rem] text-center text-sm px-2 py-1"
                                />
                              </div>
                              <span className={`w-full sm:flex-1 text-center font-semibold break-words whitespace-normal ${winnerTeam === match.right ? 'text-emerald-200' : ''}`}>
                                {renderTeamWithOwner(match.right, winnerTeam === match.right)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/15 bg-black/20 p-3 mt-4">
                      <p className="text-sm font-semibold text-slate-100 mb-3">Classement</p>
                      <table className="w-full text-left text-sm text-slate-200">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400">
                            <th className="pb-2 pr-3">Équipe</th>
                            <th className="pb-2 px-3">BP</th>
                            <th className="pb-2 px-3">BC</th>
                            <th className="pb-2 px-3">Diff</th>
                            <th className="pb-2 pl-3">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {threeGroupStandings[index]?.map((row) => (
                            <tr key={row.team} className="border-b border-white/10">
                              <td className="py-2 pr-3">{renderTeamWithOwner(row.team)}</td>
                              <td className="py-2 px-3">{row.goalsFor}</td>
                              <td className="py-2 px-3">{row.goalsAgainst}</td>
                              <td className="py-2 px-3">{row.goalDifference}</td>
                              <td className="py-2 pl-3 font-semibold text-white">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">La poule sera générée après la draft.</p>
            )}
          </div>

          {areAllScoresFilled && (
            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-xl font-semibold mb-3">Arbre final</p>
              <div className="space-y-4">
                <div className="rounded-xl border border-white/15 p-3 bg-black/20">
                  <p className="text-sm font-semibold text-slate-100 mb-3">Demi-finales</p>
                  {threeSemiMatches.map((match, matchIndex) => (
                    <div key={`three-sf-${matchIndex}`} className="space-y-2">
                      <p className="text-sm text-slate-400">SF {matchIndex + 1}</p>
                      {[match.left, match.right].map((team, teamIndex) => (
                        <button
                          key={`${team ?? `three-sf-empty-${matchIndex}-${teamIndex}`}`}
                          type="button"
                          disabled={!team}
                          onClick={() => team && onChooseThreeSemiWinner(matchIndex, team)}
                          className={`w-full text-left px-3 py-2 rounded text-sm border transition ${
                            threeSemiWinners[matchIndex] === team
                              ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                              : 'border-white/15 text-slate-200 hover:bg-white/10 disabled:opacity-50'
                          }`}
                        >
                          {renderTeamWithOwner(team, threeSemiWinners[matchIndex] === team)}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/15 p-3 bg-black/20">
                  <p className="text-sm font-semibold text-slate-100 mb-3">Finale</p>
                  <div className="space-y-2 mb-4">
                    {[finalMatchThree.left, finalMatchThree.right].map((team, index) => (
                      <button
                        key={`${team ?? `three-final-empty-${index}`}-${index}`}
                        type="button"
                        disabled={!team}
                        onClick={() => team && onSetThreeFinalWinner(team)}
                        className={`w-full text-left px-3 py-2 rounded text-sm border transition ${
                          threeFinalWinner === team
                            ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                            : 'border-white/15 text-slate-200 hover:bg-white/10 disabled:opacity-50'
                        }`}
                      >
                        {renderTeamWithOwner(team, threeFinalWinner === team)}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 p-3">
                    <p className="text-xs text-slate-300 uppercase tracking-wide mb-1">Vainqueur</p>
                    <p className="text-lg font-semibold text-white">{renderWinnerWithTeam(threeFinalWinner)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-3">Arbre éliminatoire</h3>
          <p className="text-sm text-slate-300 mb-3">
            Les quarts sont tirés aléatoirement entre les pools de {player1} et {player2}.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-sm font-semibold mb-3 text-slate-100">Quarts de finale</p>
              <div className="space-y-3">
                {quarterFinals.map((match, matchIndex) => (
                  <div key={`qf-${matchIndex}`} className="rounded-lg border border-white/15 p-2">
                    <p className="text-xs text-slate-400 mb-2">QF {matchIndex + 1}</p>
                    {[match.left, match.right].map((team, teamIndex) => {
                      const isSelected = quarterWinners[matchIndex] === team;
                      return (
                        <button
                          key={`${team ?? `empty-${matchIndex}-${teamIndex}`}-${teamIndex}`}
                          type="button"
                          disabled={!team}
                          onClick={() => team && onChooseQuarterWinner(matchIndex, team)}
                          className={`w-full text-left px-2 py-1 rounded text-sm mb-1 last:mb-0 border transition ${
                            isSelected
                              ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                              : 'border-white/15 text-slate-200 hover:bg-white/10 disabled:opacity-50'
                          }`}
                        >
                          {renderTeamWithOwner(team, isSelected)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-sm font-semibold mb-3 text-slate-100">Demi-finales</p>
              <div className="space-y-3">
                {semiFinals.map((match, matchIndex) => (
                  <div key={`sf-${matchIndex}`} className="rounded-lg border border-white/15 p-2">
                    <p className="text-xs text-slate-400 mb-2">SF {matchIndex + 1}</p>
                    {[match.left, match.right].map((team, teamIndex) => {
                      const isSelected = semiWinners[matchIndex] === team;
                      return (
                        <button
                          key={`${team ?? `semi-empty-${matchIndex}-${teamIndex}`}-${teamIndex}`}
                          type="button"
                          disabled={!team}
                          onClick={() => team && onChooseSemiWinner(matchIndex, team)}
                          className={`w-full text-left px-2 py-1 rounded text-sm mb-1 last:mb-0 border transition ${
                            isSelected
                              ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                              : 'border-white/15 text-slate-200 hover:bg-white/10 disabled:opacity-50'
                          }`}
                        >
                          {renderTeamWithOwner(team, isSelected)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-sm font-semibold mb-3 text-slate-100">Finale</p>
              <div className="rounded-lg border border-white/15 p-2 mb-3">
                {[finalMatch.left, finalMatch.right].map((team, index) => (
                  <button
                    key={`${team ?? `final-empty-${index}`}-${index}`}
                    type="button"
                    disabled={!team}
                    onClick={() => team && onSetFinalWinner(team)}
                    className={`w-full text-left px-2 py-1 rounded text-sm mb-1 last:mb-0 border transition ${
                      finalWinner === team
                        ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                        : 'border-white/15 text-slate-200 hover:bg-white/10 disabled:opacity-50'
                    }`}
                  >
                    {renderTeamWithOwner(team, finalWinner === team)}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-cyan-300/40 bg-cyan-500/10 p-3">
                <p className="text-xs text-slate-300 uppercase tracking-wide mb-1">Vainqueur</p>
                <p className="text-lg font-semibold text-white">{renderWinnerWithTeam(finalWinner)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
