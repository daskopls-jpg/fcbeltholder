import mongoose, { Schema, models, model } from 'mongoose';

export interface ITeam {
  name: string;
  country: string;
  logoUrl: string | null;
  createdAt?: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, index: true },
    country: { type: String, required: true, index: true },
    logoUrl: { type: String, default: null },
  },
  { timestamps: true }
);

// Unique index on name to avoid duplicates
TeamSchema.index({ name: 1 }, { unique: true });

export const TeamModel = models.Team || model<ITeam>('Team', TeamSchema);
