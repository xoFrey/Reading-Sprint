"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const discord_js_1 = require("discord.js");
const Sprint_1 = require("../database/models/Sprint");
const sprintService_1 = require("../services/sprintService");
const sprintEndImageService_1 = require("../services/sprintEndImageService");
const guildConfig_1 = require("../utils/guildConfig");
const texts_1 = require("../config/texts");
async function execute(interaction) {
    if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: texts_1.Texts.end.noAdmin, ephemeral: true });
        return;
    }
    // Sofort bestätigen, bevor die (potenziell langsamere) DB-Abfrage läuft.
    await interaction.deferReply();
    // Admin-Abbruch überspringt bewusst die Kulanzzeit (Grace Period) - dafür
    // ist der Button ja da: sofort beenden, falls etwas schiefgelaufen ist.
    const activeSprint = await Sprint_1.Sprint.findOne({
        guildId: interaction.guildId,
        status: { $in: ["active", "grace"] },
    });
    if (!activeSprint) {
        await interaction.editReply({ content: texts_1.Texts.end.noActiveSprint });
        return;
    }
    const results = await (0, sprintService_1.finalizeSprint)(activeSprint.id);
    if (results.length === 0) {
        await interaction.editReply({ content: `${texts_1.Texts.end.ended}\n${texts_1.Texts.sprintEnd.noParticipants}` });
        return;
    }
    const totalPages = (0, sprintEndImageService_1.getTotalResultPages)(results.length);
    const imageBuffer = await (0, sprintEndImageService_1.buildSprintEndImage)(interaction.client, interaction.guildId, results, activeSprint.duration, 1);
    const attachment = new discord_js_1.AttachmentBuilder(imageBuffer, { name: "sprint-ende.png" });
    const row = (0, sprintEndImageService_1.buildResultsPaginationRow)(activeSprint.id, 1, totalPages);
    // Optional in einen separaten Ergebnis-Kanal posten (RESULTS_CHANNEL_ID),
    // sonst im selben Kanal wie der Sprint. Die Ergebnisse werden NICHT vom
    // Cleanup-Job gelöscht (siehe database/models/Sprint.ts).
    const resultsChannelId = (0, guildConfig_1.getResultsChannelId)();
    const resultsChannel = resultsChannelId
        ? (await interaction.client.channels.fetch(resultsChannelId).catch(() => null))
        : null;
    let resultsMessageId;
    if (resultsChannel) {
        const sentMessage = await resultsChannel.send({ files: [attachment], components: row ? [row] : [] });
        resultsMessageId = sentMessage.id;
        await interaction.editReply({ content: `${texts_1.Texts.end.ended}\n📊 Ergebnisse: ${resultsChannel}` });
    }
    else {
        const message = await interaction.editReply({
            content: texts_1.Texts.end.ended,
            files: [attachment],
            components: row ? [row] : [],
        });
        resultsMessageId = message.id;
    }
    await Sprint_1.Sprint.findByIdAndUpdate(activeSprint.id, {
        resultsMessageId,
        resultsChannelId: resultsChannel?.id ?? activeSprint.channelId,
        resultsSnapshot: results,
    });
}
