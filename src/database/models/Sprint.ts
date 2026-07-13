import { Schema, model, Document } from "mongoose";
import { SprintStatus } from "../../types";

// Der eigentliche Sprint-Vorgang. Teilnehmer werden NICHT hier eingebettet,
// sondern in der separaten SprintParticipant-Collection referenziert
// (siehe Begründung in Schritt 2 der Planung: Performance bei vielen Teilnehmern/Updates).
export interface ISprint extends Document {
  guildId: string;
  channelId: string;
  messageId?: string; // ID des öffentlichen "Beitreten"-Embeds

  status: SprintStatus;

  startTime: Date;
  duration: number; // in Minuten
  endTime?: Date;

  createdBy: string; // discordId

  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>(
  {
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String },

    status: {
      type: String,
      enum: ["pending", "active", "ended"],
      default: "pending",
    },

    startTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    endTime: { type: Date },

    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

SprintSchema.index({ guildId: 1, status: 1 });

export const Sprint = model<ISprint>("Sprint", SprintSchema);
