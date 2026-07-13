import { Schema, model, Document } from "mongoose";
import { ScheduledSprintStatus } from "../../types";

// Ein per /reading-panel geplanter Sprint, der noch nicht gestartet wurde.
// Ein Cron-Job (jobs/) prüft regelmäßig, ob Erinnerungen gesendet oder
// der Sprint automatisch gestartet werden muss.
export interface IScheduledSprint extends Document {
  guildId: string;
  channelId: string;

  scheduledStart: Date;
  duration: number; // in Minuten

  remindersSent: {
    thirtyMin: boolean;
    fiveMin: boolean;
  };

  status: ScheduledSprintStatus;
  createdBy: string; // discordId

  createdAt: Date;
  updatedAt: Date;
}

const ScheduledSprintSchema = new Schema<IScheduledSprint>(
  {
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },

    scheduledStart: { type: Date, required: true },
    duration: { type: Number, required: true },

    remindersSent: {
      thirtyMin: { type: Boolean, default: false },
      fiveMin: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: ["scheduled", "triggered", "cancelled"],
      default: "scheduled",
    },

    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Wird vom Reminder-Job häufig nach anstehenden, noch nicht getriggerten Sprints gefragt.
ScheduledSprintSchema.index({ status: 1, scheduledStart: 1 });

export const ScheduledSprint = model<IScheduledSprint>(
  "ScheduledSprint",
  ScheduledSprintSchema
);
