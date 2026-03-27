import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ITournament } from '../../lib/models/Tournament';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../actions/tournaments', () => ({
  addTournament: jest.fn(),
  updateTournament: jest.fn(async () => undefined),
}));

const TournamentsClient = require('../tournaments/TournamentsClient').default;

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
    type: 'Minor',
    winner: '',
    date: '2024-05-10',
    participants: ['Maxime', 'Damien'],
  },
];

const { useSession } = require('next-auth/react');

describe('TournamentsClient', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: null });
  });

  describe('Rendering', () => {
    it('renders the page title', () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      expect(screen.getByText('Historique des Tournois')).toBeInTheDocument();
    });

    it('renders all tournaments', () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      expect(screen.getByText('Mini Cup')).toBeInTheDocument();
      expect(screen.getByText('Grand Cup')).toBeInTheDocument();
      expect(screen.getByText('Spring Tournament')).toBeInTheDocument();
    });

    it('renders tournaments sorted by date descending', () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      const articles = screen.getAllByRole('article');
      expect(articles[0]).toHaveTextContent('Spring Tournament');
      expect(articles[1]).toHaveTextContent('Grand Cup');
      expect(articles[2]).toHaveTextContent('Mini Cup');
    });

    it('displays type labels correctly', () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      expect(screen.getAllByText('Mineur')).toHaveLength(2);
      expect(screen.getByText('Majeur')).toBeInTheDocument();
    });

    it('displays winner name when present', () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      expect(screen.getByText('Maxime')).toBeInTheDocument();
      expect(screen.getByText('Damien')).toBeInTheDocument();
    });

    it('displays dash when no winner', () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders an empty list without crashing', () => {
      render(<TournamentsClient initialTournaments={[]} />);
      expect(screen.getByText('Historique des Tournois')).toBeInTheDocument();
      expect(screen.queryAllByRole('article')).toHaveLength(0);
    });
  });

  describe('Access control', () => {
    it('hides add and edit buttons when not admin', () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      expect(screen.queryByText('Ajouter un tournoi')).not.toBeInTheDocument();
      expect(screen.queryByText('Modifier')).not.toBeInTheDocument();
    });

    it('shows add button and edit buttons when admin', () => {
      useSession.mockReturnValue({ data: { user: { name: 'Admin' } } });
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      expect(screen.getByText('Ajouter un tournoi')).toBeInTheDocument();
      expect(screen.getAllByText('Modifier')).toHaveLength(mockTournaments.length);
    });
  });

  describe('Search', () => {
    it('renders the search input', () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      expect(screen.getByPlaceholderText('Rechercher un tournoi...')).toBeInTheDocument();
    });

    it('filters tournaments by name', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      await userEvent.type(screen.getByPlaceholderText('Rechercher un tournoi...'), 'Cup');
      expect(screen.getByText('Mini Cup')).toBeInTheDocument();
      expect(screen.getByText('Grand Cup')).toBeInTheDocument();
      expect(screen.queryByText('Spring Tournament')).not.toBeInTheDocument();
    });

    it('is case-insensitive', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      await userEvent.type(screen.getByPlaceholderText('Rechercher un tournoi...'), 'mini');
      expect(screen.getByText('Mini Cup')).toBeInTheDocument();
      expect(screen.queryByText('Grand Cup')).not.toBeInTheDocument();
    });

    it('shows no results when nothing matches', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      await userEvent.type(screen.getByPlaceholderText('Rechercher un tournoi...'), 'xyz123');
      expect(screen.queryAllByRole('article')).toHaveLength(0);
    });

    it('restores all tournaments when search is cleared', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      const input = screen.getByPlaceholderText('Rechercher un tournoi...');
      await userEvent.type(input, 'Cup');
      await userEvent.clear(input);
      expect(screen.getAllByRole('article')).toHaveLength(mockTournaments.length);
    });
  });

  describe('Add form', () => {
    beforeEach(() => {
      useSession.mockReturnValue({ data: { user: { name: 'Admin' } } });
    });

    it('opens add form when button is clicked', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      await userEvent.click(screen.getByText('Ajouter un tournoi'));
      expect(screen.getByText('Ajouter un Nouveau Tournoi')).toBeInTheDocument();
    });

    it('closes form when cancel is clicked', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      await userEvent.click(screen.getByText('Ajouter un tournoi'));
      await userEvent.click(screen.getByText('Annuler'));
      expect(screen.queryByText('Ajouter un Nouveau Tournoi')).not.toBeInTheDocument();
    });

    it('shows required field indicators', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      await userEvent.click(screen.getByText('Ajouter un tournoi'));
      const asterisks = screen.getAllByText('*');
      expect(asterisks).toHaveLength(3); // Nom, Type, Date
    });
  });

  describe('Edit form', () => {
    beforeEach(() => {
      useSession.mockReturnValue({ data: { user: { name: 'Admin' } } });
    });

    it('opens edit form pre-filled with tournament data', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      // Articles sorted by date desc — Spring Tournament is first
      const editBtns = screen.getAllByText('Modifier');
      await userEvent.click(editBtns[0]);
      expect(screen.getByText('Modifier le Tournoi')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Spring Tournament')).toBeInTheDocument();
    });

    it('shows correct title for edit vs create', async () => {
      render(<TournamentsClient initialTournaments={mockTournaments} />);
      // Add (create) form
      await userEvent.click(screen.getByText('Ajouter un tournoi'));
      expect(screen.getByText('Ajouter un Nouveau Tournoi')).toBeInTheDocument();
      await userEvent.click(screen.getByText('Annuler'));

      // Edit form
      const editBtns = screen.getAllByText('Modifier');
      await userEvent.click(editBtns[0]);
      expect(screen.getByText('Modifier le Tournoi')).toBeInTheDocument();
    });
  });
});
