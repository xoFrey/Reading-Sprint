"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const texts_1 = require("../config/texts");
const ScheduledSprint_1 = require("../database/models/ScheduledSprint");
const panelService_1 = require("../services/panelService");
async function execute(interaction) {
    const scheduledSprintId = interaction.values[0];
    const scheduled = await ScheduledSprint_1.ScheduledSprint.findOne({ _id: scheduledSprintId, status: "scheduled" });
    if (!scheduled) {
        await interaction.update({ content: texts_1.Texts.scheduleCancel.notFound, components: [] });
        return;
    }
    const isCreator = scheduled.createdBy === interaction.user.id;
    const isAdmin = interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
    if (!isCreator && !isAdmin) {
        await interaction.update({ content: texts_1.Texts.scheduleCancel.noPermission, components: [] });
        return;
    }
    scheduled.status = "cancelled";
    await scheduled.save();
    await interaction.update({ content: texts_1.Texts.scheduleCancel.success, components: [] });
    await (0, panelService_1.refreshPanel)(interaction.client, interaction.guildId);
}
