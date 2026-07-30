"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guild = void 0;
const mongoose_1 = require("mongoose");
const GuildSchema = new mongoose_1.Schema({
    guildId: { type: String, required: true, unique: true },
    panelChannelId: { type: String },
    panelMessageId: { type: String },
    xpConfig: {
        pagesPerXP: { type: Number },
        goalBonus: { type: Number },
        streakBonus: { type: Number },
        finishBonus: { type: Number },
    },
}, { timestamps: true });
exports.Guild = (0, mongoose_1.model)("Guild", GuildSchema);
