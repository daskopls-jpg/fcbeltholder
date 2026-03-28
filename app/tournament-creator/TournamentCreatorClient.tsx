'use client';

import { useEffect, useMemo, useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useTournamentCreatorStore,
  type DraftOwner,
  type PlayerSlot,
} from '@/store/tournamentCreatorStore';
import { createTournamentFromCreator } from '../actions/tournaments';

interface Props {
  tiers: Record<string, string[]>;
}

interface Matchup {
  left: string | null;
  right: string | null;
}

const stepLabels = [
  'Infos et bans',
  'Sélection des 8 équipes',
  'Pile ou face',
  'Draft des équipes',
  'Récap et arbre',
];

const draftSequence: DraftOwner[] = [
  'winner',
  'loser',
  'loser',
  'winner',
  'winner',
  'loser',
  'loser',
  'winner',
];

export default function TournamentCreatorClient({ tiers }: Props) {
  const [isCoinFlipping, setIsCoinFlipping] = useState(false);
  const [isSavingTournament, startSavingTournament] = useTransition();
  const [activeTierTooltip, setActiveTierTooltip] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const {
    hasHydrated,
    step,
    tournamentName,
    tournamentType,
    date,
    bannedTiers,
    selectedTeams,
    coinWinnerSlot,
    coinResultText,
    pickedTeams,
    quarterOrderPlayer1,
    quarterOrderPlayer2,
    quarterWinners,
    semiWinners,
    finalWinner,
    setStep,
    setTournamentName,
    setTournamentType,
    setDate,
    setSelectedTeams,
    toggleTierBan,
    toggleSelectedTeam,
    sanitizeSelectionAgainstBans,
    runCoinFlip,
    setCoinWinnerSlot,
    setCoinResultText,
    resetDraft,
    generateQuarterFinalOrder,
    pickTeam,
    chooseQuarterWinner,
    chooseSemiWinner,
    setFinalWinner,
    resetAll,
  } = useTournamentCreatorStore();

  const player1 = 'Maxime';
  const player2 = 'Damien';

  const tierEntries = useMemo(
    () =>
      Object.entries(tiers)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([tier, teams]) => ({ tier, teams })),
    [tiers]
  );

  const bannedTeamList = useMemo(() => {
    const teams = bannedTiers.flatMap((tier) => tiers[tier] ?? []);
    return Array.from(new Set(teams)).sort((a, b) => a.localeCompare(b));
  }, [bannedTiers, tiers]);

  const eligibleTeams = useMemo(() => {
    const blocked = new Set(bannedTeamList);
    const pool = Object.values(tiers)
      .flat()
      .filter((team) => !blocked.has(team));
    return Array.from(new Set(pool)).sort((a, b) => a.localeCompare(b));
  }, [bannedTeamList, tiers]);

  const availableForSelection = useMemo(
    () => eligibleTeams.filter((team) => !selectedTeams.includes(team)),
    [eligibleTeams, selectedTeams]
  );

  useEffect(() => {
    if (!hasHydrated) return;
    sanitizeSelectionAgainstBans(eligibleTeams);
  }, [eligibleTeams, hasHydrated, sanitizeSelectionAgainstBans]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (eligibleTeams.length !== 8) return;

    const sameSelection =
      selectedTeams.length === 8 &&
      selectedTeams.every((team) => eligibleTeams.includes(team)) &&
      eligibleTeams.every((team) => selectedTeams.includes(team));

    if (!sameSelection) {
      setSelectedTeams(eligibleTeams);
    }
  }, [eligibleTeams, hasHydrated, selectedTeams, setSelectedTeams]);

  const coinWinnerName =
    coinWinnerSlot === 'player1' ? player1 : coinWinnerSlot === 'player2' ? player2 : '';
  const coinLoserName =
    coinWinnerSlot === 'player1' ? player2 : coinWinnerSlot === 'player2' ? player1 : '';
  const displayedCoinFace = coinWinnerSlot === 'player2' ? 'face' : 'pile';
  const displayedCoinOwner = displayedCoinFace === 'pile' ? 'Maxime' : 'Damien';

  const picksByWinner = pickedTeams.filter((pick) => pick.owner === 'winner').map((pick) => pick.team);
  const picksByLoser = pickedTeams.filter((pick) => pick.owner === 'loser').map((pick) => pick.team);

  const player1Teams = useMemo(
    () => (coinWinnerSlot === 'player1' ? picksByWinner : coinWinnerSlot === 'player2' ? picksByLoser : []),
    [coinWinnerSlot, picksByWinner, picksByLoser]
  );
  const player2Teams = useMemo(
    () => (coinWinnerSlot === 'player2' ? picksByWinner : coinWinnerSlot === 'player1' ? picksByLoser : []),
    [coinWinnerSlot, picksByWinner, picksByLoser]
  );

  useEffect(() => {
    const needsDraw = quarterOrderPlayer1.length !== 4 || quarterOrderPlayer2.length !== 4;
    if (step !== 5 || !needsDraw) return;
    if (player1Teams.length !== 4 || player2Teams.length !== 4) return;
    generateQuarterFinalOrder(player1Teams, player2Teams);
  }, [
    step,
    player1Teams,
    player2Teams,
    quarterOrderPlayer1.length,
    quarterOrderPlayer2.length,
    generateQuarterFinalOrder,
  ]);

  const quarterPool1 = quarterOrderPlayer1.length === 4 ? quarterOrderPlayer1 : player1Teams;
  const quarterPool2 = quarterOrderPlayer2.length === 4 ? quarterOrderPlayer2 : player2Teams;

  const quarterFinals: Matchup[] = [
    { left: quarterPool1[0] ?? null, right: quarterPool2[0] ?? null },
    { left: quarterPool1[1] ?? null, right: quarterPool2[1] ?? null },
    { left: quarterPool1[2] ?? null, right: quarterPool2[2] ?? null },
    { left: quarterPool1[3] ?? null, right: quarterPool2[3] ?? null },
  ];

  const semiFinals: Matchup[] = [
    { left: quarterWinners[0], right: quarterWinners[1] },
    { left: quarterWinners[2], right: quarterWinners[3] },
  ];

  const finalMatch: Matchup = {
    left: semiWinners[0],
    right: semiWinners[1],
  };

  const remainingDraftTeams = selectedTeams.filter(
    (team) => !pickedTeams.some((pick) => pick.team === team)
  );
  const hasEnoughTeamsForTournament = eligibleTeams.length >= 8;

  const currentPickIndex = pickedTeams.length;
  const currentOwner = draftSequence[currentPickIndex] ?? null;
  const currentPickerName =
    currentOwner === 'winner' ? coinWinnerName : currentOwner === 'loser' ? coinLoserName : null;

  const renderTeamWithOwner = (team: string | null, ownerIsWinner = false) => {
    if (!team) return 'À définir';
    const owner = player1Teams.includes(team) ? player1 : player2Teams.includes(team) ? player2 : null;
    return owner ? (
      <>
        <span className="font-bold">{team}</span> (<span className={ownerIsWinner ? 'font-bold' : 'font-medium'}>{owner}</span>)
      </>
    ) : (
      <span className="font-bold">{team}</span>
    );
  };

  const getTeamOwner = (team: string | null) => {
    if (!team) return null;
    if (player1Teams.includes(team)) return player1;
    if (player2Teams.includes(team)) return player2;
    return null;
  };

  const renderWinnerWithTeam = (team: string | null) => {
    if (!team) return 'Sélectionnez un gagnant';
    const owner = getTeamOwner(team);
    return owner ? (
      <>
        <span className="font-bold">{owner}</span> (<span className="font-bold">{team}</span>)
      </>
    ) : (
      <span className="font-bold">{team}</span>
    );
  };

  const formatDisplayDate = (value: string) => {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const handlePickTeam = (team: string) => {
    if (!coinWinnerSlot) return;
    if (!currentOwner) return;
    if (!remainingDraftTeams.includes(team)) return;

    pickTeam(team, currentOwner);
  };

  const canGoNext = () => {
    if (step === 1) return tournamentName.trim() !== '' && date !== '' && hasEnoughTeamsForTournament;
    if (step === 2) return selectedTeams.length === 8;
    if (step === 3) return !!coinWinnerSlot;
    if (step === 4) return pickedTeams.length === 8;
    return true;
  };

  const handleTierLongPress = (tier: string) => {
    setActiveTierTooltip(tier);
  };

  const handleTierLongPressStart = (tier: string) => {
    longPressTimerRef.current = setTimeout(() => {
      handleTierLongPress(tier);
    }, 800);
  };

  const handleTierLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const nextStep = () => {
    if (!canGoNext()) return;
    setStep(Math.min(step + 1, 5));
  };

  const prevStep = () => {
    setStep(Math.max(step - 1, 1));
  };

  const runAnimatedCoinFlip = () => {
    if (isCoinFlipping) return;
    const winner: PlayerSlot = Math.random() < 0.5 ? 'player1' : 'player2';
    setIsCoinFlipping(true);
    setCoinWinnerSlot(null);
    setCoinResultText('Lancement en cours...');

    window.setTimeout(() => {
      runCoinFlip(winner);
      setIsCoinFlipping(false);
    }, 1500);
  };

  const handleFinishTournament = () => {
    if (!finalWinner) return;

    const quarterFinalsData = quarterFinals.map((match, index) => ({
      left: match.left,
      right: match.right,
      winner: quarterWinners[index] ?? null,
    }));

    const semiFinalsData = semiFinals.map((match, index) => ({
      left: match.left,
      right: match.right,
      winner: semiWinners[index] ?? null,
    }));

    const finalData = {
      left: finalMatch.left,
      right: finalMatch.right,
      winner: finalWinner,
    };

    const winnerOwner = getTeamOwner(finalWinner);

    startSavingTournament(async () => {
      const created = await createTournamentFromCreator({
        name: tournamentName,
        type: tournamentType,
        date,
        winner: winnerOwner ?? finalWinner,
        participants: [player1, player2],
        creatorData: {
          bannedTiers,
          bannedTeams: bannedTeamList,
          coinWinner: coinWinnerName === player1 ? 'Maxime' : coinWinnerName === player2 ? 'Damien' : null,
          teamsByPlayer: {
            Maxime: player1Teams,
            Damien: player2Teams,
          },
          quarterFinals: quarterFinalsData,
          semiFinals: semiFinalsData,
          final: finalData,
        },
      });

      resetAll();
      if (created._id) {
        router.push(`/tournaments/${created._id}`);
      } else {
        router.push('/tournaments');
      }
      router.refresh();
    });
  };

  if (!hasHydrated) {
    return (
      <main className="px-4 pb-10 pt-8 md:pt-10">
        <section className="section-shell">
          <div className="glass-panel rounded-2xl p-6">
            <p className="text-slate-300 text-sm">Chargement du tournoi en cours...</p>
          </div>
        </section>
      </main>
    );
  };

  return (
    <main className="px-4 pb-10 pt-8 md:pt-10">
      <section className="section-shell">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="status-chip mb-2">Nouveau tournoi</p>
            <h1 className="text-3xl md:text-5xl font-bold">Générateur de tournois</h1>
            <p className="text-slate-300 mt-2">
              Flux complet en 5 étapes: bans, équipes, pile ou face, draft et arbre final.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-chip">Étape {step} / 5</span>
            <button
              type="button"
              onClick={resetAll}
              className="outline-btn px-3 py-1.5 text-xs"
            >
              Réinitialiser le tournoi
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 md:p-6 mb-6">
          <ol className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {stepLabels.map((label, index) => {
              const stepNumber = index + 1;
              const isActive = step === stepNumber;
              const isDone = step > stepNumber;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setStep(stepNumber)}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-sm text-left transition ${
                      isActive
                        ? 'border-cyan-300/70 bg-cyan-400/15 text-white'
                        : isDone
                          ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
                          : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-semibold">{stepNumber}.</span> {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {step === 1 && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-5">
            <h2 className="text-2xl font-semibold">Étape 1 - Infos et bans</h2>

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
                <select
                  className="surface-input"
                  value={tournamentType}
                  onChange={(e) => setTournamentType(e.target.value as 'Minor' | 'Major')}
                >
                  <option value="Minor">Mineur</option>
                  <option value="Major">Majeur</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">Date</label>
                <input
                  className="surface-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Bannir des tiers</h3>
              <div className="flex flex-wrap gap-2">
                {tierEntries.map(({ tier, teams }) => {
                  const active = bannedTiers.includes(tier);
                  const tierTooltip =
                    teams.length > 0
                      ? `Tier ${tier}: ${teams.join(', ')}`
                      : `Tier ${tier}: aucune equipe`;
                  return (
                    <button
                      key={tier}
                      type="button"
                      title={tierTooltip}
                      onClick={() => {
                        toggleTierBan(tier);
                        setActiveTierTooltip(null);
                      }}
                      onTouchStart={() => handleTierLongPressStart(tier)}
                      onTouchEnd={handleTierLongPressEnd}
                      onMouseLeave={() => setActiveTierTooltip(null)}
                      className={`relative px-3 py-1.5 rounded-full border text-sm transition ${
                        active
                          ? 'border-red-300/70 bg-red-500/20 text-red-100'
                          : 'border-white/20 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      Tier {tier}
                      {activeTierTooltip === tier && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-white/20 rounded-lg text-xs text-slate-100 whitespace-nowrap z-10 pointer-events-none">
                          {tierTooltip}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/15 bg-black/20 p-3">
                <p className="text-sm font-semibold text-slate-100 mb-2">Équipes bannies ({bannedTeamList.length})</p>
                {bannedTeamList.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune équipe bannie.</p>
                ) : (
                  <p className="text-sm text-slate-300">{bannedTeamList.join(', ')}</p>
                )}
              </div>
              <div className="rounded-xl border border-white/15 bg-black/20 p-3">
                <p className="text-sm font-semibold text-slate-100 mb-2">Pool disponible ({eligibleTeams.length})</p>
                <p className="text-sm text-slate-300">
                  {eligibleTeams.length > 0 ? eligibleTeams.join(', ') : 'Aucune équipe disponible.'}
                </p>
              </div>
            </div>

            {!hasEnoughTeamsForTournament && (
              <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-3">
                <p className="text-sm font-semibold text-amber-100">Pool insuffisant</p>
                <p className="text-sm text-amber-50/90 mt-1">
                  Il faut au minimum 8 equipes disponibles pour lancer un tournoi.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Étape 2 - Choisir 8 équipes</h2>
            <p className="text-sm text-slate-300">
              Sélection actuelle: <span className="font-semibold text-white">{selectedTeams.length} / 8</span>
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
                  Plus aucune equipe disponible. Retire un ban de tier ou deselectionne une equipe.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableForSelection.map((team) => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => toggleSelectedTeam(team)}
                      disabled={selectedTeams.length >= 8}
                      className="px-3 py-1.5 rounded-full text-sm border border-white/20 text-slate-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      {team}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-5">
            <h2 className="text-2xl font-semibold">Étape 3 - Pile ou face</h2>
            <p className="text-slate-300 text-sm">
              Le gagnant du pile ou face choisira la première équipe.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runAnimatedCoinFlip}
                disabled={isCoinFlipping}
                className="brand-btn px-4 py-2 text-sm disabled:opacity-50"
              >
                Lancer la pièce
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCoinFlipping(false);
                  setCoinWinnerSlot(null);
                  setCoinResultText('');
                  resetDraft();
                }}
                disabled={isCoinFlipping}
                className="outline-btn px-4 py-2 text-sm disabled:opacity-50"
              >
                Réinitialiser
              </button>
            </div>

            <div className="coin-stage rounded-xl border border-white/15 bg-black/20 p-4">
              <button
                type="button"
                onClick={runAnimatedCoinFlip}
                disabled={isCoinFlipping}
                className={`coin-visual ${isCoinFlipping ? 'is-flipping' : ''} ${displayedCoinFace === 'face' ? 'is-face coin-face-side' : 'coin-pile-side'}`}
                aria-label="Lancer la piece"
              >
                <span className="coin-label">{isCoinFlipping ? '...' : displayedCoinOwner}</span>
              </button>
              <p className="text-sm text-slate-300 mt-3" aria-live="polite">
                {isCoinFlipping
                  ? 'La piece tourne...'
                  : `Resultat actuel: ${displayedCoinOwner}`}
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-sm text-slate-200">
                {coinResultText || 'Aucun résultat pour le moment.'}
              </p>
              {coinWinnerSlot && (
                <p className="text-sm text-slate-300 mt-2">
                  Ordre de draft: {coinWinnerName} (1) - {coinLoserName} (2,3) - {coinWinnerName} (4,5) - {coinLoserName} (6,7) - {coinWinnerName} (8)
                </p>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Étape 4 - Draft</h2>
            <p className="text-sm text-slate-300">
              {currentPickerName
                ? `Tour actuel: ${currentPickerName}`
                : 'La draft est terminée. Passe à la prochaine étape.'}
            </p>

            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-sm font-semibold text-slate-100 mb-3">Choisir une équipe</p>
              {remainingDraftTeams.length === 0 ? (
                <p className="text-sm text-emerald-200">Toutes les équipes sont attribuées.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {remainingDraftTeams.map((team) => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => handlePickTeam(team)}
                      disabled={!currentPickerName}
                      className="px-3 py-1.5 rounded-full text-sm border border-white/20 text-slate-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      {team}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
          </div>
        )}

        {step === 5 && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Étape 5 - Récapitulatif</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <article className="rounded-xl border border-white/15 bg-black/20 p-3">
                <p className="text-sm text-slate-300">Nom</p>
                <p className="font-semibold text-white">{tournamentName || '—'}</p>
              </article>
              <article className="rounded-xl border border-white/15 bg-black/20 p-3">
                <p className="text-sm text-slate-300">Date</p>
                <p className="font-semibold text-white">{formatDisplayDate(date)}</p>
              </article>
              <article className="rounded-xl border border-white/15 bg-black/20 p-3 md:col-span-2">
                <p className="text-sm text-slate-300">Tiers bannis</p>
                <p className="font-semibold text-white">
                  {bannedTiers.length > 0 ? bannedTiers.map((tier) => `Tier ${tier}`).join(', ') : 'Aucun'}
                </p>
              </article>
              <article className="rounded-xl border border-white/15 bg-black/20 p-3 md:col-span-2">
                <p className="text-sm text-slate-300">Équipes bannies</p>
                <p className="font-semibold text-white">{bannedTeamList.length > 0 ? bannedTeamList.join(', ') : 'Aucune'}</p>
              </article>
            </div>

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
                        {[match.left, match.right].map((team, teamIndex) => (
                          <button
                            key={team ?? `empty-${matchIndex}-${teamIndex}`}
                            type="button"
                            disabled={!team}
                            onClick={() => team && chooseQuarterWinner(matchIndex, team)}
                            className={`w-full text-left px-2 py-1 rounded text-sm mb-1 last:mb-0 border transition ${
                              quarterWinners[matchIndex] === team
                                ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                                : 'border-white/15 text-slate-200 hover:bg-white/10 disabled:opacity-50'
                            }`}
                          >
                            {renderTeamWithOwner(team, quarterWinners[matchIndex] === team)}
                          </button>
                        ))}
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
                        {[match.left, match.right].map((team, teamIndex) => (
                          <button
                            key={team ?? `semi-empty-${matchIndex}-${teamIndex}`}
                            type="button"
                            disabled={!team}
                            onClick={() => team && chooseSemiWinner(matchIndex, team)}
                            className={`w-full text-left px-2 py-1 rounded text-sm mb-1 last:mb-0 border transition ${
                              semiWinners[matchIndex] === team
                                ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                                : 'border-white/15 text-slate-200 hover:bg-white/10 disabled:opacity-50'
                            }`}
                          >
                            {renderTeamWithOwner(team, semiWinners[matchIndex] === team)}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/15 bg-black/20 p-3">
                  <p className="text-sm font-semibold mb-3 text-slate-100">Finale</p>
                  <div className="rounded-lg border border-white/15 p-2 mb-3">
                    {[finalMatch.left, finalMatch.right].map((team, index) => (
                      <button
                        key={team ?? `final-empty-${index}`}
                        type="button"
                        disabled={!team}
                        onClick={() => team && setFinalWinner(team)}
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
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={prevStep} disabled={step === 1} className="outline-btn px-4 py-2 text-sm">
            Étape précédente
          </button>
          {step === 5 ? (
            <button
              type="button"
              onClick={handleFinishTournament}
              disabled={!finalWinner || isSavingTournament}
              className="brand-btn px-4 py-2 text-sm disabled:opacity-40"
            >
              {isSavingTournament ? 'Enregistrement...' : 'Terminer le tournoi'}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canGoNext()}
              className="brand-btn px-4 py-2 text-sm disabled:opacity-40"
            >
              Étape suivante
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
