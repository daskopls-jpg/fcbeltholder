'use client';

import { useState, useTransition } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSession } from 'next-auth/react';
import { saveTierList } from '../actions/tierList';

const ItemTypes = {
  TEAM: 'team',
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
  }));

  return (
    <div
      ref={drag as any}
      className={`p-2 bg-gray-200 rounded mb-2 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
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
  }));

  return (
    <div
      ref={drop as any}
      className={`p-2 rounded shadow-md min-h-[300px] ${
        isOver ? 'bg-blue-100' : 'bg-white'
      }`}
    >
      <h2 className="text-xl font-semibold mb-4 text-center">{tier}</h2>
      {teams.map((team) => (
        <TeamItem key={team} team={team} tier={tier} />
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

  const moveTeam = (team: string, fromTier: number, toTier: number) => {
    if (!isAdmin) return;
    const next = { ...tiers };
    next[fromTier] = next[fromTier].filter((t) => t !== team);
    next[toTier] = [...next[toTier], team];
    setTiers(next);
    startTransition(() => saveTierList(next));
  };

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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Évaluateur d'Équipes FC (1-10)</h1>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
            >
              + Ajouter une équipe
            </button>
          )}
          {isPending && <span className="text-sm text-gray-400 ml-2">Enregistrement…</span>}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
              <h2 className="text-xl font-bold mb-4">Ajouter une équipe</h2>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                placeholder="Nom de l'équipe"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowModal(false); setNewTeamName(''); }}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddTeam}
                  disabled={!newTeamName.trim()}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-10 gap-1">
            {Object.entries(tiers).map(([tier, teams]) => (
              <TierColumn
                key={tier}
                tier={parseInt(tier)}
                teams={teams}
                moveTeam={moveTeam}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </DndProvider>
      </div>
    </div>
  );
}
