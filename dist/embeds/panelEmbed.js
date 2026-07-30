"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPanelEmbed = buildPanelEmbed;
const discord_js_1 = require("discord.js");
const constants_1 = require("../config/constants");
const texts_1 = require("../config/texts");
const format_1 = require("../utils/format");
/**
 * Baut das permanente Panel-Embed inkl. der 4 Haupt-Buttons sowie - falls
 * Sprints geplant sind - einer zweiten Button-Reihe zum Vorab-Anmelden
 * (je ein Button pro geplantem Sprint, daher können Nutzer sich für mehrere
 * gleichzeitig eintragen).
 * Wird von /reading-panel initial gepostet und danach von panelService.refreshPanel()
 * bei jeder Änderung an geplanten Sprints neu aufgebaut (per message.edit).
 *
 * @param upcomingSprints geplante, noch nicht gestartete Sprints (sortiert nach Startzeit)
 */
function buildPanelEmbed(upcomingSprints = []) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(constants_1.Colors.primary)
        .setTitle(texts_1.Texts.panel.title)
        .setDescription(texts_1.Texts.panel.description);
    if (upcomingSprints.length > 0) {
        const lines = upcomingSprints.map((sprint) => {
            const unixTimestamp = Math.floor(sprint.scheduledStart.getTime() / 1000);
            const registeredCount = sprint.registeredUsers.length;
            return (`<t:${unixTimestamp}:F> (<t:${unixTimestamp}:R>) — ${(0, format_1.formatMinutes)(sprint.duration)}` +
                (registeredCount > 0 ? ` · 🔔 ${registeredCount} angemeldet` : ""));
        });
        embed.addFields({ name: "📅 Geplante Sprints", value: lines.join("\n") });
    }
    const mainRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(constants_1.CustomId.PANEL_SCHEDULE)
        .setLabel("Schedule")
        .setEmoji("📅")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId(constants_1.CustomId.PANEL_START)
        .setLabel("Start")
        .setEmoji("▶️")
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId(constants_1.CustomId.PANEL_END)
        .setLabel("End")
        .setEmoji("⏹️")
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId(constants_1.CustomId.PANEL_LEADERBOARD)
        .setLabel("Leaderboard")
        .setEmoji("🏆")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId(constants_1.CustomId.PANEL_MY_BOOKS)
        .setLabel("Meine Bücher")
        .setEmoji("📚")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    const components = [mainRow];
    // Ein Button pro geplantem Sprint -> Klick meldet an/ab (Toggle), unabhängig
    // von den Buttons der anderen Sprints. So kann man sich für mehrere eintragen.
    if (upcomingSprints.length > 0) {
        const registerRow = new discord_js_1.ActionRowBuilder().addComponents(upcomingSprints.map((sprint) => {
            const timeLabel = sprint.scheduledStart.toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
            return new discord_js_1.ButtonBuilder()
                .setCustomId((0, constants_1.buildCustomId)(constants_1.CustomId.SCHEDULE_REGISTER, sprint.id))
                .setLabel(timeLabel)
                .setEmoji("🔔")
                .setStyle(discord_js_1.ButtonStyle.Secondary);
        }));
        components.push(registerRow);
        // Statt eines Buttons pro Sprint (unübersichtlich bei vielen geplanten
        // Sprints) nur EIN Button, der ein Dropdown öffnet - dort wählt man den
        // zu löschenden Sprint aus (siehe buttons/panelCancelScheduleButton.ts).
        const cancelRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(constants_1.CustomId.PANEL_CANCEL_SCHEDULE)
            .setLabel(texts_1.Texts.scheduleCancel.buttonLabel)
            .setEmoji("🗑️")
            .setStyle(discord_js_1.ButtonStyle.Danger));
        components.push(cancelRow);
    }
    return { embed, components };
}
