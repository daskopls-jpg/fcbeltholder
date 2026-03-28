import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TournamentCreatorClient from '../tournament-creator/TournamentCreatorClient';
import { useTournamentCreatorStore } from '../../store/tournamentCreatorStore';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

jest.mock('../actions/tournaments', () => ({
  createTournamentFromCreator: jest.fn(async () => ({ _id: 'mock-id' })),
}));

const mockTiers: Record<string, string[]> = {
  '1': ['Real Madrid'],
  '2': ['Barcelona'],
  '3': ['Liverpool'],
  '4': ['Arsenal'],
  '5': ['Manchester City', 'Inter Milan'],
  '6': ['Juventus'],
  '7': ['PSG'],
  '8': ['Bayern Munich'],
  '9': ['Dortmund'],
  '10': ['Milan'],
};

function resetCreatorStore() {
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

describe('TournamentCreatorClient', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useRealTimers();
    resetCreatorStore();
  });

  it('resets the current tournament process from the reset button', async () => {
    act(() => {
      useTournamentCreatorStore.setState({
        step: 3,
        tournamentName: 'Summer Cup',
        date: '2026-03-28',
        bannedTiers: ['1', '2'],
        selectedTeams: ['Real Madrid', 'Barcelona'],
      });
    });

    render(<TournamentCreatorClient tiers={mockTiers} />);

    expect(screen.getByText('Étape 3 / 5')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser le tournoi' }));

    expect(screen.getByText('Étape 1 / 5')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: Ligue de Printemps')).toHaveValue('');
  });

  it('shows a consistent animated coin result and winner text', async () => {
    jest.useFakeTimers();
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.2);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    act(() => {
      useTournamentCreatorStore.setState({ step: 3 });
    });

    render(<TournamentCreatorClient tiers={mockTiers} />);

    const launchButton = screen.getByRole('button', { name: 'Lancer la pièce' });
    await user.click(launchButton);

    expect(screen.getByText('La piece tourne...')).toBeInTheDocument();
    expect(screen.getByText('Lancement en cours...')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    const coinButton = screen.getByRole('button', { name: 'Lancer la piece' });

    expect(screen.getByText('Resultat actuel: Maxime')).toBeInTheDocument();
    expect(coinButton).toHaveTextContent('Maxime');
    expect(screen.getByText('Maxime gagne le pile ou face.')).toBeInTheDocument();
    expect(screen.queryByText('Resultat actuel: Damien')).not.toBeInTheDocument();

    randomSpy.mockRestore();
  });
});
