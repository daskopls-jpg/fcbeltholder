import { NextResponse } from 'next/server';
import { getTierList, type TierListMode } from '@/app/actions/tierList';

const validModes = new Set(['club', 'worldCup2026']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const modeParam = (url.searchParams.get('mode') || 'club') as TierListMode;
  const mode = validModes.has(modeParam) ? modeParam : 'club';

  try {
    const tiers = await getTierList(mode);
    return NextResponse.json({ tiers, mode });
  } catch (error) {
    console.error('Failed to load tier list for API:', error);
    return NextResponse.json({ tiers: {}, mode }, { status: 500 });
  }
}
