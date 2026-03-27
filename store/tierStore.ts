import { create } from 'zustand';

const initialTeams = [
  'Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Chelsea',
  'Bayern Munich', 'Borussia Dortmund', 'Paris Saint-Germain', 'Juventus', 'Inter Milan',
];

const initialTiers: Record<string, string[]> = {
  '1': [],
  '2': [],
  '3': [],
  '4': [],
  '5': initialTeams,
  '6': [],
  '7': [],
  '8': [],
  '9': [],
  '10': [],
};

interface TierStore {
  tiers: Record<string, string[]>;
  moveTeam: (team: string, fromTier: number, toTier: number) => void;
  addTeam: (name: string) => void;
}

export const useTierStore = create<TierStore>((set, get) => ({
  tiers: initialTiers,

  moveTeam: (team, fromTier, toTier) => {
    set((state) => {
      const newTiers = { ...state.tiers };
      newTiers[fromTier] = newTiers[fromTier].filter((t) => t !== team);
      newTiers[toTier] = [...newTiers[toTier], team];
      return { tiers: newTiers };
    });
  },

  addTeam: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const allTeams = Object.values(get().tiers).flat();
    if (allTeams.includes(trimmed)) return;
    set((state) => ({
      tiers: {
        ...state.tiers,
        '5': [...state.tiers['5'], trimmed],
      },
    }));
  },
}));
