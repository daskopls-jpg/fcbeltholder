import { Schema, models, model } from 'mongoose';

export interface BracketMatch {
  left: string | null;
  right: string | null;
  winner: string | null;
}

export interface TournamentCreatorData {
  bannedTiers: string[];
  bannedTeams: string[];
  coinWinner?: 'Maxime' | 'Damien' | null;
  playerCount?: 2 | 3;
  players?: string[];
  draftOrder?: string[];
  teamsByPlayer: Record<string, string[]>;
  groupStage?: {
    name: string;
    teams: string[];
    matches: BracketMatch[];
  }[];
  groupScores?: Record<string, { left: string; right: string }>;
  quarterFinals?: BracketMatch[];
  semiFinals?: BracketMatch[];
  final: BracketMatch;
}

export interface ITournament {
  _id?: string;
  name: string;
  type: 'Minor' | 'Major' | 'Custom' | 'Ceinture Unifiée';
  winner: string;
  date: string;
  participants: string[];
  creatorData?: TournamentCreatorData;
}

const TournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  type: { type: String, enum: ['Minor', 'Major', 'Custom', 'Ceinture Unifiée'], required: true },
  winner: { type: String, default: '' },
  date: { type: String, required: true },
  participants: [{ type: String }],
  creatorData: {
    type: Schema.Types.Mixed,
    required: false,
  },
});

TournamentSchema.index({ date: -1 });

// In dev hot-reload, cached models can keep an outdated enum schema.
if (models.Tournament) {
  delete models.Tournament;
}

export const TournamentModel = model<ITournament>('Tournament', TournamentSchema);
