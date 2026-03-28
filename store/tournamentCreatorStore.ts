import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DraftOwner = 'winner' | 'loser';
export type PlayerSlot = 'player1' | 'player2';

interface PickedTeam {
  team: string;
  owner: DraftOwner;
}

interface TournamentCreatorStore {
  hasHydrated: boolean;
  step: number;
  tournamentName: string;
  tournamentType: 'Minor' | 'Major';
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
  setHasHydrated: (value: boolean) => void;
  setStep: (value: number) => void;
  setTournamentName: (value: string) => void;
  setTournamentType: (value: 'Minor' | 'Major') => void;
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
  resetAll: () => void;
}

const resetDraftValues = {
  pickedTeams: [] as PickedTeam[],
  quarterOrderPlayer1: [] as string[],
  quarterOrderPlayer2: [] as string[],
  quarterWinners: [null, null, null, null] as (string | null)[],
  semiWinners: [null, null] as (string | null)[],
  finalWinner: null as string | null,
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
    tournamentName: '',
    tournamentType: 'Minor' as 'Minor' | 'Major',
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
      setTournamentName: (value) => set({ tournamentName: value }),
      setTournamentType: (value) => set({ tournamentType: value }),
      setDate: (value) => set({ date: value }),
      setSelectedTeams: (teams) => {
        const unique = Array.from(new Set(teams.filter((team) => typeof team === 'string' && team.trim())));
        set({
          selectedTeams: unique.slice(0, 8),
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
          let nextSelected = state.selectedTeams;
          if (state.selectedTeams.includes(team)) {
            nextSelected = state.selectedTeams.filter((value) => value !== team);
          } else if (state.selectedTeams.length < 8) {
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
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
