import { connectDB } from '@/lib/mongodb';
import { TeamModel } from '@/lib/models/Team';
import { GET } from '../team-search/route';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (payload: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => payload,
    }),
  },
}));

jest.mock('@/lib/mongodb', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/lib/models/Team', () => ({
  TeamModel: {
    find: jest.fn(),
  },
}));

describe('GET /api/team-search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty list for short queries', async () => {
    const response = await GET({ url: 'http://localhost/api/team-search?query=a' } as Request);
    const payload = await response.json();

    expect(payload).toEqual({ teams: [] });
    expect(connectDB).not.toHaveBeenCalled();
    expect(TeamModel.find).not.toHaveBeenCalled();
  });

  it('escapes regex characters before Mongo query', async () => {
    const limitMock = jest.fn().mockResolvedValue([]);
    const leanMock = jest.fn().mockReturnValue({ limit: limitMock });
    (TeamModel.find as jest.Mock).mockReturnValue({ lean: leanMock });

    await GET({ url: 'http://localhost/api/team-search?query=PSG(' } as Request);

    expect(TeamModel.find).toHaveBeenCalledWith({
      name: { $regex: 'PSG\\(', $options: 'i' },
    });
  });

  it('returns ranked results based on fuzzy scoring', async () => {
    const rows = [
      { name: 'Bayern Munich', logoUrl: 'https://cdn.test/bayern.png' },
      { name: 'Bayer Leverkusen', logoUrl: 'https://cdn.test/bayer.png' },
      { name: 'Real Madrid', logoUrl: 'https://cdn.test/real.png' },
    ];

    const limitMock = jest.fn().mockResolvedValue(rows);
    const leanMock = jest.fn().mockReturnValue({ limit: limitMock });
    (TeamModel.find as jest.Mock).mockReturnValue({ lean: leanMock });

    const response = await GET({ url: 'http://localhost/api/team-search?query=bay' } as Request);
    const payload = (await response.json()) as { teams: Array<{ name: string; logoUrl: string | null }> };

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(payload.teams.map((team) => team.name)).toEqual([
      'Bayer Leverkusen',
      'Bayern Munich',
    ]);
  });

  it('limits output to 20 teams', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      name: `Bayer Team ${i + 1}`,
      logoUrl: null,
    }));

    const limitMock = jest.fn().mockResolvedValue(rows);
    const leanMock = jest.fn().mockReturnValue({ limit: limitMock });
    (TeamModel.find as jest.Mock).mockReturnValue({ lean: leanMock });

    const response = await GET({ url: 'http://localhost/api/team-search?query=bayer' } as Request);
    const payload = (await response.json()) as { teams: Array<{ name: string; logoUrl: string | null }> };

    expect(payload.teams).toHaveLength(20);
  });
});
