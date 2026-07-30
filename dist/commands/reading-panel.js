"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const panelEmbed_1 = require("../embeds/panelEmbed");
const Guild_1 = require("../database/models/Guild");
const panelService_1 = require("../services/panelService");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("reading-panel")
    .setDescription("Postet das permanente Lese-Sprint-Panel in diesem Kanal.")
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild);
async function execute(interaction) {
    await interaction.deferReply();
    // Bereits geplante Sprints (z.B. von vor einem Bot-Neustart) müssen direkt
    // beim ersten Posten angezeigt werden, nicht erst bei der nächsten Planung.
    const upcomingSprints = await (0, panelService_1.getUpcomingSprints)(interaction.guildId);
    const { embed, components } = (0, panelEmbed_1.buildPanelEmbed)(upcomingSprints);
    const reply = await interaction.editReply({ embeds: [embed], components });
    // Speichern, WO das Panel liegt, damit panelService.refreshPanel() es später
    // (z.B. beim Planen eines Sprints) automatisch aktualisieren kann.
    await Guild_1.Guild.findOneAndUpdate({ guildId: interaction.guildId }, { panelChannelId: interaction.channelId, panelMessageId: reply.id }, { upsert: true });
}
