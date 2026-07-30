"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const ScheduledSprint_1 = require("../database/models/ScheduledSprint");
const panelService_1 = require("../services/panelService");
/**
 * Löscht einen geplanten Sprint - genauer: markiert ihn als "cancelled",
 * damit der Scheduler-Job ihn nicht mehr triggert und er aus der Panel-Liste
 * verschwindet (panelService.getUpcomingSprints filtert auf status "scheduled").
 * Das Dokument bleibt zu Nachvollziehbarkeit in der DB erhalten, statt es
 * hart zu löschen.
 */
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { args } = (0, constants_1.parseCustomId)(interaction.customId);
    const [scheduledSprintId] = args;
    const scheduled = await ScheduledSprint_1.ScheduledSprint.findOne({ _id: scheduledSprintId, status: "scheduled" });
    if (!scheduled) {
        await interaction.editReply({ content: texts_1.Texts.scheduleCancel.notFound });
        return;
    }
    const isCreator = scheduled.createdBy === interaction.user.id;
    const isAdmin = interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
    if (!isCreator && !isAdmin) {
        await interaction.editReply({ content: texts_1.Texts.scheduleCancel.noPermission });
        return;
    }
    scheduled.status = "cancelled";
    await scheduled.save();
    await interaction.editReply({ content: texts_1.Texts.scheduleCancel.success });
    await (0, panelService_1.refreshPanel)(interaction.client, interaction.guildId);
}
