'use client';

import { useState, useTransition, useCallback, useEffect, type Ref } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSession } from 'next-auth/react';
import { saveTierList } from '../actions/tierList';

const ItemTypes = {
  TEAM: 'team',
};

const tierStyles: Record<number, string> = {
  1: 'bg-yellow-400/30',
  2: 'bg-teal-500/20',
  3: 'bg-cyan-500/20',
  4: 'bg-sky-500/20',
  5: 'bg-blue-500/20',
  6: 'bg-indigo-500/20',
  7: 'bg-violet-500/20',
  8: 'bg-fuchsia-500/20',
  9: 'bg-rose-500/20',
  10: 'bg-red-500/20',
};

interface TeamItemProps {
  team: string;
  tier: number;
  logoUrl: string | null;
  isAdmin: boolean;
  onRemoveTeam: (team: string, tier: number) => void;
}

function TeamItem({ team, tier, logoUrl, isAdmin, onRemoveTeam }: TeamItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TEAM,
    item: { team, tier },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [team, tier]);

  const initials = team
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  return (
    <div
      ref={drag as unknown as Ref<HTMLDivElement>}
      className={`p-2.5 bg-white/10 border border-white/15 rounded-lg mb-2 cursor-grab active:cursor-grabbing text-sm transition flex items-center gap-2 ${
        isDragging ? 'opacity-50 scale-[1.02]' : 'hover:bg-white/15'
      }`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${team} logo`}
          className="h-6 w-6 rounded-full bg-white/90 object-contain p-0.5"
          loading="lazy"
        />
      ) : (
        <div className="h-6 w-6 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold flex items-center justify-center text-slate-200">
          {initials || '?'}
        </div>
      )}
      <span>{team}</span>
      {isAdmin && (
        <button
          type="button"
          onClick={() => onRemoveTeam(team, tier)}
          className="ml-auto h-7 w-7 rounded border border-red-300/30 text-red-100 hover:bg-red-500/20 inline-flex items-center justify-center"
          aria-label={`Supprimer ${team}`}
          title={`Supprimer ${team}`}
        >
          x
        </button>
      )}
    </div>
  );
}

interface TierColumnProps {
  tier: number;
  teams: string[];
  teamLogos: Record<string, string | null>;
  moveTeam: (team: string, fromTier: number, toTier: number) => void;
  removeTeam: (team: string, tier: number) => void;
  isAdmin: boolean;
}

function TierColumn({ tier, teams, teamLogos, moveTeam, removeTeam, isAdmin }: TierColumnProps) {
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
      ref={drop as unknown as Ref<HTMLDivElement>}
      className={`p-2.5 rounded-xl border min-h-[120px] ${tierStyles[tier]} ${
        isOver ? 'border-cyan-300/70 shadow-[0_0_0_2px_rgba(103,232,249,0.25)]' : 'border-white/20'
      }`}
    >
      <h2 className="text-base font-semibold mb-3 text-center">Tier {tier}</h2>
      {teams.map((team, idx) => (
        <TeamItem
          key={`${tier}-${team}-${idx}`}
          team={team}
          tier={tier}
          logoUrl={teamLogos[team] ?? null}
          isAdmin={isAdmin}
          onRemoveTeam={removeTeam}
        />
      ))}
    </div>
  );
}

interface Props {
  initialTiers: Record<string, string[]>;
}

interface TeamOption {
  name: string;
  logoUrl: string | null;
}

export default function TierListClient({ initialTiers }: Props) {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const [tiers, setTiers] = useState(initialTiers);
  const [showModal, setShowModal] = useState(false);
  const [teamQuery, setTeamQuery] = useState('');
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [teamLogos, setTeamLogos] = useState<Record<string, string | null>>({});
  const [isPending, startTransition] = useTransition();

  const resetAddTeamModal = () => {
    setTeamQuery('');
    setTeamOptions([]);
    setSelectedTeamName('');
    setShowModal(false);
  };

  useEffect(() => {
    let cancelled = false;

    const allTeams = Array.from(new Set(Object.values(tiers).flat()));
    const missingTeams = allTeams.filter((team) => !(team in teamLogos));
    if (missingTeams.length === 0) return;

    const fetchLogos = async () => {
      const pairs = await Promise.all(
        missingTeams.map(async (team) => {
          try {
            const response = await fetch(`/api/team-logo?name=${encodeURIComponent(team)}`);
            if (!response.ok) return [team, null] as const;
            const payload = (await response.json()) as { logoUrl?: string | null };
            return [team, payload.logoUrl ?? null] as const;
          } catch {
            return [team, null] as const;
          }
        })
      );

      if (cancelled) return;
      setTeamLogos((prev) => {
        const next = { ...prev };
        for (const [team, logoUrl] of pairs) next[team] = logoUrl;
        return next;
      });
    };

    fetchLogos();
    return () => {
      cancelled = true;
    };
  }, [tiers, teamLogos]);

  useEffect(() => {
    if (!showModal) return;

    const query = teamQuery.trim();
    if (query.length < 2) {
      setTeamOptions([]);
      setSelectedTeamName('');
      return;
    }

    let cancelled = false;

    const fetchTeamOptions = async () => {
      setIsSearchingTeams(true);
      try {
        const response = await fetch(`/api/team-search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
          if (!cancelled) setTeamOptions([]);
          return;
        }

        const payload = (await response.json()) as { teams?: TeamOption[] };
        const existingTeams = new Set(Object.values(tiers).flat());
        const options = (payload.teams ?? []).filter((team) => !existingTeams.has(team.name));

        if (!cancelled) {
          setTeamOptions(options);
          if (!options.some((team) => team.name === selectedTeamName)) {
            setSelectedTeamName('');
          }
        }
      } catch {
        if (!cancelled) setTeamOptions([]);
      } finally {
        if (!cancelled) setIsSearchingTeams(false);
      }
    };

    fetchTeamOptions();
    return () => {
      cancelled = true;
    };
  }, [showModal, teamQuery, tiers, selectedTeamName]);

  const moveTeam = useCallback((team: string, fromTier: number, toTier: number) => {
    if (!isAdmin) return;
    const fromKey = String(fromTier);
    const toKey = String(toTier);
    const next = { ...tiers };
    next[fromKey] = next[fromKey].filter((t) => t !== team);
    next[toKey] = [...next[toKey], team];
    setTiers(next);
    startTransition(() => saveTierList(next));
  }, [tiers, isAdmin]);

  const handleAddTeam = () => {
    const name = selectedTeamName.trim();
    if (!name) return;
    const allTeams = Object.values(tiers).flat();
    if (allTeams.includes(name)) return;
    const next = { ...tiers, '5': [...tiers['5'], name] };
    setTiers(next);
    startTransition(() => saveTierList(next));
    resetAddTeamModal();
  };

  const removeTeam = useCallback((team: string, tier: number) => {
    if (!isAdmin) return;

    const key = String(tier);
    const next = {
      ...tiers,
      [key]: tiers[key].filter((candidate) => candidate !== team),
    };

    setTiers(next);
    startTransition(() => saveTierList(next));
  }, [tiers, isAdmin]);

  return (
    <main className="px-4 pb-10 pt-8 md:pt-10">
      <section className="section-shell">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <p className="status-chip mb-2">Tier-list interactive</p>
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
                value={teamQuery}
                onChange={(e) => setTeamQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedTeamName && !isSearchingTeams) {
                    e.preventDefault();
                    handleAddTeam();
                  }
                }}
                placeholder="Rechercher une équipe (min. 2 caractères)"
                className="surface-input mb-4"
                autoFocus
              />
              <div className="mb-4">
                {isSearchingTeams && (
                  <p className="text-xs text-slate-300 mb-2">Recherche en cours...</p>
                )}

                {!isSearchingTeams && teamQuery.trim().length >= 2 && teamOptions.length === 0 && (
                  <p className="text-xs text-slate-400 mb-2">Aucune équipe trouvée.</p>
                )}

                {!isSearchingTeams && teamOptions.length > 0 && (
                  <ul className="max-h-52 overflow-auto rounded-lg border border-white/15 bg-black/20" role="listbox" aria-label="Suggestions d'équipes">
                    {teamOptions.map((team) => {
                      const isSelected = selectedTeamName === team.name;
                      return (
                        <li key={team.name}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeamName(team.name);
                              setTeamQuery(team.name);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition ${
                              isSelected
                                ? 'bg-cyan-400/20 text-white'
                                : 'text-slate-200 hover:bg-white/10'
                            }`}
                            role="option"
                            aria-selected={isSelected}
                          >
                            {team.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={resetAddTeamModal}
                  className="outline-btn px-4 py-2"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddTeam}
                  disabled={!selectedTeamName || isSearchingTeams}
                  className="brand-btn px-4 py-2 disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        <DndProvider backend={HTML5Backend}>
          <div className="glass-panel rounded-2xl p-3 md:p-4 overflow-hidden">
            <div className="grid grid-cols-1 gap-3">
            {Object.entries(tiers).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([tier, teams]) => (
              <TierColumn
                key={tier}
                tier={parseInt(tier)}
                teams={teams}
                teamLogos={teamLogos}
                moveTeam={moveTeam}
                removeTeam={removeTeam}
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
