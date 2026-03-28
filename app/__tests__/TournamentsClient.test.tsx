import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ITournament } from '../../lib/models/Tournament';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { deleteTournament } from '../actions/tournaments';
import TournamentsClient from '../tournaments/TournamentsClient';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../actions/tournaments', () => ({
  deleteTournament: jest.fn(async () => undefined),
}));

const pushMock = jest.fn();

const mockTournaments: ITournament[] = [
  {
    _id: '1',
    name: 'Mini Cup',
    type: 'Minor',
    winner: 'Maxime',
    date: '2024-01-15',
    participants: ['Maxime', 'Damien'],
  },
  {
    _id: '2',
    name: 'Grand Cup',
    type: 'Major',
    winner: 'Damien',
    date: '2024-03-20',
    participants: ['Maxime', 'Damien'],
  },
  {
    _id: '3',
    name: 'Spring Tournament',
    type: 'Custom',
    winner: '',
    date: '2024-05-10',
    participants: ['Maxime', 'Damien'],
  },
];

describe('TournamentsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: null });
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
  });

  it('renders tournaments sorted by date and localized labels', () => {
    render(<TournamentsClient initialTournaments={mockTournaments} />);

    expect(screen.getByText('Historique des Tournois')).toBeInTheDocument();

    const articles = screen.getAllByRole('article');
    expect(articles[0]).toHaveTextContent('Spring Tournament');
    expect(articles[1]).toHaveTextContent('Grand Cup');
    expect(articles[2]).toHaveTextContent('Mini Cup');

    expect(screen.getByText('Majeur')).toBeInTheDocument();
    expect(screen.getByText('Créateur')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('filters tournaments by search query', async () => {
    render(<TournamentsClient initialTournaments={mockTournaments} />);

    await userEvent.type(screen.getByPlaceholderText('Rechercher un tournoi...'), 'mini');

    expect(screen.getByText('Mini Cup')).toBeInTheDocument();
    expect(screen.queryByText('Grand Cup')).not.toBeInTheDocument();
    expect(screen.queryByText('Spring Tournament')).not.toBeInTheDocument();
  });

  it('opens tournament detail when a card is clicked', async () => {
    render(<TournamentsClient initialTournaments={mockTournaments} />);

    const cards = screen.getAllByRole('article');
    await userEvent.click(cards[0]);

    expect(pushMock).toHaveBeenCalledWith('/tournaments/3');
  });

  it('hides delete action when user is not authenticated', () => {
    render(<TournamentsClient initialTournaments={mockTournaments} />);
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });

  it('does not delete when confirmation is cancelled', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Maxime' } } });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TournamentsClient initialTournaments={mockTournaments} />);

    await userEvent.click(screen.getAllByRole('button', { name: 'Supprimer' })[0]);

    expect(confirmSpy).toHaveBeenCalledWith('Supprimer ce tournoi ?');
    expect(deleteTournament).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('deletes tournament for authenticated user and keeps card click isolated', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Maxime' } } });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TournamentsClient initialTournaments={mockTournaments} />);

    const firstDeleteButton = screen.getAllByRole('button', { name: 'Supprimer' })[0];
    await userEvent.click(firstDeleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Supprimer ce tournoi ?');
    expect(deleteTournament).toHaveBeenCalledWith('3');
    expect(pushMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByText('Spring Tournament')).not.toBeInTheDocument();
    });
  });
});
