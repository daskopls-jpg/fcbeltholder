'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useWorldCupStore } from '@/store/worldCupStore';

const links = [
  { href: '/tournaments', label: 'Tournois' },
  { href: '/belt-holder', label: 'Ceintures' },
  { href: '/tier-list', label: 'Tier-list' },
  { href: '/tournament-creator', label: 'Générateur' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isWorldCup2026, toggleWorldCup2026 } = useWorldCupStore();
  const visibleLinks = session
    ? links
    : links.filter((link) => link.href !== '/tournament-creator');

  return (
    <nav className="sticky top-0 z-50 w-full px-4 py-3">
      <div className="glass-panel rounded-2xl px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 w-full">
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
          <button
            type="button"
            aria-pressed={isWorldCup2026}
            onClick={toggleWorldCup2026}
            className={`flex items-center gap-3 rounded-full border px-3 py-1.5 transition ${
              isWorldCup2026
                ? 'bg-emerald-500/10 border-emerald-300/30 text-emerald-100'
                : 'border-white/15 text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex flex-col text-left leading-tight">
              <span className="text-sm font-semibold">CDM 2026 Mode</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                {isWorldCup2026 ? 'On' : 'Off'}
              </span>
            </div>
            <span
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                isWorldCup2026 ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  isWorldCup2026 ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
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
