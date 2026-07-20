import { Schema, model, Document } from "mongoose";
import { SprintStatus } from "../../types";

// Der eigentliche Sprint-Vorgang. Teilnehmer werden NICHT hier eingebettet,
// sondern in der separaten SprintParticipant-Collection referenziert
// (siehe Begründung in Schritt 2 der Planung: Performance bei vielen Teilnehmern/Updates).
export interface ISprint extends Document {
  guildId: string;
  channelId: string;
  messageId?: string; // ID des öffentlichen "Beitreten"-Embeds
  graceMessageId?: string; // ID der Kulanzzeit-Ankündigung
  reminderMessageIds: string[]; // von der ScheduledSprint übernommene Erinnerungs-Nachrichten

  // Ergebnis-Nachrichten (paginiert) werden BEWUSST NICHT vom Cleanup-Job
  // gelöscht (siehe checkMessageCleanup in jobs/scheduler.ts) - das
  // Abschluss-Leaderboard soll dauerhaft stehen bleiben.
  resultsMessageId?: string;
  resultsChannelId?: string; // Kanal, in dem die Ergebnisse gepostet wurden (kann vom Sprint-Kanal abweichen)
  resultsSnapshot?: unknown[]; // gespeicherte ParticipantResult[] für Pagination nach dem Posten

  status: SprintStatus;

  startTime: Date;
  duration: number; // in Minuten
  endTime?: Date;
  graceEndTime?: Date; // Ende der Kulanzzeit nach Sprintende, in der noch aktualisiert werden darf
  messagesCleanedUp: boolean; // true, sobald die Kanal-Nachrichten aufgeräumt wurden

  createdBy: string; // discordId

  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>(
  {
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String },
    graceMessageId: { type: String },
    reminderMessageIds: { type: [String], default: [] },

    resultsMessageId: { type: String },
    resultsChannelId: { type: String },
    resultsSnapshot: { type: Schema.Types.Mixed },

    status: {
      type: String,
      enum: ["pending", "active", "grace", "ended"],
      default: "pending",
    },

    startTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    endTime: { type: Date },
    graceEndTime: { type: Date },
    messagesCleanedUp: { type: Boolean, default: false },

    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Wird vom Cleanup-Job genutzt, um beendete, noch nicht aufgeräumte Sprints zu finden.
SprintSchema.index({ status: 1, endTime: 1, messagesCleanedUp: 1 });

SprintSchema.index({ guildId: 1, status: 1 });

export const Sprint = model<ISprint>("Sprint", SprintSchema);
