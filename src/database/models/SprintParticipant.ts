import { Schema, model, Document, Types } from "mongoose";
import { ParticipantStatus, ParticipantBook } from "../../types";

// Verknüpft einen Nutzer mit einem Sprint. Enthält alle Bücher, die der
// Nutzer während DIESES Sprints liest (beliebig viele möglich, siehe Anforderung).
export interface ISprintParticipant extends Document {
  sprintId: Types.ObjectId;
  userId: string; // discordId
  guildId: string;

  books: ParticipantBook[];
  status: ParticipantStatus;

  xpEarned: number;

  joinedAt: Date;
  leftAt?: Date;

  // Pause-Tracking: pausedAt ist gesetzt, solange der Teilnehmer GERADE
  // pausiert (undefined sonst). totalPausedMs summiert alle ABGESCHLOSSENEN
  // Pausen (Pause -> Weiter). Wird beim Sprintabschluss von der Lesezeit
  // abgezogen, damit "wie lange war ich wirklich aktiv am Lesen" stimmt.
  pausedAt?: Date;
  totalPausedMs: number;
}

const ParticipantBookSchema = new Schema<ParticipantBook>(
  {
    title: { type: String, required: true },
    startPage: { type: Number, required: true },
    currentPage: { type: Number, required: true },
    totalPages: { type: Number, required: true },
    goalPage: { type: Number },
    isFinished: { type: Boolean, default: false },
  },
  { _id: false } // Bücher brauchen keine eigene ID, sie sind reine Sub-Dokumente
);

const SprintParticipantSchema = new Schema<ISprintParticipant>({
  sprintId: { type: Schema.Types.ObjectId, ref: "Sprint", required: true },
  userId: { type: String, required: true },
  guildId: { type: String, required: true },

  books: { type: [ParticipantBookSchema], default: [] },

  status: {
    type: String,
    enum: ["active", "paused", "left"],
    default: "active",
  },

  xpEarned: { type: Number, default: 0 },

  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },

  pausedAt: { type: Date },
  totalPausedMs: { type: Number, default: 0 },
});

// Ein Nutzer kann pro Sprint nur einmal teilnehmen.
SprintParticipantSchema.index({ sprintId: 1, userId: 1 }, { unique: true });

export const SprintParticipant = model<ISprintParticipant>(
  "SprintParticipant",
  SprintParticipantSchema
);
