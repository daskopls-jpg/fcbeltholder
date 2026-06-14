import { useMemo } from 'react';
import { useTournamentCreatorStore } from '@/store/tournamentCreatorStore';
import { computeGroupStandings } from '../utils';

const draftSequence = ['winner', 'loser', 'loser', 'winner', 'winner', 'loser', 'loser', 'winner'] as const;

type DraftOwner = 'winner' | 'loser';

type Matchup = {
  left: string | null;
  right: string | null;
};

export function useCreatorSelectors(tiers: Record<string, string[]>, players: string[]) {
  const store = useTournamentCreatorStore();

  const tierEntries = useMemo(
    () =>
      Object.entries(tiers)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([tier, teams]) => ({ tier, teams })),
    [tiers]
  );

  const bannedTeamList = useMemo(() => {
    const teams = store.bannedTiers.flatMap((tier) => tiers[tier] ?? []);
    return Array.from(new Set(teams)).sort((a, b) => a.localeCompare(b));
  }, [store.bannedTiers, tiers]);

  const eligibleTeams = useMemo(() => {
    const blocked = new Set(bannedTeamList);
    const pool = Object.values(tiers).flat().filter((team) => !blocked.has(team));
    return Array.from(new Set(pool)).sort((a, b) => a.localeCompare(b));
  }, [bannedTeamList, tiers]);

  const availableForSelection = useMemo(
    () => eligibleTeams.filter((team) => !store.selectedTeams.includes(team)),
    [eligibleTeams, store.selectedTeams]
  );

  const remainingDraftTeams = useMemo(
    () => store.selectedTeams.filter((team) => !store.pickedTeams.some((p) => p.team === team)),
    [store.selectedTeams, store.pickedTeams]
  );

  const remainingThreeDraftTeams = useMemo(
    () => store.selectedTeams.filter((team) => !store.threePickedTeams.some((p) => p.team === team)),
    [store.selectedTeams, store.threePickedTeams]
  );

  const requiredTeamCount = store.playerCount === 3 ? 6 : 8;
  const hasEnoughTeamsForTournament = eligibleTeams.length >= requiredTeamCount;

  const picksByWinner = useMemo(
    () => store.pickedTeams.filter((p) => p.owner === 'winner').map((p) => p.team),
    [store.pickedTeams]
  );

  const picksByLoser = useMemo(
    () => store.pickedTeams.filter((p) => p.owner === 'loser').map((p) => p.team),
    [store.pickedTeams]
  );

  const player1Teams = useMemo(
    () =>
      store.coinWinnerSlot === 'player1'
        ? picksByWinner
        : store.coinWinnerSlot === 'player2'
        ? picksByLoser
        : [],
    [store.coinWinnerSlot, picksByWinner, picksByLoser]
  );

  const player2Teams = useMemo(
    () =>
      store.coinWinnerSlot === 'player2'
        ? picksByWinner
        : store.coinWinnerSlot === 'player1'
        ? picksByLoser
        : [],
    [store.coinWinnerSlot, picksByWinner, picksByLoser]
  );

  const coinWinnerName =
    store.coinWinnerSlot === 'player1' ? 'Maxime' : store.coinWinnerSlot === 'player2' ? 'Damien' : '';
  const coinLoserName =
    store.coinWinnerSlot === 'player1' ? 'Damien' : store.coinWinnerSlot === 'player2' ? 'Maxime' : '';
  const displayedCoinFace = store.coinWinnerSlot === 'player2' ? 'face' : 'pile';
  const displayedCoinOwner = displayedCoinFace === 'pile' ? 'Maxime' : 'Damien';

  const threePickedByPlayer = useMemo(
    () =>
      players.reduce((acc, player) => {
        acc[player] = store.threePickedTeams
          .filter((entry) => entry.player === player)
          .map((entry) => entry.team);
        return acc;
      }, {} as Record<string, string[]>),
    [players, store.threePickedTeams]
  );

  const threeGroupStandings = useMemo(
    () =>
      store.threeGroups ? store.threeGroups.map((group) => computeGroupStandings(group, store.threeGroupScores)) : [],
    [store.threeGroups, store.threeGroupScores]
  );

  const areAllScoresFilled = useMemo(() => {
    if (!store.threeGroups) return false;
    return store.threeGroups.every((group) =>
      group.matches.every((match) => {
        const score = store.threeGroupScores[`${group.name}-${match.id}`];
        const leftScore = score ? Number(score.left) : null;
        const rightScore = score ? Number(score.right) : null;
        return leftScore !== null && rightScore !== null && !Number.isNaN(leftScore) && !Number.isNaN(rightScore);
      })
    );
  }, [store.threeGroups, store.threeGroupScores]);

  const threeSemiMatches = useMemo((): Matchup[] => {
    const g1_1 = threeGroupStandings[0]?.[0]?.team ?? null;
    const g1_2 = threeGroupStandings[0]?.[1]?.team ?? null;
    const g2_1 = threeGroupStandings[1]?.[0]?.team ?? null;
    const g2_2 = threeGroupStandings[1]?.[1]?.team ?? null;

    const getOwner = (team: string | null) =>
      team ? store.threePickedTeams.find((entry) => entry.team === team)?.player : null;

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
  }, [threeGroupStandings, store.threePickedTeams]);

  const finalMatchThree = useMemo(
    () => ({ left: store.threeSemiWinners[0], right: store.threeSemiWinners[1] }),
    [store.threeSemiWinners]
  );

  const quarterPool1 = useMemo(
    () => (store.quarterOrderPlayer1.length === 4 ? store.quarterOrderPlayer1 : player1Teams),
    [store.quarterOrderPlayer1, player1Teams]
  );

  const quarterPool2 = useMemo(
    () => (store.quarterOrderPlayer2.length === 4 ? store.quarterOrderPlayer2 : player2Teams),
    [store.quarterOrderPlayer2, player2Teams]
  );

  const quarterFinals = useMemo<Matchup[]>(
    () => [
      { left: quarterPool1[0] ?? null, right: quarterPool2[0] ?? null },
      { left: quarterPool1[1] ?? null, right: quarterPool2[1] ?? null },
      { left: quarterPool1[2] ?? null, right: quarterPool2[2] ?? null },
      { left: quarterPool1[3] ?? null, right: quarterPool2[3] ?? null },
    ],
    [quarterPool1, quarterPool2]
  );

  const semiFinals = useMemo<Matchup[]>(
    () => [
      { left: store.quarterWinners[0], right: store.quarterWinners[1] },
      { left: store.quarterWinners[2], right: store.quarterWinners[3] },
    ],
    [store.quarterWinners]
  );

  const finalMatch = useMemo<Matchup>(
    () => ({ left: store.semiWinners[0], right: store.semiWinners[1] }),
    [store.semiWinners]
  );

  const currentPickIndex = store.pickedTeams.length;
  const currentOwner = (draftSequence[currentPickIndex] ?? null) as DraftOwner | null;
  const currentPickerName =
    currentOwner === 'winner'
      ? store.coinWinnerSlot === 'player1'
        ? 'Maxime'
        : 'Damien'
      : currentOwner === 'loser'
      ? store.coinWinnerSlot === 'player1'
        ? 'Damien'
        : 'Maxime'
      : null;

  const currentThreePickIndex = store.threePickedTeams.length;
  const currentThreePicker = store.threeDraftOrder[currentThreePickIndex] ?? null;

  return {
    tierEntries,
    bannedTeamList,
    eligibleTeams,
    availableForSelection,
    remainingDraftTeams,
    remainingThreeDraftTeams,
    hasEnoughTeamsForTournament,
    player1Teams,
    player2Teams,
    threePickedByPlayer,
    threeGroupStandings,
    areAllScoresFilled,
    threeSemiMatches,
    finalMatchThree,
    quarterFinals,
    semiFinals,
    finalMatch,
    currentOwner,
    currentPickerName,
    currentThreePicker,
    coinWinnerName,
    coinLoserName,
    displayedCoinFace,
    displayedCoinOwner,
  };
}
