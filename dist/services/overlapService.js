"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOverlappingSprint = hasOverlappingSprint;
const Sprint_1 = require("../database/models/Sprint");
const ScheduledSprint_1 = require("../database/models/ScheduledSprint");
/**
 * Prüft, ob der Zeitraum [start, start+durationMinutes] sich mit einem
 * bereits laufenden Sprint (inkl. Kulanzzeit) oder einem anderen geplanten
 * Sprint im selben Server überschneidet. Wird sowohl beim Planen (Schedule)
 * als auch beim Sofort-Starten genutzt, um Doppel-Buchungen zu verhindern.
 */
async function hasOverlappingSprint(guildId, start, durationMinutes) {
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const activeOrGraceSprints = await Sprint_1.Sprint.find({ guildId, status: { $in: ["active", "grace"] } });
    for (const sprint of activeOrGraceSprints) {
        const sprintEnd = sprint.status === "grace" && sprint.graceEndTime
            ? sprint.graceEndTime
            : new Date(sprint.startTime.getTime() + sprint.duration * 60_000);
        if (start < sprintEnd && end > sprint.startTime)
            return true;
    }
    const scheduledSprints = await ScheduledSprint_1.ScheduledSprint.find({ guildId, status: "scheduled" });
    for (const scheduled of scheduledSprints) {
        const scheduledEnd = new Date(scheduled.scheduledStart.getTime() + scheduled.duration * 60_000);
        if (start < scheduledEnd && end > scheduled.scheduledStart)
            return true;
    }
    return false;
}
