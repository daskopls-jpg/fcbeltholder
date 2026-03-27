'use client';

import { useState, useTransition, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSession } from 'next-auth/react';
import { saveTierList } from '../actions/tierList';

const ItemTypes = {
  TEAM: 'team',
};

const tierStyles: Record<number, string> = {
  1: 'from-emerald-300/30 to-emerald-500/10',
  2: 'from-teal-300/30 to-teal-500/10',
  3: 'from-cyan-300/30 to-cyan-500/10',
  4: 'from-sky-300/30 to-sky-500/10',
  5: 'from-blue-300/30 to-blue-500/10',
  6: 'from-indigo-300/30 to-indigo-500/10',
  7: 'from-violet-300/30 to-violet-500/10',
  8: 'from-fuchsia-300/30 to-fuchsia-500/10',
  9: 'from-rose-300/30 to-rose-500/10',
  10: 'from-amber-300/30 to-amber-500/10',
};

interface TeamItemProps {
  team: string;
  tier: number;
}

function TeamItem({ team, tier }: TeamItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TEAM,
    item: { team, tier },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [team, tier]);

  return (
    <div
      ref={drag as any}
      className={`p-2.5 bg-white/10 border border-white/15 rounded-lg mb-2 cursor-grab active:cursor-grabbing text-sm transition ${
        isDragging ? 'opacity-50 scale-[1.02]' : 'hover:bg-white/15'
      }`}
    >
      {team}
    </div>
  );
}

interface TierColumnProps {
  tier: number;
  teams: string[];
  moveTeam: (team: string, fromTier: number, toTier: number) => void;
  isAdmin: boolean;
}

function TierColumn({ tier, teams, moveTeam, isAdmin }: TierColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TEAM,
    canDrop: () => isAdmin,
    drop: (item: { team: string; tier: number }) => {
      if (item.tier !== tier) {
        moveTeam(item.team, item.tier, tier);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  }), [isAdmin, tier, moveTeam]);

  return (
    <div
      ref={drop as any}
      className={`p-2.5 rounded-xl border min-h-[320px] bg-gradient-to-b ${tierStyles[tier]} ${
        isOver ? 'border-cyan-300/70 shadow-[0_0_0_2px_rgba(103,232,249,0.25)]' : 'border-white/20'
      }`}
    >
      <h2 className="text-base font-semibold mb-3 text-center">Tier {tier}</h2>
      {teams.map((team, idx) => (
        <TeamItem key={`${tier}-${team}-${idx}`} team={team} tier={tier} />
      ))}
    </div>
  );
}

interface Props {
  initialTiers: Record<string, string[]>;
}

export default function TierListClient({ initialTiers }: Props) {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const [tiers, setTiers] = useState(initialTiers);
  const [showModal, setShowModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isPending, startTransition] = useTransition();

  const moveTeam = useCallback((team: string, fromTier: number, toTier: number) => {
    if (!isAdmin) return;
    const next = { ...tiers };
    next[fromTier] = next[fromTier].filter((t) => t !== team);
    next[toTier] = [...next[toTier], team];
    setTiers(next);
    startTransition(() => saveTierList(next));
  }, [tiers, isAdmin]);

  const handleAddTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    const allTeams = Object.values(tiers).flat();
    if (allTeams.includes(name)) return;
    const next = { ...tiers, '5': [...tiers['5'], name] };
    setTiers(next);
    startTransition(() => saveTierList(next));
    setNewTeamName('');
    setShowModal(false);
  };

  return (
    <main className="px-4 pb-10 pt-8 md:pt-10">
      <section className="section-shell">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <p className="status-chip mb-2">Classement Interactif</p>
            <h1 className="text-4xl md:text-5xl font-bold">Evaluateur d'Equipes FC</h1>
          </div>

          <div className="flex items-center gap-3">
            {isPending && <span className="status-chip">Enregistrement...</span>}
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
                className="brand-btn px-4 py-2 text-sm"
            >
              + Ajouter une équipe
            </button>
          )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 px-4">
            <div className="glass-panel rounded-2xl p-6 w-full max-w-sm shadow-lg">
              <h2 className="text-xl font-bold mb-4">Ajouter une équipe</h2>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                placeholder="Nom de l'équipe"
                className="surface-input mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowModal(false); setNewTeamName(''); }}
                  className="outline-btn px-4 py-2"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddTeam}
                  disabled={!newTeamName.trim()}
                  className="brand-btn px-4 py-2 disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        <DndProvider backend={HTML5Backend}>
          <div className="glass-panel rounded-2xl p-3 md:p-4 overflow-x-auto">
            <div className="min-w-[980px] grid grid-cols-10 gap-2">
            {Object.entries(tiers).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([tier, teams]) => (
              <TierColumn
                key={tier}
                tier={parseInt(tier)}
                teams={teams}
                moveTeam={moveTeam}
                isAdmin={isAdmin}
              />
            ))}
            </div>
          </div>
        </DndProvider>
      </section>
    </main>
  );
}
