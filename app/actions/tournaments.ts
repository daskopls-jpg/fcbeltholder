'use server';

import { connectDB } from '@/lib/mongodb';
import { TournamentModel, type ITournament } from '@/lib/models/Tournament';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error('Non autorisé');
}

export async function getTournaments(): Promise<ITournament[]> {
  await connectDB();
  const docs = await TournamentModel.find().sort({ date: -1 }).lean();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }));
}

export async function addTournament(
  data: Omit<ITournament, '_id'>
): Promise<ITournament> {
  await requireAuth();
  await connectDB();
  const doc = await TournamentModel.create(data);
  revalidatePath('/tournaments');
  revalidatePath('/belt-holder');
  return { ...doc.toObject(), _id: doc._id.toString() };
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
