import React from 'react';

interface Props {
  playerCount: 2 | 3 | null;
  setPlayerCount: (v: 2 | 3 | null) => void;
  setStep: (n: number) => void;
}

export default function ModeStep({ playerCount, setPlayerCount, setStep }: Props) {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-5">
      <h2 className="text-2xl font-semibold">Étape 1 - Choisir le format</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: 'Deux joueurs',
            description: 'Conserver le flux classique avec 8 équipes, pile ou face et draft.',
            mode: 2,
          },
          {
            title: 'Trois joueurs',
            description: 'Nouvelle version en poules, 6 équipes et draft à 3 joueurs.',
            mode: 3,
          },
        ].map((option) => {
          const active = playerCount === option.mode;
          return (
            <button
              key={option.title}
              type="button"
              onClick={() => {
                setPlayerCount(option.mode as 2 | 3);
                setStep(2);
              }}
              className={`w-full rounded-3xl border p-6 text-left transition ${
                active
                  ? 'border-cyan-300/70 bg-cyan-400/10 text-white'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              <p className="text-lg font-semibold mb-2">{option.title}</p>
              <p className="text-sm text-slate-300">{option.description}</p>
              {active && <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-200">Sélectionné</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
