'use server';

import { connectDB } from '@/lib/mongodb';
import { TournamentModel, type ITournament } from '@/lib/models/Tournament';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error('Non autorisé');
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return asString(value);
}

function toClientTournament(doc: unknown): ITournament {
  console.log(doc)
  const record = asRecord(doc);
  const creatorDataRecord = asRecord(record.creatorData);
  const teamsByPlayerRecord = asRecord(creatorDataRecord.teamsByPlayer);
  const finalRecord = asRecord(creatorDataRecord.final);

  const mapMatchArray = (value: unknown) =>
    Array.isArray(value)
      ? value.map((match) => {
          const m = asRecord(match);
          return {
            left: asNullableString(m.left),
            right: asNullableString(m.right),
            winner: asNullableString(m.winner),
          };
        })
      : [];

  const teamsByPlayer = Object.entries(teamsByPlayerRecord).reduce<Record<string, string[]>>((acc, [player, value]) => ({
    ...acc,
    [player]: Array.isArray(value) ? value.map(asString) : [],
  }), {});

  return {
    _id: asString(record._id),
    name: asString(record.name),
    type: asString(record.type) as ITournament['type'],
    winner: asString(record.winner ?? ''),
    date: asString(record.date),
    teamsByPlayer: teamsByPlayer,
    participants: Array.isArray(record.participants) ? record.participants.map(asString) : [],
    isWorldCup2026: record.isWorldCup2026 === true,
    creatorData: record.creatorData
      ? {
          bannedTiers: Array.isArray(creatorDataRecord.bannedTiers)
            ? creatorDataRecord.bannedTiers.map(asString)
            : [],
          bannedTeams: Array.isArray(creatorDataRecord.bannedTeams)
            ? creatorDataRecord.bannedTeams.map(asString)
            : [],
          coinWinner:
            creatorDataRecord.coinWinner === 'Maxime' || creatorDataRecord.coinWinner === 'Damien'
              ? creatorDataRecord.coinWinner
              : null,
          playerCount:
            typeof creatorDataRecord.playerCount === 'number'
              ? (creatorDataRecord.playerCount as 2 | 3)
              : undefined,
          players: Array.isArray(creatorDataRecord.players)
            ? creatorDataRecord.players.map(asString)
            : undefined,
          draftOrder: Array.isArray(creatorDataRecord.draftOrder)
            ? creatorDataRecord.draftOrder.map(asString)
            : undefined,
          teamsByPlayer,
          groupStage: Array.isArray(creatorDataRecord.groupStage)
            ? creatorDataRecord.groupStage.map((group) => {
                const g = asRecord(group);
                return {
                  name: asString(g.name),
                  teams: Array.isArray(g.teams) ? g.teams.map(asString) : [],
                  matches: mapMatchArray(g.matches),
                };
              })
            : undefined,
          groupScores: asRecord(creatorDataRecord.groupScores) as Record<string, { left: string; right: string }>,
          quarterFinals: mapMatchArray(creatorDataRecord.quarterFinals),
          semiFinals: mapMatchArray(creatorDataRecord.semiFinals),
          final: {
            left: asNullableString(finalRecord.left),
            right: asNullableString(finalRecord.right),
            winner: asNullableString(finalRecord.winner),
          },
        }
      : undefined,
  };
}

export async function getTournaments(): Promise<ITournament[]> {
  try {
    await connectDB();
    const docs = await TournamentModel.find()
      .select({ name: 1, type: 1, winner: 1, date: 1, participants: 1, creatorData: 1, isWorldCup2026: 1 })
      .sort({ date: -1 })
      .limit(200)
      .lean();
    return docs.map((d) => toClientTournament(d));
  } catch (error) {
    console.error('Failed to load tournaments from MongoDB.', error);
    return [];
  }
}

export async function getTournamentById(id: string): Promise<ITournament | null> {
  try {
    await connectDB();
    const doc = await TournamentModel.findById(id).lean();
    if (!doc) return null;
    return toClientTournament(doc);
  } catch (error) {
    console.error('Failed to load tournament detail from MongoDB.', error);
    return null;
  }
}

export async function addTournament(
  data: Omit<ITournament, '_id'>
): Promise<ITournament> {
  await requireAuth();
  await connectDB();
  const doc = await TournamentModel.create(data);
  revalidatePath('/tournaments');
  revalidatePath('/belt-holder');
  return toClientTournament(doc.toObject());
}

export async function updateTournament(
  id: string,
  data: Omit<ITournament, '_id'>
): Promise<void> {
  await requireAuth();
  await connectDB();
  await TournamentModel.findByIdAndUpdate(id, data);
  revalidatePath('/tournaments');
  revalidatePath('/belt-holder');
}

export async function createTournamentFromCreator(
  data: Omit<ITournament, '_id'>
): Promise<ITournament> {
  await requireAuth();
  await connectDB();
  const doc = await TournamentModel.create(data);
  revalidatePath('/tournaments');
  revalidatePath('/belt-holder');
  revalidatePath('/tournament-creator');
  return toClientTournament(doc.toObject());
}

export async function deleteTournament(id: string): Promise<void> {
  await requireAuth();
  await connectDB();
  await TournamentModel.findByIdAndDelete(id);
  revalidatePath('/tournaments');
  revalidatePath('/belt-holder');
}
