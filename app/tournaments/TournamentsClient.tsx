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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Historique des Tournois</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Tournois</h2>
          <ul className="space-y-4">
            {tournaments.map((tournament) => (
              <li key={tournament._id} className="border p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-medium">{tournament.name}</h3>
                    <p>Type : {formatType(tournament.type)}</p>
                    <p>Gagnant : {tournament.winner || '—'}</p>
                    <p>Date : {formatDate(tournament.date)}</p>
                    <p>Participants : {tournament.participants.join(', ')}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleEdit(tournament)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => setShowForm(true)}
            >
              Ajouter un Nouveau Tournoi
            </button>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">
                {editingId ? 'Modifier le Tournoi' : 'Ajouter un Nouveau Tournoi'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Nom du Tournoi</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as 'Minor' | 'Major' })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="Minor">Mineur</option>
                    <option value="Major">Majeur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Gagnant (optionnel)</label>
                  <select
                    value={formData.winner}
                    onChange={(e) => setFormData({ ...formData, winner: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Sélectionner le gagnant</option>
                    {formData.participants.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Participants</label>
                  <div className="mt-1 space-y-2">
                    {participantsOptions.map((p) => (
                      <label key={p} className="flex items-center">
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
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {isPending ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
