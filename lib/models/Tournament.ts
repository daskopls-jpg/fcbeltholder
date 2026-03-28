import { Schema, models, model } from 'mongoose';

export interface BracketMatch {
  left: string | null;
  right: string | null;
  winner: string | null;
}

export interface TournamentCreatorData {
  bannedTiers: string[];
  bannedTeams: string[];
  coinWinner: 'Maxime' | 'Damien' | null;
  teamsByPlayer: {
    Maxime: string[];
    Damien: string[];
  };
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch;
}

export interface ITournament {
  _id?: string;
  name: string;
  type: 'Minor' | 'Major' | 'Custom';
  winner: string;
  date: string;
  participants: string[];
  creatorData?: TournamentCreatorData;
}

const TournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  type: { type: String, enum: ['Minor', 'Major', 'Custom'], required: true },
  winner: { type: String, default: '' },
  date: { type: String, required: true },
  participants: [{ type: String }],
  creatorData: {
    type: {
      bannedTiers: [{ type: String }],
      bannedTeams: [{ type: String }],
      coinWinner: { type: String, default: null },
      teamsByPlayer: {
        Maxime: [{ type: String }],
        Damien: [{ type: String }],
      },
      quarterFinals: [
        {
          left: { type: String, default: null },
          right: { type: String, default: null },
          winner: { type: String, default: null },
        },
      ],
      semiFinals: [
        {
          left: { type: String, default: null },
          right: { type: String, default: null },
          winner: { type: String, default: null },
        },
      ],
      final: {
        left: { type: String, default: null },
        right: { type: String, default: null },
        winner: { type: String, default: null },
      },
    },
    required: false,
  },
});

// In dev hot-reload, cached models can keep an outdated enum schema.
if (models.Tournament) {
  delete models.Tournament;
}

export const TournamentModel = model<ITournament>('Tournament', TournamentSchema);
