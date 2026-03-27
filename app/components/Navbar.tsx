'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/tournaments', label: 'Tournois' },
  { href: '/belt-holder', label: 'Ceinture' },
  { href: '/tier-list', label: 'Tier List' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex gap-6 items-center shadow-md">
      <span className="font-bold text-lg mr-4">FC Belt</span>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm font-medium hover:text-green-400 transition-colors ${
            pathname === href ? 'text-green-400 underline underline-offset-4' : 'text-gray-300'
          }`}
        >
          {label}
        </Link>
      ))}
      <div className="ml-auto flex items-center gap-3">
        {session ? (
          <>
            <span className="text-sm text-gray-400">{session.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded font-medium"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm bg-green-600 hover:bg-green-700 px-3 py-1 rounded font-medium"
          >
            Connexion
          </Link>
        )}
      </div>
    </nav>
  );
}
