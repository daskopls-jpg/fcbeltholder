'use client';

import { useEffect, useMemo, useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useTournamentCreatorStore,
  type DraftOwner,
  type PlayerSlot,
  type GroupStage,
} from '@/store/tournamentCreatorStore';
import { useWorldCupStore } from '@/store/worldCupStore';
import { emptyWorldCupTiers } from '@/lib/worldCup';
import { createTournamentFromCreator } from '../actions/tournaments';

interface Props {
  tiers: Record<string, string[]>;
  initialWorldCupTiers?: Record<string, string[]>;
}

interface Matchup {
  left: string | null;
  right: string | null;
}

interface GroupStanding {
  team: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

const getStepLabels = (playerCount: 2 | 3 | null) => [
  'Mode',
  'Infos',
  'Equipes',
  'Ordre de pick',
  'Draft',
  'Recap',
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

export default function TournamentCreatorClient({ tiers, initialWorldCupTiers }: Props) {
  const [isCoinFlipping, setIsCoinFlipping] = useState(false);
  const [isSavingTournament, startSavingTournament] = useTransition();
  const [activeTierTooltip, setActiveTierTooltip] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const {
    hasHydrated,
    step,
    playerCount,
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
    threeDraftOrder,
    threePickedTeams,
    threeGroups,
    threeGroupScores,
    threeSemiWinners,
    threeFinalWinner,
    setStep,
    setPlayerCount,
    setTournamentName,
    setTournamentType,
    setDate,
    setSelectedTeams,
    toggleTierBan,
    toggleSelectedTeam,
    runCoinFlip,
    setCoinWinnerSlot,
    setCoinResultText,
    resetDraft,
    generateQuarterFinalOrder,
    pickTeam,
    chooseQuarterWinner,
    chooseSemiWinner,
    setFinalWinner,
    setThreeDraftOrder,
    setThreePickedTeams,
    appendThreePickedTeam,
    setThreeGroups,
    setThreeGroupScores,
    updateThreeGroupScore,
    setThreeSemiWinners,
    setThreeFinalWinner,
    resetAll,
  } = useTournamentCreatorStore();

  const player1 = 'Maxime';
  const player2 = 'Damien';

  const isWorldCup2026 = useWorldCupStore((state) => state.isWorldCup2026);
  const worldCupTiers = initialWorldCupTiers;
  const currentTiers = isWorldCup2026 ? worldCupTiers ?? emptyWorldCupTiers() : tiers;

  const tierEntries = useMemo(
    () =>
      Object.entries(currentTiers)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([tier, teams]) => ({ tier, teams })),
    [currentTiers]
  );

  const isThreePlayer = playerCount === 3;
  const requiredTeamCount = isThreePlayer ? 6 : 8;
  const players = isThreePlayer ? ['Damien', 'Maxime', 'Thibaut'] : [player2, player1];
  const stepLabels = useMemo(() => getStepLabels(playerCount), [playerCount]);

  const bannedTeamList = useMemo(() => {
    const teams = bannedTiers.flatMap((tier) => currentTiers[tier] ?? []);
    return Array.from(new Set(teams)).sort((a, b) => a.localeCompare(b));
  }, [bannedTiers, currentTiers]);

  const eligibleTeams = useMemo(() => {
    const blocked = new Set(bannedTeamList);
    const pool = Object.values(currentTiers)
      .flat()
      .filter((team) => !blocked.has(team));
    return Array.from(new Set(pool)).sort((a, b) => a.localeCompare(b));
  }, [bannedTeamList, currentTiers]);

  const availableForSelection = useMemo(
    () => eligibleTeams.filter((team) => !selectedTeams.includes(team)),
    [eligibleTeams, selectedTeams]
  );

  useEffect(() => {
    if (!hasHydrated) return;
    const nextSelected = selectedTeams.filter((team) => eligibleTeams.includes(team));
    if (nextSelected.length === selectedTeams.length) return;
    setSelectedTeams(nextSelected);
  }, [eligibleTeams, hasHydrated, selectedTeams, setSelectedTeams]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (eligibleTeams.length !== requiredTeamCount) return;

    const sameSelection =
      selectedTeams.length === requiredTeamCount &&
      selectedTeams.every((team) => eligibleTeams.includes(team)) &&
      eligibleTeams.every((team) => selectedTeams.includes(team));

    if (!sameSelection) {
      setSelectedTeams(eligibleTeams);
    }
  }, [eligibleTeams, hasHydrated, requiredTeamCount, selectedTeams, setSelectedTeams]);

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
    if (isThreePlayer) return;
    const needsDraw = quarterOrderPlayer1.length !== 4 || quarterOrderPlayer2.length !== 4;
    if (step !== 6 || !needsDraw) return;
    if (player1Teams.length !== 4 || player2Teams.length !== 4) return;
    generateQuarterFinalOrder(player1Teams, player2Teams);
  }, [
    isThreePlayer,
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

  const shuffle = (teams: string[]) => {
    const copy = [...teams];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buildThreeDraftOrder = () => {
    const order = shuffle(players);
    return [order[0], order[1], order[2], order[2], order[1], order[0]];
  };

  const handleGenerateThreeDraftOrder = () => {
    setThreeDraftOrder(buildThreeDraftOrder());
    setThreePickedTeams([]);
    setThreeGroups(null);
    setThreeGroupScores({});
    setThreeSemiWinners([null, null]);
    setThreeFinalWinner(null);
  };

  const remainingDraftTeams = selectedTeams.filter(
    (team) => !pickedTeams.some((pick) => pick.team === team)
  );
  const remainingThreeDraftTeams = selectedTeams.filter(
    (team) => !threePickedTeams.some((pick) => pick.team === team)
  );
  const hasEnoughTeamsForTournament = eligibleTeams.length >= requiredTeamCount;

  const currentPickIndex = pickedTeams.length;
  const currentOwner = draftSequence[currentPickIndex] ?? null;
  const currentPickerName =
    currentOwner === 'winner' ? coinWinnerName : currentOwner === 'loser' ? coinLoserName : null;

  const currentThreePickIndex = threePickedTeams.length;
  const currentThreePicker = threeDraftOrder[currentThreePickIndex] ?? null;

  const threePickedByPlayer = useMemo(
    () =>
      players.reduce((acc, player) => {
        acc[player] = threePickedTeams
          .filter((entry) => entry.player === player)
          .map((entry) => entry.team);
        return acc;
      }, {} as Record<string, string[]>),
    [players, threePickedTeams]
  );

  const buildThreeGroups = (pickedEntries: { team: string; player: string }[]) => {
    const playerTeamMap = players.reduce<Record<string, string[]>>((acc, player) => {
      const teams = shuffle(pickedEntries.filter((entry) => entry.player === player).map((entry) => entry.team));
      return { ...acc, [player]: teams };
    }, {} as Record<string, string[]>);

    const firstGroup = players.map((player) => playerTeamMap[player][0]);
    const secondGroup = players.map((player) => playerTeamMap[player][1]);

    const createMatches = (teams: string[]) => [
      { id: `${teams[0]}-${teams[1]}`, left: teams[0], right: teams[1], winner: null },
      { id: `${teams[1]}-${teams[2]}`, left: teams[1], right: teams[2], winner: null },
      { id: `${teams[0]}-${teams[2]}`, left: teams[0], right: teams[2], winner: null },
    ];

    return [
      { name: 'Groupe 1', teams: firstGroup, matches: createMatches(firstGroup) },
      { name: 'Groupe 2', teams: secondGroup, matches: createMatches(secondGroup) },
    ];
  };

  useEffect(() => {
    if (!isThreePlayer) return;
    if (step !== 6) return;
    if (threePickedTeams.length !== 6) return;
    if (threeGroups) return;

    setThreeGroups(buildThreeGroups(threePickedTeams));
  }, [isThreePlayer, step, threePickedTeams, threeGroups, players]);

  const getNumericScore = (value: string | undefined | null) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const computeGroupStandings = (group: GroupStage) => {
    const stats = group.teams.reduce<Record<string, GroupStanding>>((acc, team) => {
      acc[team] = { team, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };
      return acc;
    }, {} as Record<string, GroupStanding>);

    group.matches.forEach((match) => {
      const score = threeGroupScores[`${group.name}-${match.id}`];
      const leftScore = score ? getNumericScore(score.left) : null;
      const rightScore = score ? getNumericScore(score.right) : null;

      if (leftScore === null || rightScore === null) return;

      stats[match.left].goalsFor += leftScore;
      stats[match.left].goalsAgainst += rightScore;
      stats[match.right].goalsFor += rightScore;
      stats[match.right].goalsAgainst += leftScore;

      if (leftScore > rightScore) {
        stats[match.left].points += 3;
      } else if (leftScore < rightScore) {
        stats[match.right].points += 3;
      } else {
        stats[match.left].points += 1;
        stats[match.right].points += 1;
      }
    });

    return Object.values(stats).map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
    })).sort((a, b) =>
      b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
    );
  };

  const threeGroupStandings = useMemo(
    () => (threeGroups ? threeGroups.map((group) => computeGroupStandings(group)) : []),
    [threeGroups, threeGroupScores]
  );

  const areAllScoresFilled = useMemo(() => {
    if (!threeGroups) return false;
    return threeGroups.every((group) =>
      group.matches.every((match) => {
        const score = threeGroupScores[`${group.name}-${match.id}`];
        if (!score) return false;
        const leftScore = getNumericScore(score.left);
        const rightScore = getNumericScore(score.right);
        return leftScore !== null && rightScore !== null;
      })
    );
  }, [threeGroups, threeGroupScores]);

  const threeSemiMatches: Matchup[] = useMemo(() => {
    const g1_1 = threeGroupStandings[0]?.[0]?.team ?? null;
    const g1_2 = threeGroupStandings[0]?.[1]?.team ?? null;
    const g2_1 = threeGroupStandings[1]?.[0]?.team ?? null;
    const g2_2 = threeGroupStandings[1]?.[1]?.team ?? null;

    const getOwner = (team: string | null) =>
      team ? threePickedTeams.find((entry) => entry.team === team)?.player : null;

    const needsSwap =
      (getOwner(g1_1) && getOwner(g1_1) === getOwner(g2_2)) ||
      (getOwner(g2_1) && getOwner(g2_1) === getOwner(g1_2));

    return needsSwap
      ? [
          { left: g1_1, right: g1_2 },
          { left: g2_1, right: g2_2 },
        ]
      : [
          { left: g1_1, right: g2_2 },
          { left: g2_1, right: g1_2 },
        ];
  }, [threeGroupStandings, threePickedTeams]);

  useEffect(() => {
    if (!threeGroups) return;
    
    const validSemi1 = [
      threeSemiMatches[0].left,
      threeSemiMatches[0].right,
    ];
    const validSemi2 = [
      threeSemiMatches[1].left,
      threeSemiMatches[1].right,
    ];

    setThreeSemiWinners([
      threeSemiWinners[0] && !validSemi1.includes(threeSemiWinners[0]) ? null : threeSemiWinners[0],
      threeSemiWinners[1] && !validSemi2.includes(threeSemiWinners[1]) ? null : threeSemiWinners[1],
    ]);

    if (threeFinalWinner && ![validSemi1[0], validSemi1[1]].includes(threeFinalWinner) && ![validSemi2[0], validSemi2[1]].includes(threeFinalWinner)) {
      setThreeFinalWinner(null);
    }
  }, [threeGroups, threeFinalWinner, threeSemiMatches]);

  const finalMatchThree: Matchup = {
    left: threeSemiWinners[0],
    right: threeSemiWinners[1],
  };

  const handlePickTeamThree = (team: string) => {
    if (!currentThreePicker) return;
    if (!remainingThreeDraftTeams.includes(team)) return;
    appendThreePickedTeam(team, currentThreePicker);
  };

  const handleChooseThreeSemiWinner = (matchIndex: number, winner: string) => {
    const next = [...threeSemiWinners] as [string | null, string | null];
    next[matchIndex] = winner;
    setThreeSemiWinners(next);
    if (threeFinalWinner && ![next[0], next[1]].includes(threeFinalWinner)) {
      setThreeFinalWinner(null);
    }
  };

  const handleUpdateThreeGroupScore = (
    groupName: string,
    matchId: string,
    side: 'left' | 'right',
    value: string
  ) => {
    updateThreeGroupScore(groupName, matchId, side, value);
  };

  const renderTeamWithOwner = (team: string | null, ownerIsWinner = false) => {
    if (!team) return 'À définir';
    const owner =
      player1Teams.includes(team)
        ? player1
        : player2Teams.includes(team)
        ? player2
        : threePickedTeams.find((entry) => entry.team === team)?.player ?? null;
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
    return threePickedTeams.find((entry) => entry.team === team)?.player ?? null;
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
    if (step === 1) return playerCount !== null;
    if (step === 2) return tournamentName.trim() !== '' && date !== '' && hasEnoughTeamsForTournament;
    if (step === 3) return selectedTeams.length === requiredTeamCount;
    if (step === 4) return isThreePlayer ? threeDraftOrder.length === requiredTeamCount : !!coinWinnerSlot;
    if (step === 5) return isThreePlayer ? threePickedTeams.length === requiredTeamCount : pickedTeams.length === 8;
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
    setStep(Math.min(step + 1, 6));
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
    if (isThreePlayer) {
      if (!threeFinalWinner) return;
    } else {
      if (!finalWinner) return;
    }

    let creatorData: any = {
      bannedTiers,
      bannedTeams: bannedTeamList,
    };

    let tournamentWinner = finalWinner;

    if (isThreePlayer) {
      creatorData = {
        ...creatorData,
        playerCount: 3,
        players,
        draftOrder: threeDraftOrder,
        teamsByPlayer: threePickedByPlayer,
        groupStage: threeGroups,
        groupScores: threeGroupScores,
        semiFinals: threeSemiMatches.map((match, index) => ({
          left: match.left,
          right: match.right,
          winner: threeSemiWinners[index] ?? null,
        })),
        final: {
          left: finalMatchThree.left,
          right: finalMatchThree.right,
          winner: threeFinalWinner,
        },
      };
      tournamentWinner = threeFinalWinner;
    } else {
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

      creatorData = {
        ...creatorData,
        coinWinner: coinWinnerName === player1 ? 'Maxime' : coinWinnerName === player2 ? 'Damien' : null,
        teamsByPlayer: {
          Maxime: player1Teams,
          Damien: player2Teams,
        },
        quarterFinals: quarterFinalsData,
        semiFinals: semiFinalsData,
        final: {
          left: finalMatch.left,
          right: finalMatch.right,
          winner: finalWinner,
        },
      };
    }

    startSavingTournament(async () => {
      const created = await createTournamentFromCreator({
        name: tournamentName,
        type: isThreePlayer ? 'Ceinture Unifiée' : tournamentType,
        date,
        winner: tournamentWinner ?? '',
        participants: isThreePlayer ? players : [player1, player2],
        teamsByPlayer: creatorData.teamsByPlayer,
        creatorData,
        isWorldCup2026: isWorldCup2026,
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
              Flux complet en 6 étapes: choix du format, bans, équipes, draft et arbre final.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-chip">Étape {step} / 6</span>
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
          <ol className="grid grid-cols-1 md:grid-cols-6 gap-2">
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
            <h2 className="text-2xl font-semibold">Étape 1 - Choisir le format</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Deux joueurs',
                  description: 'Conserver le flux classique avec 8 équipes, pile ou face et draft.',
                  mode: 2,
                },
                {
                  title: 'Trois joueurs',
                  description: 'Nouvelle version en poules, 6 équipes et draft à 3 joueurs.',
                  mode: 3,
                },
              ].map((option) => {
                const active = playerCount === option.mode;
                return (
                  <button
                    key={option.title}
                    type="button"
                    onClick={() => {
                      setPlayerCount(option.mode as 2 | 3);
                      setStep(2);
                    }}
                    className={`w-full rounded-3xl border p-6 text-left transition ${
                      active
                        ? 'border-cyan-300/70 bg-cyan-400/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-lg font-semibold mb-2">{option.title}</p>
                    <p className="text-sm text-slate-300">{option.description}</p>
                    {active && <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-200">Sélectionné</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
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
                  <div className="surface-input opacity-70 flex items-center h-[42px]">
                    Ceinture Unifiée
                  </div>
                ) : (
                  <select
                    className="surface-input h-[42px]"
                    value={tournamentType}
                    onChange={(e) => setTournamentType(e.target.value as 'Minor' | 'Major')}
                  >
                    <option value="Minor">Mineur</option>
                    <option value="Major">Majeur</option>
                  </select>
                )}
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
                  Il faut au minimum {requiredTeamCount} equipes disponibles pour lancer un tournoi.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
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
                  Plus aucune equipe disponible. Retire un ban de tier ou deselectionne une equipe.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableForSelection.map((team) => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => toggleSelectedTeam(team)}
                      disabled={selectedTeams.length >= requiredTeamCount}
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

        {step === 4 && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-5">
            <h2 className="text-2xl font-semibold">Étape 4 - {isThreePlayer ? 'Ordre de draft' : 'Pile ou face'}</h2>
            {isThreePlayer ? (
              <>
                <p className="text-slate-300 text-sm">
                  Générez l'ordre de draft pour {players.join(', ')}.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateThreeDraftOrder}
                    className="brand-btn px-4 py-2 text-sm"
                  >
                    Générer l'ordre de draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThreeDraftOrder([]);
                      setThreePickedTeams([]);
                      setThreeGroups(null);
                      setThreeGroupScores({});
                      setThreeSemiWinners([null, null]);
                      setThreeFinalWinner(null);
                    }}
                    className="outline-btn px-4 py-2 text-sm"
                  >
                    Réinitialiser
                  </button>
                </div>

                {threeDraftOrder.length > 0 && (
                  <div className="rounded-xl border border-white/15 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-slate-100 mb-3">Ordre de draft</p>
                    <ol className="list-decimal list-inside text-slate-200 space-y-1">
                      {threeDraftOrder.map((player, index) => (
                        <li key={`${player}-${index}`}>{player}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <>
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
                    aria-label="Lancer la pièce"
                  >
                    <span className="coin-label">{isCoinFlipping ? '...' : displayedCoinOwner}</span>
                  </button>
                  <p className="text-sm text-slate-300 mt-3" aria-live="polite">
                    {isCoinFlipping
                      ? 'La pièce tourne...'
                      : `Résultat actuel: ${displayedCoinOwner}`}
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
              </>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Étape 5 - Draft</h2>
            <p className="text-sm text-slate-300">
              {isThreePlayer
                ? currentThreePicker
                  ? `Tour actuel: ${currentThreePicker}`
                  : 'La draft est terminée. Passe à la prochaine étape.'
                : currentPickerName
                  ? `Tour actuel: ${currentPickerName}`
                  : 'La draft est terminée. Passe à la prochaine étape.'}
            </p>

            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-sm font-semibold text-slate-100 mb-3">Choisir une équipe</p>
              {isThreePlayer ? (
                threeDraftOrder.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Générez d'abord l'ordre de draft pour commencer.
                  </p>
                ) : remainingThreeDraftTeams.length === 0 ? (
                  <p className="text-sm text-emerald-200">Toutes les équipes sont attribuées.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {remainingThreeDraftTeams.map((team) => (
                      <button
                        key={team}
                        type="button"
                        onClick={() => handlePickTeamThree(team)}
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

            {isThreePlayer ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div key={player} className="rounded-xl border border-white/15 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-slate-100 mb-2">{player}</p>
                    <p className="text-sm text-slate-300">
                      {threePickedByPlayer[player]?.length > 0
                        ? threePickedByPlayer[player].join(', ')
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
        )}

        {step === 6 && (
          <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Étape 6 - Récapitulatif</h2>

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
                            <div className="space-y-3">
                              {group.matches.map((match) => {
                                const score = threeGroupScores[`${group.name}-${match.id}`] ?? { left: '', right: '' };
                                const leftScore = getNumericScore(score.left);
                                const rightScore = getNumericScore(score.right);
                                const winnerTeam =
                                  leftScore !== null && rightScore !== null
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
                                          value={score.left ?? ''}
                                          onChange={(e) => handleUpdateThreeGroupScore(group.name, match.id, 'left', e.target.value)}
                                          className="surface-input w-28 sm:w-12 min-w-[3.5rem] text-center text-sm px-2 py-1"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={score.right ?? ''}
                                          onChange={(e) => handleUpdateThreeGroupScore(group.name, match.id, 'right', e.target.value)}
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

                            <div className="overflow-x-auto rounded-xl border border-white/15 bg-black/20 p-3">
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
                                onClick={() => team && handleChooseThreeSemiWinner(matchIndex, team)}
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
                              onClick={() => team && setThreeFinalWinner(team)}
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
                          {[match.left, match.right].map((team, teamIndex) => (
                            <button
                              key={`${team ?? `empty-${matchIndex}-${teamIndex}`}-${teamIndex}`}
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
                              key={`${team ?? `semi-empty-${matchIndex}-${teamIndex}`}-${teamIndex}`}
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
                          key={`${team ?? `final-empty-${index}`}-${index}`}
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
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={prevStep} disabled={step === 1} className="outline-btn px-4 py-2 text-sm">
            Étape précédente
          </button>
          {step === 6 ? (
            <button
              type="button"
              onClick={handleFinishTournament}
              disabled={(isThreePlayer ? !threeFinalWinner : !finalWinner) || isSavingTournament}
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
