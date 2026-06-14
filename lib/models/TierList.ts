import mongoose, { Schema, models, model } from 'mongoose';

// Stores { tier: string, teams: string[] }[] as a single document
export interface ITierList {
  tiers: Record<string, string[]>;
  mode?: string;
}

const TierListSchema = new Schema<ITierList>({
  tiers: { type: Schema.Types.Mixed, required: true },
  mode: { type: String, default: 'club', index: true },
});

export const TierListModel =
  models.TierList || model<ITierList>('TierList', TierListSchema);
