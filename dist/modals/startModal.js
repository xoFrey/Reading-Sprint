"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
const texts_1 = require("../config/texts");
const parsing_1 = require("../utils/parsing");
const Sprint_1 = require("../database/models/Sprint");
const sprintService_1 = require("../services/sprintService");
const overlapService_1 = require("../services/overlapService");
const guildConfig_1 = require("../utils/guildConfig");
const joinEmbed_1 = require("../embeds/joinEmbed");
async function execute(interaction) {
    const endTimeStr = interaction.fields.getTextInputValue("endTime");
    const endTime = (0, parsing_1.parseTimeRelativeToNow)(endTimeStr);
    if (!endTime) {
        await interaction.reply({ content: texts_1.Texts.schedule.invalidDate, ephemeral: true });
        return;
    }
    // Dauer wird aus "jetzt bis Enduhrzeit" berechnet (parseTimeRelativeToNow
    // nimmt automatisch den nächsten Tag an, falls die Uhrzeit heute schon
    // vorbei wäre - unterstützt so auch Sprints über Mitternacht).
    const duration = Math.round((endTime.getTime() - Date.now()) / 60_000);
    // Sofort bestätigen (innerhalb der 3-Sekunden-Frist), erst danach die
    // eigentlichen (potenziell langsameren) DB-Aufrufe ausführen.
    await interaction.deferReply();
    const existingActive = await Sprint_1.Sprint.findOne({
        guildId: interaction.guildId,
        status: { $in: ["active", "grace"] },
    });
    if (existingActive) {
        await interaction.editReply({ content: texts_1.Texts.start.alreadyActive });
        return;
    }
    const overlaps = await (0, overlapService_1.hasOverlappingSprint)(interaction.guildId, new Date(), duration);
    if (overlaps) {
        await interaction.editReply({ content: texts_1.Texts.schedule.overlap });
        return;
    }
    const sprint = await (0, sprintService_1.startSprint)(interaction.guildId, interaction.channelId, interaction.user.id, duration);
    const sprintEndTime = new Date(sprint.startTime.getTime() + duration * 60_000);
    const { embed, components } = (0, joinEmbed_1.buildJoinEmbed)(sprint.id, duration, sprintEndTime);
    const message = await interaction.editReply({
        content: (0, guildConfig_1.getRoleMention)() || undefined,
        embeds: [embed],
        components,
    });
    // Speichern, damit der Cleanup-Job (jobs/scheduler.ts) diese Nachricht
    // später löschen kann, sobald der Sprint länger vorbei ist.
    sprint.messageId = message.id;
    await sprint.save();
    // Automatisches Sprintende wird vom Scheduler-Job (jobs/scheduler.ts) übernommen,
    // der regelmäßig prüft, ob active Sprints ihre Endzeit erreicht haben.
}
