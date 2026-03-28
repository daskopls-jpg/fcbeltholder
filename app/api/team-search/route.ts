import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TeamModel } from '@/lib/models/Team';
import { consumeRateLimit, getClientIp } from '@/lib/security/rateLimit';

interface TeamOption {
  name: string;
  logoUrl: string | null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function fuzzyScore(name: string, query: string): number {
  const normalizedName = normalizeText(name);
  const normalizedQuery = normalizeText(query);

  if (!normalizedName || !normalizedQuery) return 0;

  // Exact match
  if (normalizedName === normalizedQuery) return 100;

  // Starts with query
  if (normalizedName.startsWith(normalizedQuery)) return 90;

  // Query is a complete word in the name (e.g., "Bayer" in "Bayer Leverkusen")
  const nameWords = normalizedName.split(/\s+/);
  const queryWords = normalizedQuery.split(/\s+/);

  if (queryWords.every((qWord) => nameWords.some((nWord) => nWord === qWord))) {
    return 85;
  }

  // Any query word starts a name word (e.g., "bay" matches "Bayer")
  if (queryWords.every((qWord) => nameWords.some((nWord) => nWord.startsWith(qWord)))) {
    return 75;
  }

  // Query is contained as a substring
  if (normalizedName.includes(` ${normalizedQuery}`)) return 70;
  if (normalizedName.includes(normalizedQuery)) return 65;

  return 0;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('query') || '').trim();

  const ip = getClientIp(request);
  const rl = consumeRateLimit(`team-search:${ip}`, 60, 60 * 1000);
  if (rl.limited) {
    return NextResponse.json(
      { teams: [] as TeamOption[], error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    );
  }

  if (query.length < 2 || query.length > 80) {
    return NextResponse.json({ teams: [] as TeamOption[] });
  }

  try {
    await connectDB();
    const escapedQuery = escapeRegex(query);

    // Search for teams using regex (case-insensitive)
    const teams = await TeamModel.find({
      name: { $regex: escapedQuery, $options: 'i' },
    })
      .lean()
      .limit(100);

    const mapped = teams
      .map((team) => ({
        name: team.name,
        logoUrl: team.logoUrl || null,
        score: fuzzyScore(team.name, query),
      }))
      .filter((team) => team.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 20)
      .map(({ name, logoUrl }) => ({ name, logoUrl }));

    return NextResponse.json({ teams: mapped });
  } catch (error) {
    console.error('Team search error:', error);
    return NextResponse.json({ teams: [] as TeamOption[] });
  }
}
