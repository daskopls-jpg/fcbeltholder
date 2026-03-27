import { create } from 'zustand';

export interface Tournament {
  id: number;
  name: string;
  type: 'Minor' | 'Major';
  winner: string;
  date: string;
  participants: string[];
}

interface TournamentStore {
  tournaments: Tournament[];
  addTournament: (data: Omit<Tournament, 'id'>) => void;
  updateTournament: (id: number, data: Omit<Tournament, 'id'>) => void;
  // Derived: latest winner per belt type
  getBeltHolder: (type: 'Minor' | 'Major') => { holder: string; since: string } | null;
}

const initialTournaments: Tournament[] = [
  {
    id: 1,
    name: 'Mini Tournament 1',
    type: 'Minor',
    winner: 'Maxime',
    date: '2023-10-01',
    participants: ['Maxime', 'Damien'],
  },
  {
    id: 2,
    name: 'Major Cup',
    type: 'Major',
    winner: 'Damien',
    date: '2023-11-15',
    participants: ['Maxime', 'Damien'],
  },
];

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: initialTournaments,

  addTournament: (data) => {
    set((state) => ({
      tournaments: [...state.tournaments, { id: Date.now(), ...data }],
    }));
  },

  updateTournament: (id, data) => {
    set((state) => ({
      tournaments: state.tournaments.map((t) => (t.id === id ? { id, ...data } : t)),
    }));
  },

  getBeltHolder: (type) => {
    const relevant = get()
      .tournaments.filter((t) => t.type === type && t.winner)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!relevant.length) return null;
    return { holder: relevant[0].winner, since: relevant[0].date };
  },
}));
