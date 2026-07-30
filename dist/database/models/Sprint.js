"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sprint = void 0;
const mongoose_1 = require("mongoose");
const SprintSchema = new mongoose_1.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String },
    graceMessageId: { type: String },
    reminderMessageIds: { type: [String], default: [] },
    resultsMessageId: { type: String },
    resultsChannelId: { type: String },
    resultsSnapshot: { type: mongoose_1.Schema.Types.Mixed },
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
    participantsPage: { type: Number, default: 1 },
    createdBy: { type: String, required: true },
}, { timestamps: true });
// Wird vom Cleanup-Job genutzt, um beendete, noch nicht aufgeräumte Sprints zu finden.
SprintSchema.index({ status: 1, endTime: 1, messagesCleanedUp: 1 });
SprintSchema.index({ guildId: 1, status: 1 });
exports.Sprint = (0, mongoose_1.model)("Sprint", SprintSchema);
