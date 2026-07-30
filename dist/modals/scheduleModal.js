"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const texts_1 = require("../config/texts");
const parsing_1 = require("../utils/parsing");
const format_1 = require("../utils/format");
const guildConfig_1 = require("../utils/guildConfig");
const ScheduledSprint_1 = require("../database/models/ScheduledSprint");
const panelService_1 = require("../services/panelService");
const overlapService_1 = require("../services/overlapService");
async function execute(interaction) {
    const dateStr = interaction.fields.getTextInputValue("date");
    const startTimeStr = interaction.fields.getTextInputValue("startTime");
    const endTimeStr = interaction.fields.getTextInputValue("endTime");
    const scheduledStart = (0, parsing_1.parseGermanDateTime)(dateStr, startTimeStr);
    const scheduledEnd = (0, parsing_1.parseGermanDateTime)(dateStr, endTimeStr);
    if (!scheduledStart || !scheduledEnd) {
        await interaction.reply({ content: texts_1.Texts.schedule.invalidDate, ephemeral: true });
        return;
    }
    // Dauer wird aus Start- und Endzeit berechnet, nicht mehr manuell eingegeben.
    const duration = Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60_000);
    if (duration <= 0) {
        await interaction.reply({ content: texts_1.Texts.schedule.endBeforeStart, ephemeral: true });
        return;
    }
    if (scheduledStart.getTime() <= Date.now()) {
        await interaction.reply({ content: texts_1.Texts.schedule.inPast, ephemeral: true });
        return;
    }
    const overlaps = await (0, overlapService_1.hasOverlappingSprint)(interaction.guildId, scheduledStart, duration);
    if (overlaps) {
        await interaction.reply({ content: texts_1.Texts.schedule.overlap, ephemeral: true });
        return;
    }
    await ScheduledSprint_1.ScheduledSprint.create({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        scheduledStart,
        duration,
        createdBy: interaction.user.id,
    });
    const unixTimestamp = Math.floor(scheduledStart.getTime() / 1000).toString();
    await interaction.reply({
        content: texts_1.Texts.schedule.success(unixTimestamp, (0, format_1.formatMinutes)(duration)),
        ephemeral: true,
    });
    // Öffentliche Ankündigung mit Rollen-Ping (falls LESESPRINTER_ROLE_ID
    // konfiguriert ist), da die obige Antwort nur für den Planenden sichtbar ist.
    const roleMention = (0, guildConfig_1.getRoleMention)();
    if (roleMention) {
        const channel = interaction.channel;
        await channel
            ?.send(`${roleMention} 📅 Neuer Sprint geplant für <t:${unixTimestamp}:F> (Dauer: ${(0, format_1.formatMinutes)(duration)}).`)
            .catch(() => undefined);
    }
    await (0, panelService_1.refreshPanel)(interaction.client, interaction.guildId);
}
