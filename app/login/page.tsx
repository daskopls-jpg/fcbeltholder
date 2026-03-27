'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError('Identifiants incorrects.');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen px-4 flex items-center justify-center">
      <div className="glass-panel rounded-2xl p-8 w-full max-w-sm">
        <p className="status-chip mx-auto w-fit mb-4">Espace Administration</p>
        <h1 className="text-3xl font-bold mb-6 text-center">Connexion</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="surface-input"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="surface-input"
              required
            />
          </div>
          {error && <p className="text-rose-300 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="brand-btn w-full py-2.5 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  );
}
