import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { saveTierList } from '../actions/tierList';
import TierListClient from '../tier-list/TierListClient';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../actions/tierList', () => ({
  saveTierList: jest.fn(async () => undefined),
}));

const mockTiers: Record<string, string[]> = {
  '1': ['Real Madrid'],
  '2': [],
  '3': [],
  '4': [],
  '5': ['Barcelona', 'Manchester City'],
  '6': [],
  '7': [],
  '8': [],
  '9': [],
  '10': ['Valencia'],
};

const mockedUseSession = useSession as jest.Mock;

describe('TierListClient', () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({ data: null });
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/team-search')) {
        return {
          ok: true,
          json: async () => ({
            teams: [
              { name: 'Juventus', logoUrl: null },
              { name: 'Real Madrid', logoUrl: null },
              { name: 'Napoli', logoUrl: null },
            ],
          }),
        } as Response;
      }

      if (url.includes('/api/team-logo')) {
        return {
          ok: true,
          json: async () => ({ logoUrl: null }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });
  });

  describe('Rendering', () => {
    it('renders all 10 tier columns', () => {
      render(<TierListClient initialTiers={mockTiers} />);
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`Tier ${i}`)).toBeInTheDocument();
      }
    });

    it('renders teams inside their correct tier', () => {
      render(<TierListClient initialTiers={mockTiers} />);
      expect(screen.getByText('Real Madrid')).toBeInTheDocument();
      expect(screen.getByText('Barcelona')).toBeInTheDocument();
      expect(screen.getByText('Manchester City')).toBeInTheDocument();
      expect(screen.getByText('Valencia')).toBeInTheDocument();
    });

    it('renders the tier list interactive chip', () => {
      render(<TierListClient initialTiers={mockTiers} />);
      expect(screen.getByText('Tier-list interactive')).toBeInTheDocument();
    });
  });

  describe('Access control', () => {
    it('does not show add team button when not admin', () => {
      render(<TierListClient initialTiers={mockTiers} />);
      expect(screen.queryByText('+ Ajouter une équipe')).not.toBeInTheDocument();
    });

    it('shows add team button when admin', () => {
      mockedUseSession.mockReturnValue({ data: { user: { name: 'Admin' } } });
      render(<TierListClient initialTiers={mockTiers} />);
      expect(screen.getByText('+ Ajouter une équipe')).toBeInTheDocument();
    });

    it('does not show remove buttons when not admin', () => {
      render(<TierListClient initialTiers={mockTiers} />);
      expect(screen.queryByRole('button', { name: 'Supprimer Real Madrid' })).not.toBeInTheDocument();
    });
  });

  describe('Remove team', () => {
    beforeEach(() => {
      mockedUseSession.mockReturnValue({ data: { user: { name: 'Admin' } } });
    });

    it('removes a team from the tier list and saves', async () => {
      render(<TierListClient initialTiers={mockTiers} />);

      await userEvent.click(screen.getByRole('button', { name: 'Supprimer Real Madrid' }));

      expect(screen.queryByText('Real Madrid')).not.toBeInTheDocument();
      expect(saveTierList).toHaveBeenCalled();
    });
  });

  describe('Add team modal', () => {
    beforeEach(() => {
      mockedUseSession.mockReturnValue({ data: { user: { name: 'Admin' } } });
    });

    it('opens modal when add button is clicked', async () => {
      render(<TierListClient initialTiers={mockTiers} />);
      await userEvent.click(screen.getByText('+ Ajouter une équipe'));
      expect(screen.getByPlaceholderText('Rechercher une équipe (min. 2 caractères)')).toBeInTheDocument();
      expect(screen.getByText('Ajouter une équipe')).toBeInTheDocument();
    });

    it('closes modal when cancel is clicked', async () => {
      render(<TierListClient initialTiers={mockTiers} />);
      await userEvent.click(screen.getByText('+ Ajouter une équipe'));
      await userEvent.click(screen.getByText('Annuler'));
      expect(screen.queryByPlaceholderText('Rechercher une équipe (min. 2 caractères)')).not.toBeInTheDocument();
    });

    it('adds a new team and closes modal', async () => {
      render(<TierListClient initialTiers={mockTiers} />);
      await userEvent.click(screen.getByText('+ Ajouter une équipe'));
      await userEvent.type(screen.getByPlaceholderText('Rechercher une équipe (min. 2 caractères)'), 'ju');
      await userEvent.click(screen.getByRole('option', { name: 'Juventus' }));
      await userEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
      expect(screen.getByText('Juventus')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Rechercher une équipe (min. 2 caractères)')).not.toBeInTheDocument();
    });

    it('does not add a duplicate team', async () => {
      render(<TierListClient initialTiers={mockTiers} />);
      await userEvent.click(screen.getByText('+ Ajouter une équipe'));
      await userEvent.type(screen.getByPlaceholderText('Rechercher une équipe (min. 2 caractères)'), 'real');
      expect(screen.getByPlaceholderText('Rechercher une équipe (min. 2 caractères)')).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Real Madrid' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled();
      expect(screen.getAllByText('Real Madrid')).toHaveLength(1);
    });

    it('submit button is disabled when input is empty', async () => {
      render(<TierListClient initialTiers={mockTiers} />);
      await userEvent.click(screen.getByText('+ Ajouter une équipe'));
      expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled();
    });

    it('clears input when cancel is clicked', async () => {
      render(<TierListClient initialTiers={mockTiers} />);
      await userEvent.click(screen.getByText('+ Ajouter une équipe'));
      await userEvent.type(screen.getByPlaceholderText('Rechercher une équipe (min. 2 caractères)'), 'ju');
      await userEvent.click(screen.getByText('Annuler'));
      // Reopen — input should be empty
      await userEvent.click(screen.getByText('+ Ajouter une équipe'));
      expect(screen.getByPlaceholderText('Rechercher une équipe (min. 2 caractères)')).toHaveValue('');
    });
  });
});
