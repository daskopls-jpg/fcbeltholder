import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TeamModel } from '@/lib/models/Team';
import { consumeRateLimit, getClientIp } from '@/lib/security/rateLimit';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const logoCache = new Map<string, { logoUrl: string | null; expiresAt: number }>();

function setCachedLogo(key: string, logoUrl: string | null): void {
  if (logoCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = logoCache.keys().next().value;
    if (oldestKey) logoCache.delete(oldestKey);
  }

  logoCache.set(key, {
    logoUrl,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function pickBestTeamMatch(
  teams: Array<{ name?: string; logoUrl?: string | null }> | undefined,
  query: string
): { name?: string; logoUrl?: string | null } | undefined {
  if (!teams?.length) return undefined;

  const normalizedQuery = normalizeText(query);
  const scored = teams.map((team) => {
    const name = normalizeText(team.name || '');
    let score = 0;
    if (!name) score = 0;
    else if (name === normalizedQuery) score = 100;
    else if (name.startsWith(normalizedQuery)) score = 80;
    else if (name.includes(` ${normalizedQuery}`)) score = 65;
    else if (name.includes(normalizedQuery)) score = 50;
    return { team, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.team;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nameParam = (url.searchParams.get('name') || '').trim();

  const ip = getClientIp(request);
  const rl = consumeRateLimit(`team-logo:${ip}`, 80, 60 * 1000);
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    );
  }

  if (!nameParam || nameParam.length > 120) {
    return NextResponse.json({ error: 'Missing team name' }, { status: 400 });
  }

  const cacheKey = nameParam.toLowerCase();
  const cached = logoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ team: nameParam, logoUrl: cached.logoUrl });
  }

  try {
    await connectDB();

    const escaped = nameParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exact = await TeamModel.findOne({
      name: { $regex: `^${escaped}$`, $options: 'i' },
    })
      .select({ name: 1, logoUrl: 1 })
      .lean();

    let logoUrl: string | null = exact?.logoUrl || null;

    if (!exact) {
      const candidates = await TeamModel.find({
        name: { $regex: escaped, $options: 'i' },
      })
        .select({ name: 1, logoUrl: 1 })
        .limit(30)
        .lean();

      const bestTeam = pickBestTeamMatch(candidates, nameParam);
      logoUrl = bestTeam?.logoUrl || null;
    }

    setCachedLogo(cacheKey, logoUrl);

    return NextResponse.json({ team: nameParam, logoUrl });
  } catch {
    setCachedLogo(cacheKey, null);
    return NextResponse.json({ team: nameParam, logoUrl: null });
  }
}
