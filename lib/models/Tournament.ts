import mongoose, { Schema, models, model } from 'mongoose';

export interface ITournament {
  _id?: string;
  name: string;
  type: 'Minor' | 'Major';
  winner: string;
  date: string;
  participants: string[];
}

const TournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  type: { type: String, enum: ['Minor', 'Major'], required: true },
  winner: { type: String, default: '' },
  date: { type: String, required: true },
  participants: [{ type: String }],
});

export const TournamentModel =
  models.Tournament || model<ITournament>('Tournament', TournamentSchema);
