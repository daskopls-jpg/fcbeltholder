'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const links = [
  { href: '/tournaments', label: 'Tournois' },
  { href: '/belt-holder', label: 'Ceintures' },
  { href: '/tier-list', label: 'Tier-list' },
  { href: '/tournament-creator', label: 'Générateur' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const visibleLinks = session
    ? links
    : links.filter((link) => link.href !== '/tournament-creator');

  return (
    <nav className="sticky top-0 z-50 px-4 py-3">
      <div className="section-shell glass-panel rounded-2xl px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/icon-optimized.png"
              alt="FC Belt"
              width={36}
              height={36}
              priority
            />
            <span className="font-semibold text-lg tracking-wide">Détenteurs de ceintures FC</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 md:ml-2">
          {visibleLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                pathname === href
                  ? 'bg-white/10 border-white/25 text-white'
                  : 'border-transparent text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="md:ml-auto flex items-center gap-3">
        {session ? (
          <>
            <span className="status-chip">{session.user?.name || 'Admin'}</span>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 text-sm rounded-lg bg-[var(--danger)] text-white font-semibold hover:brightness-105"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="brand-btn text-sm px-3 py-1.5"
          >
            Connexion
          </Link>
        )}
        </div>
      </div>
    </nav>
  );
}
