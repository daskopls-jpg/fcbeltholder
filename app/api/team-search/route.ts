import { NextResponse } from 'next/server';

interface TheSportsDbTeam {
  strTeam?: string;
  strBadge?: string;
  strTeamBadge?: string;
  strLogo?: string;
}

interface TheSportsDbResponse {
  teams?: TheSportsDbTeam[];
}

interface TeamOption {
  name: string;
  logoUrl: string | null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function buildQueryVariants(rawQuery: string): string[] {
  const query = rawQuery.trim();
  const normalized = normalizeText(query);
  const variants = new Set<string>([query]);

  const aliases: Record<string, string[]> = {
    atletico: ['Atletico Madrid', 'Atletico Mineiro', 'Atletico Nacional'],
  };

  for (const [key, values] of Object.entries(aliases)) {
    if (normalized.includes(key)) {
      for (const value of values) variants.add(value);
    }
  }

  return [...variants];
}

function rankTeam(name: string, query: string): number {
  const normalizedName = normalizeText(name);
  const normalizedQuery = normalizeText(query);

  if (!normalizedName || !normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 100;
  if (normalizedName.startsWith(normalizedQuery)) return 80;
  if (normalizedName.includes(` ${normalizedQuery}`)) return 65;
  if (normalizedName.includes(normalizedQuery)) return 50;
  return 0;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('query') || '').trim();

  if (query.length < 2) {
    return NextResponse.json({ teams: [] as TeamOption[] });
  }

  try {
    const variants = buildQueryVariants(query);
    const responses = await Promise.all(
      variants.map(async (variant) => {
        const endpoint = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(variant)}`;
        const response = await fetch(endpoint, { next: { revalidate: 3600 } });
        if (!response.ok) return [] as TheSportsDbTeam[];
        const payload = (await response.json()) as TheSportsDbResponse;
        return payload.teams ?? [];
      })
    );

    const teams = responses.flat();

    const seen = new Set<string>();
    const mapped = teams
      .map((team) => {
        const name = (team.strTeam || '').trim();
        const logoUrl = team.strBadge || team.strTeamBadge || team.strLogo || null;
        return { name, logoUrl };
      })
      .filter((team) => team.name)
      .filter((team) => {
        const key = team.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((team) => ({
        ...team,
        score: rankTeam(team.name, query),
      }))
      .filter((team) => team.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 20)
      .map(({ name, logoUrl }) => ({ name, logoUrl }));

    return NextResponse.json({ teams: mapped });
  } catch {
    return NextResponse.json({ teams: [] as TeamOption[] });
  }
}
