import type { GroupStage } from '@/store/tournamentCreatorStore';

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildThreeDraftOrder(players: string[]) {
  const order = shuffle(players);
  return [order[0], order[1], order[2], order[2], order[1], order[0]];
}

export function getNumericScore(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface GroupStanding {
  team: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export function computeGroupStandings(
  group: GroupStage,
  threeGroupScores: Record<string, { left: string; right: string }>
): GroupStanding[] {
  const stats = group.teams.reduce<Record<string, GroupStanding>>((acc, team) => {
    acc[team] = { team, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 };
    return acc;
  }, {} as Record<string, GroupStanding>);

  group.matches.forEach((match) => {
    const score = threeGroupScores[`${group.name}-${match.id}`];
    const leftScore = score ? getNumericScore(score.left) : null;
    const rightScore = score ? getNumericScore(score.right) : null;

    if (leftScore === null || rightScore === null) return;

    stats[match.left].goalsFor += leftScore;
    stats[match.left].goalsAgainst += rightScore;
    stats[match.right].goalsFor += rightScore;
    stats[match.right].goalsAgainst += leftScore;

    if (leftScore > rightScore) {
      stats[match.left].points += 3;
    } else if (leftScore < rightScore) {
      stats[match.right].points += 3;
    } else {
      stats[match.left].points += 1;
      stats[match.right].points += 1;
    }
  });

  return Object.values(stats)
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
    }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
}

export function formatDisplayDate(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
