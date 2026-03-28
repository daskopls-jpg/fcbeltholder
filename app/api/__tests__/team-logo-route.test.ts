import { connectDB } from '@/lib/mongodb';
import { TeamModel } from '@/lib/models/Team';
import { GET } from '../team-logo/route';

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
    findOne: jest.fn(),
    find: jest.fn(),
  },
}));

describe('GET /api/team-logo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when name is missing', async () => {
    const response = await GET({ url: 'http://localhost/api/team-logo' } as Request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Missing team name' });
    expect(connectDB).not.toHaveBeenCalled();
  });

  it('returns logo from exact DB match', async () => {
    (TeamModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          name: 'Bayer Leverkusen',
          logoUrl: 'https://cdn.test/bayer.png',
        }),
      }),
    });

    const response = await GET({
      url: 'http://localhost/api/team-logo?name=Bayer%20Leverkusen',
    } as Request);
    const payload = await response.json();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(TeamModel.find).not.toHaveBeenCalled();
    expect(payload).toEqual({
      team: 'Bayer Leverkusen',
      logoUrl: 'https://cdn.test/bayer.png',
    });
  });

  it('uses candidate fallback from DB when exact match is not found', async () => {
    (TeamModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    (TeamModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { name: 'Bayer Leverkusen', logoUrl: 'https://cdn.test/bayer.png' },
            { name: 'Leeds United', logoUrl: 'https://cdn.test/leeds.png' },
          ]),
        }),
      }),
    });

    const response = await GET({ url: 'http://localhost/api/team-logo?name=Bayer' } as Request);
    const payload = await response.json();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(TeamModel.find).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({
      team: 'Bayer',
      logoUrl: 'https://cdn.test/bayer.png',
    });
  });

  it('uses in-memory cache and avoids duplicate DB calls', async () => {
    (TeamModel.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          name: 'Ajax',
          logoUrl: 'https://cdn.test/ajax.png',
        }),
      }),
    });

    const first = await GET({ url: 'http://localhost/api/team-logo?name=Ajax' } as Request);
    const firstPayload = await first.json();

    const second = await GET({ url: 'http://localhost/api/team-logo?name=Ajax' } as Request);
    const secondPayload = await second.json();

    expect(firstPayload.logoUrl).toBe('https://cdn.test/ajax.png');
    expect(secondPayload.logoUrl).toBe('https://cdn.test/ajax.png');
    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(TeamModel.findOne).toHaveBeenCalledTimes(1);
  });
});
