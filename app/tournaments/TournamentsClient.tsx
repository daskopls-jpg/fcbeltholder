'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import {
  addTournament,
  updateTournament,
} from '../actions/tournaments';
import type { ITournament } from '../../lib/models/Tournament';

const participantsOptions = ['Maxime', 'Damien'];

const emptyForm = {
  name: '',
  type: 'Minor' as 'Minor' | 'Major',
  date: '',
  winner: '',
  participants: ['Maxime', 'Damien'] as string[],
};

const formatDate = (dateString: string) =>
  new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR');

const formatType = (type: string) =>
  type === 'Minor' ? 'Mineur' : 'Majeur';

interface Props {
  initialTournaments: ITournament[];
}

export default function TournamentsClient({ initialTournaments }: Props) {
  const { data: session } = useSession();
  const isAdmin = !!session;

  const [tournaments, setTournaments] = useState<ITournament[]>(initialTournaments);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();
  const sortedTournaments = [...tournaments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const resetForm = () => {
    setFormData(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date) return;

    startTransition(async () => {
      if (editingId) {
        await updateTournament(editingId, formData);
        setTournaments((prev) =>
          prev.map((t) => (t._id === editingId ? { ...t, ...formData } : t))
        );
      } else {
        const created = await addTournament(formData);
        setTournaments((prev) => [...prev, created]);
      }
      resetForm();
    });
  };

  const handleEdit = (tournament: ITournament) => {
    setFormData({
      name: tournament.name,
      type: tournament.type,
      date: tournament.date,
      winner: tournament.winner,
      participants: [...tournament.participants],
    });
    setEditingId(tournament._id!);
    setShowForm(true);
  };

  const handleParticipantChange = (participant: string, checked: boolean) => {
    setFormData({
      ...formData,
      participants: checked
        ? [...formData.participants, participant]
        : formData.participants.filter((p) => p !== participant),
    });
  };

  return (
    <main className="px-4 pb-10 pt-8 md:pt-10">
      <section className="section-shell">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
          <div>
            <p className="status-chip mb-2">Base De Matchs</p>
            <h1 className="text-4xl md:text-5xl font-bold">Historique des Tournois</h1>
          </div>
          <div className="flex items-center gap-3">
            {isPending && <span className="status-chip">Enregistrement...</span>}
            {isAdmin && (
              <button
                className="brand-btn px-4 py-2 text-sm"
                onClick={() => setShowForm(true)}
              >
                Ajouter un tournoi
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedTournaments.map((tournament) => (
            <article key={tournament._id} className="glass-panel rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{tournament.name}</h2>
                  <p className="text-slate-300 text-sm mt-1">{formatDate(tournament.date)}</p>
                </div>
                <span className="status-chip">{formatType(tournament.type)}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <p>
                  Gagnant: <span className="font-semibold">{tournament.winner || '—'}</span>
                </p>
                <p>Participants: {tournament.participants.join(', ')}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleEdit(tournament)}
                  className="outline-btn mt-4 px-3 py-1.5 text-sm"
                >
                  Modifier
                </button>
              )}
            </article>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 px-4">
            <div className="glass-panel p-6 rounded-2xl shadow-lg max-w-md w-full">
              <h3 className="text-2xl font-semibold mb-4">
                {editingId ? 'Modifier le Tournoi' : 'Ajouter un Nouveau Tournoi'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200">Nom du Tournoi</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="surface-input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as 'Minor' | 'Major' })
                    }
                    className="surface-input mt-1"
                    required
                  >
                    <option value="Minor">Mineur</option>
                    <option value="Major">Majeur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="surface-input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">Gagnant (optionnel)</label>
                  <select
                    value={formData.winner}
                    onChange={(e) => setFormData({ ...formData, winner: e.target.value })}
                    className="surface-input mt-1"
                  >
                    <option value="">Sélectionner le gagnant</option>
                    {formData.participants.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">Participants</label>
                  <div className="mt-1 space-y-2">
                    {participantsOptions.map((p) => (
                      <label key={p} className="flex items-center text-sm text-slate-200">
                        <input
                          type="checkbox"
                          checked={formData.participants.includes(p)}
                          onChange={(e) => handleParticipantChange(p, e.target.checked)}
                          className="mr-2"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="outline-btn px-4 py-2"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="brand-btn px-4 py-2 disabled:opacity-50"
                  >
                    {isPending ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
