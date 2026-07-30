"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const ScheduledSprint_1 = require("../database/models/ScheduledSprint");
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const scheduledSprints = await ScheduledSprint_1.ScheduledSprint.find({
        guildId: interaction.guildId,
        status: "scheduled",
    }).sort({ scheduledStart: 1 });
    if (scheduledSprints.length === 0) {
        await interaction.editReply({ content: texts_1.Texts.scheduleCancel.noneScheduled });
        return;
    }
    const select = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SELECT_CANCEL_SCHEDULE))
        .setPlaceholder(texts_1.Texts.scheduleCancel.selectPlaceholder)
        .addOptions(scheduledSprints.map((sprint) => ({
        label: sprint.scheduledStart.toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
        value: sprint.id,
        description: `Dauer: ${sprint.duration} Minuten`,
    })));
    const row = new discord_js_1.ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: texts_1.Texts.scheduleCancel.selectPlaceholder, components: [row] });
}
