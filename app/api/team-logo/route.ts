import { NextResponse } from 'next/server';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const logoCache = new Map<string, { logoUrl: string | null; expiresAt: number }>();

interface TheSportsDbTeam {
  strTeam?: string;
  strBadge?: string;
  strTeamBadge?: string;
  strLogo?: string;
}

interface TheSportsDbResponse {
  teams?: TheSportsDbTeam[];
}

function pickTeamLogo(team?: TheSportsDbTeam): string | null {
  if (!team) return null;
  return team.strBadge || team.strTeamBadge || team.strLogo || null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function pickBestTeamMatch(teams: TheSportsDbTeam[] | undefined, query: string): TheSportsDbTeam | undefined {
  if (!teams?.length) return undefined;

  const normalizedQuery = normalizeText(query);
  const scored = teams.map((team) => {
    const name = normalizeText(team.strTeam || '');
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

  if (!nameParam) {
    return NextResponse.json({ error: 'Missing team name' }, { status: 400 });
  }

  const cacheKey = nameParam.toLowerCase();
  const cached = logoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ team: nameParam, logoUrl: cached.logoUrl });
  }

  try {
    const endpoint = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(nameParam)}`;
    const response = await fetch(endpoint, { next: { revalidate: 86400 } });

    if (!response.ok) {
      throw new Error(`SportsDB request failed with ${response.status}`);
    }


    const payload = (await response.json()) as TheSportsDbResponse;
    const bestTeam = pickBestTeamMatch(payload.teams, nameParam);
    const logoUrl = pickTeamLogo(bestTeam);

    logoCache.set(cacheKey, {
      logoUrl,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json({ team: nameParam, logoUrl });
  } catch {
    logoCache.set(cacheKey, {
      logoUrl: null,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return NextResponse.json({ team: nameParam, logoUrl: null });
  }
}
