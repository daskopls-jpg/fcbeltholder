import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DraftOwner = 'winner' | 'loser';
export type PlayerSlot = 'player1' | 'player2';

export interface PickedTeam {
  team: string;
  owner: DraftOwner;
}

export interface GroupMatch {
  id: string;
  left: string;
  right: string;
  winner: string | null;
}

export interface GroupStage {
  name: string;
  teams: string[];
  matches: GroupMatch[];
}

export interface TournamentCreatorStore {
  hasHydrated: boolean;
  step: number;
  playerCount: 2 | 3 | null;
  tournamentName: string;
  tournamentType: 'Minor' | 'Major' | 'Ceinture Unifiée';
  date: string;
  bannedTiers: string[];
  selectedTeams: string[];
  coinWinnerSlot: PlayerSlot | null;
  coinResultText: string;
  pickedTeams: PickedTeam[];
  quarterOrderPlayer1: string[];
  quarterOrderPlayer2: string[];
  quarterWinners: (string | null)[];
  semiWinners: (string | null)[];
  finalWinner: string | null;
  threeDraftOrder: string[];
  threePickedTeams: { team: string; player: string }[];
  threeGroups: GroupStage[] | null;
  threeGroupScores: Record<string, { left: string; right: string }>;
  threeSemiWinners: [string | null, string | null];
  threeFinalWinner: string | null;
  setHasHydrated: (value: boolean) => void;
  setStep: (value: number) => void;
  setPlayerCount: (value: 2 | 3 | null) => void;
  setTournamentName: (value: string) => void;
  setTournamentType: (value: 'Minor' | 'Major' | 'Ceinture Unifiée') => void;
  setDate: (value: string) => void;
  setSelectedTeams: (teams: string[]) => void;
  toggleTierBan: (tier: string) => void;
  toggleSelectedTeam: (team: string) => void;
  sanitizeSelectionAgainstBans: (allowedTeams: string[]) => void;
  runCoinFlip: (winner?: PlayerSlot) => void;
  setCoinWinnerSlot: (value: PlayerSlot | null) => void;
  setCoinResultText: (value: string) => void;
  resetDraft: () => void;
  generateQuarterFinalOrder: (player1Teams: string[], player2Teams: string[]) => void;
  pickTeam: (team: string, owner: DraftOwner) => void;
  chooseQuarterWinner: (matchIndex: number, winner: string) => void;
  chooseSemiWinner: (matchIndex: number, winner: string) => void;
  setFinalWinner: (winner: string | null) => void;
  setThreeDraftOrder: (order: string[]) => void;
  setThreePickedTeams: (picks: { team: string; player: string }[]) => void;
  appendThreePickedTeam: (team: string, player: string) => void;
  setThreeGroups: (groups: GroupStage[] | null) => void;
  setThreeGroupScores: (scores: Record<string, { left: string; right: string }>) => void;
  updateThreeGroupScore: (groupName: string, matchId: string, side: 'left' | 'right', value: string) => void;
  setThreeSemiWinners: (winners: [string | null, string | null]) => void;
  setThreeFinalWinner: (winner: string | null) => void;
  resetAll: () => void;
}

const resetDraftValues = {
  pickedTeams: [] as PickedTeam[],
  quarterOrderPlayer1: [] as string[],
  quarterOrderPlayer2: [] as string[],
  quarterWinners: [null, null, null, null] as (string | null)[],
  semiWinners: [null, null] as (string | null)[],
  finalWinner: null as string | null,
  threeDraftOrder: [] as string[],
  threePickedTeams: [] as { team: string; player: string }[],
  threeGroups: null as GroupStage[] | null,
  threeGroupScores: {} as Record<string, { left: string; right: string }>,
  threeSemiWinners: [null, null] as [string | null, string | null],
  threeFinalWinner: null as string | null,
};

function getTodayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getInitialCreatorState() {
  return {
    step: 1,
    playerCount: null as 2 | 3 | null,
    tournamentName: '',
    tournamentType: 'Minor' as 'Minor' | 'Major' | 'Ceinture Unifiée',
    date: getTodayDateInputValue(),
    bannedTiers: [] as string[],
    selectedTeams: [] as string[],
    coinWinnerSlot: null as PlayerSlot | null,
    coinResultText: '',
    ...resetDraftValues,
  };
}

