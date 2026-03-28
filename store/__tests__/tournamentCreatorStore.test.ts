import { act } from '@testing-library/react';

import { useTournamentCreatorStore } from '../tournamentCreatorStore';

const STORAGE_KEY = 'tournament-creator-process-v1';

function getTodayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resetStore() {
  act(() => {
    useTournamentCreatorStore.setState({
      hasHydrated: true,
      step: 1,
      tournamentName: '',
      date: '',
      bannedTiers: [],
      selectedTeams: [],
      coinWinnerSlot: null,
      coinResultText: '',
      pickedTeams: [],
      quarterWinners: [null, null, null, null],
      semiWinners: [null, null],
      finalWinner: null,
    });
  });
}

describe('tournamentCreatorStore persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-28T09:00:00.000Z'));
    resetStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('persists current process values in localStorage', () => {
    act(() => {
      const state = useTournamentCreatorStore.getState();
      state.setStep(4);
      state.setTournamentName('Road to Final');
      state.setDate('2026-03-28');
      state.runCoinFlip('player2');
    });

    const storedRaw = localStorage.getItem(STORAGE_KEY);
    expect(storedRaw).not.toBeNull();

    const stored = JSON.parse(storedRaw as string) as {
      state: { step: number; tournamentName: string; date: string; coinWinnerSlot: string | null };
    };

    expect(stored.state.step).toBe(4);
    expect(stored.state.tournamentName).toBe('Road to Final');
    expect(stored.state.date).toBe('2026-03-28');
    expect(stored.state.coinWinnerSlot).toBe('player2');
  });

  it('resetAll clears process state and persisted payload', () => {
    act(() => {
      useTournamentCreatorStore.setState({
        step: 5,
        tournamentName: 'To reset',
        date: '2026-03-28',
        selectedTeams: ['Real Madrid'],
        coinWinnerSlot: 'player1',
        coinResultText: 'Maxime gagne le pile ou face.',
      });
    });

    act(() => {
      useTournamentCreatorStore.getState().resetAll();
    });

    const state = useTournamentCreatorStore.getState();
    expect(state.step).toBe(1);
    expect(state.tournamentName).toBe('');
    expect(state.date).toBe(getTodayDateInputValue());
    expect(state.selectedTeams).toEqual([]);
    expect(state.coinWinnerSlot).toBeNull();
    expect(state.coinResultText).toBe('');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string) as {
      state: {
        step: number;
        tournamentName: string;
        date: string;
        selectedTeams: string[];
        coinWinnerSlot: string | null;
      };
    };

    expect(stored.state.step).toBe(1);
    expect(stored.state.tournamentName).toBe('');
    expect(stored.state.date).toBe(getTodayDateInputValue());
    expect(stored.state.selectedTeams).toEqual([]);
    expect(stored.state.coinWinnerSlot).toBeNull();
  });
});
