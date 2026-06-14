import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getWorldCupTeamFlag } from '@/lib/worldCup';

export { getWorldCupTeamFlag };

interface WorldCupStore {
  isWorldCup2026: boolean;
  setWorldCup2026: (value: boolean) => void;
  toggleWorldCup2026: () => void;
}

const storage = typeof window === 'undefined' ? undefined : createJSONStorage(() => localStorage);

export const useWorldCupStore = create<WorldCupStore>()(
  persist(
    (set) => ({
      isWorldCup2026: false,
      setWorldCup2026: (value: boolean) => set({ isWorldCup2026: value }),
      toggleWorldCup2026: () => set((state) => ({ isWorldCup2026: !state.isWorldCup2026 })),
    }),
    {
      name: 'world-cup-2026',
      storage,
    }
  )
);