export const useTournamentCreatorStore = create<TournamentCreatorStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      ...getInitialCreatorState(),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setStep: (value) => set({ step: value }),
      setPlayerCount: (value) => {
        set({
          playerCount: value,
          selectedTeams: [],
          coinWinnerSlot: null,
          coinResultText: '',
          ...resetDraftValues,
        });
      },
      setTournamentName: (value) => set({ tournamentName: value }),
      setTournamentType: (value) => set({ tournamentType: value }),
      setDate: (value) => set({ date: value }),
      setSelectedTeams: (teams) => {
        const maxSelection = get().playerCount === 3 ? 6 : 8;
        const unique = Array.from(new Set(teams.filter((team) => typeof team === 'string' && team.trim())));
        set({
          selectedTeams: unique.slice(0, maxSelection),
          coinWinnerSlot: null,
          coinResultText: '',
          ...resetDraftValues,
        });
      },
      toggleTierBan: (tier) => {
        set((state) => {
          const exists = state.bannedTiers.includes(tier);
          return {
            bannedTiers: exists
              ? state.bannedTiers.filter((value) => value !== tier)
              : [...state.bannedTiers, tier],
          };
        });
      },
      toggleSelectedTeam: (team) => {
        set((state) => {
          const maxSelection = state.playerCount === 3 ? 6 : 8;
          let nextSelected = state.selectedTeams;
          if (state.selectedTeams.includes(team)) {
            nextSelected = state.selectedTeams.filter((value) => value !== team);
          } else if (state.selectedTeams.length < maxSelection) {
            nextSelected = [...state.selectedTeams, team];
          }

          return {
            selectedTeams: nextSelected,
            coinWinnerSlot: null,
            coinResultText: '',
            ...resetDraftValues,
          };
        });
      },
      sanitizeSelectionAgainstBans: (allowedTeams) => {
        set((state) => {
          const allowed = new Set(allowedTeams);
          const nextSelected = state.selectedTeams.filter((team) => allowed.has(team));
          if (nextSelected.length === state.selectedTeams.length) return {};
          return {
            selectedTeams: nextSelected,
            coinWinnerSlot: null,
            coinResultText: '',
            ...resetDraftValues,
          };
        });
      },
      runCoinFlip: (winnerOverride) => {
        const winner: PlayerSlot = winnerOverride ?? (Math.random() < 0.5 ? 'player1' : 'player2');
        set({
          coinWinnerSlot: winner,
          coinResultText: `${winner === 'player1' ? 'Maxime' : 'Damien'} gagne le pile ou face.`,
          ...resetDraftValues,
        });
      },
      setCoinWinnerSlot: (value) => set({ coinWinnerSlot: value }),
      setCoinResultText: (value) => set({ coinResultText: value }),
      resetDraft: () => set({ ...resetDraftValues }),
      generateQuarterFinalOrder: (player1Teams, player2Teams) => {
        if (player1Teams.length !== 4 || player2Teams.length !== 4) return;

        const shuffle = (teams: string[]) => {
          const copy = [...teams];
          for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
          }
          return copy;
        };

        set({
          quarterOrderPlayer1: shuffle(player1Teams),
          quarterOrderPlayer2: shuffle(player2Teams),
          quarterWinners: [null, null, null, null],
          semiWinners: [null, null],
          finalWinner: null,
        });
      },
      pickTeam: (team, owner) => {
        const state = get();
        if (state.pickedTeams.some((pick) => pick.team === team)) return;
        set((current) => ({ pickedTeams: [...current.pickedTeams, { team, owner }] }));
      },
      chooseQuarterWinner: (matchIndex, winner) => {
        set((state) => {
          const nextQuarter = [...state.quarterWinners];
          nextQuarter[matchIndex] = winner;

          const nextSemis = [...state.semiWinners];
          if (matchIndex <= 1) nextSemis[0] = null;
          if (matchIndex >= 2) nextSemis[1] = null;

          return {
            quarterWinners: nextQuarter,
            semiWinners: nextSemis,
            finalWinner: null,
          };
        });
      },
      chooseSemiWinner: (matchIndex, winner) => {
        set((state) => {
          const nextSemis = [...state.semiWinners];
          nextSemis[matchIndex] = winner;
          return { semiWinners: nextSemis, finalWinner: null };
        });
      },
      setFinalWinner: (winner) => set({ finalWinner: winner }),
      setThreeDraftOrder: (order) => set({ threeDraftOrder: order }),
      setThreePickedTeams: (picks) => set({ threePickedTeams: picks }),
      appendThreePickedTeam: (team, player) =>
        set((state) => ({ threePickedTeams: [...state.threePickedTeams, { team, player }] })),
      setThreeGroups: (groups) => set({ threeGroups: groups }),
      setThreeGroupScores: (scores) => set({ threeGroupScores: scores }),
      updateThreeGroupScore: (groupName, matchId, side, value) =>
        set((state) => ({
          threeGroupScores: {
            ...state.threeGroupScores,
            [`${groupName}-${matchId}`]: {
              ...state.threeGroupScores[`${groupName}-${matchId}`],
              [side]: value,
            },
          },
        })),
      setThreeSemiWinners: (winners) => set({ threeSemiWinners: winners }),
      setThreeFinalWinner: (winner) => set({ threeFinalWinner: winner }),
      resetAll: () => {
        set({
          ...getInitialCreatorState(),
          hasHydrated: true,
        });
      },
    }),
    {
      name: 'tournament-creator-process-v1',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as Record<string, unknown>;
        if (!state || typeof state !== 'object') return persistedState;

        const currentDate = getTodayDateInputValue();
        const rawDate = state.date;
        const hasValidDate = typeof rawDate === 'string' && rawDate.trim().length > 0;

        if (hasValidDate) return persistedState;

        return {
          ...state,
          date: currentDate,
        };
      },
      partialize: (state) => ({
        step: state.step,
        playerCount: state.playerCount,
        tournamentName: state.tournamentName,
        tournamentType: state.tournamentType,
        date: state.date,
        bannedTiers: state.bannedTiers,
        selectedTeams: state.selectedTeams,
        coinWinnerSlot: state.coinWinnerSlot,
        coinResultText: state.coinResultText,
        pickedTeams: state.pickedTeams,
        quarterOrderPlayer1: state.quarterOrderPlayer1,
        quarterOrderPlayer2: state.quarterOrderPlayer2,
        quarterWinners: state.quarterWinners,
        semiWinners: state.semiWinners,
        finalWinner: state.finalWinner,
        threeDraftOrder: state.threeDraftOrder,
        threePickedTeams: state.threePickedTeams,
        threeGroups: state.threeGroups,
        threeGroupScores: state.threeGroupScores,
        threeSemiWinners: state.threeSemiWinners,
        threeFinalWinner: state.threeFinalWinner,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
