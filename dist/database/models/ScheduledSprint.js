"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledSprint = void 0;
const mongoose_1 = require("mongoose");
const ScheduledSprintSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
// Wird vom Reminder-Job häufig nach anstehenden, noch nicht getriggerten Sprints gefragt.
ScheduledSprintSchema.index({ status: 1, scheduledStart: 1 });
exports.ScheduledSprint = (0, mongoose_1.model)("ScheduledSprint", ScheduledSprintSchema);
