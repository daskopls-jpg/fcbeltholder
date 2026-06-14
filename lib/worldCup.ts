// Empty skeleton for world-cup tiers. Real data must come from the DB via `getTierList`.
export function emptyWorldCupTiers(): Record<string, string[]> {
  return {
    '1': [], '2': [], '3': [], '4': [], '5': [],
    '6': [], '7': [], '8': [], '9': [], '10': [],
  };
}

export const WORLD_CUP_2026_TEAM_FLAG_CODES: Record<string, string> = {
  'Argentine': 'ar',
  'Australie': 'au',
  'Algérie': 'dz',
  'Allemagne': 'de',
  'Angleterre': 'gb-eng',
  'Arabie Saoudite': 'sa',
  'Autriche': 'at',
  'Belgique': 'be',
  'Bosnie-Herzégovine': 'ba',
  'Brésil': 'br',
  'Canada': 'ca',
  'Cap-Vert': 'cv',
  'Colombie': 'co',
  'Côte d\'Ivoire': 'ci',
  'Corée du Sud': 'kr',
  'Croatie': 'hr',
  'Curaçao': 'cw',
  'Égypte': 'eg',
  'Écosse': 'gb-sct',
  'Équateur': 'ec',
  'Espagne': 'es',
  'France': 'fr',
  'Ghana': 'gh',
  'Haïti': 'ht',
  'Irak': 'iq',
  'Iran': 'ir',
  'Japon': 'jp',
  'Jordanie': 'jo',
  'Maroc': 'ma',
  'Mexique': 'mx',
  'Norvège': 'no',
  'Nouvelle-Zélande': 'nz',
  'Pays-Bas': 'nl',
  'Panama': 'pa',
  'Paraguay': 'py',
  'Portugal': 'pt',
  'Qatar': 'qa',
  'République tchèque': 'cz',
  'RD Congo': 'cd',
  'Sénégal': 'sn',
  'Suède': 'se',
  'Suisse': 'ch',
  'Tunisie': 'tn',
  'Turquie': 'tr',
  'Uruguay': 'uy',
  'Afrique du Sud': 'za',
  'États-Unis': 'us',
  'Ouzbékistan': 'uz',
  // alias often found in seed
  'Pays-Nas': 'nl',
};

function normalizeTeamName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘'`"\u2018\u2019]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const WORLD_CUP_2026_TEAM_FLAG_CODES_NORMALIZED: Record<string, string> = Object.fromEntries(
  Object.entries(WORLD_CUP_2026_TEAM_FLAG_CODES).map(([team, code]) => [normalizeTeamName(team), code])
);

function flagUrlForCode(code: string): string {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

export const getWorldCupTeamFlagUrl = (team: string): string | null => {
  const directCode = WORLD_CUP_2026_TEAM_FLAG_CODES[team];
  const code = directCode ?? WORLD_CUP_2026_TEAM_FLAG_CODES_NORMALIZED[normalizeTeamName(team)];
  return code ? flagUrlForCode(code) : null;
};

export const getWorldCupTeamFlag = (team: string): string | null => {
  const code = WORLD_CUP_2026_TEAM_FLAG_CODES[team] ?? WORLD_CUP_2026_TEAM_FLAG_CODES_NORMALIZED[normalizeTeamName(team)];
  return code ? `https://flagcdn.com/w40/${code.toLowerCase()}.png` : null;
};

export type TierListMode = 'club' | 'worldCup2026';
