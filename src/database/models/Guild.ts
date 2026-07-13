import { Schema, model, Document } from "mongoose";
import { XPConfig } from "../../types";

// Server-spezifische Einstellungen, u.a. wo das permanente Panel steht
// und ob dieser Server eigene XP-Werte nutzt statt der globalen Defaults.
export interface IGuild extends Document {
  guildId: string;

  panelChannelId?: string;
  panelMessageId?: string;

  xpConfig?: Partial<XPConfig>; // überschreibt nur einzelne Werte, Rest bleibt Default

  createdAt: Date;
  updatedAt: Date;
}

const GuildSchema = new Schema<IGuild>(
  {
    guildId: { type: String, required: true, unique: true },

    panelChannelId: { type: String },
    panelMessageId: { type: String },

    xpConfig: {
      pagesPerXP: { type: Number },
      goalBonus: { type: Number },
      streakBonus: { type: Number },
      finishBonus: { type: Number },
    },
  },
  { timestamps: true }
);

export const Guild = model<IGuild>("Guild", GuildSchema);
