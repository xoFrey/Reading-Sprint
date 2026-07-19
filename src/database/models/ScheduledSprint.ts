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
  reminderMessageIds: string[]; // IDs der gesendeten Erinnerungs-Nachrichten (für Cleanup)

  status: ScheduledSprintStatus;
  createdBy: string; // discordId

  // Nutzer, die sich für diesen geplanten Sprint vorab angemeldet haben
  // (siehe buttons/scheduleRegisterButton.ts). Rein informativ/als Erinnerung -
  // tritt dem Sprint NICHT automatisch bei, sondern wird beim Start gepingt.
  registeredUsers: string[];

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
    reminderMessageIds: { type: [String], default: [] },

    status: {
      type: String,
      enum: ["scheduled", "triggered", "cancelled"],
      default: "scheduled",
    },

    createdBy: { type: String, required: true },
    registeredUsers: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Wird vom Reminder-Job häufig nach anstehenden, noch nicht getriggerten Sprints gefragt.
ScheduledSprintSchema.index({ status: 1, scheduledStart: 1 });

export const ScheduledSprint = model<IScheduledSprint>(
  "ScheduledSprint",
  ScheduledSprintSchema
);
