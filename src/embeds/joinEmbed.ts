import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Colors, CustomId, buildCustomId } from "../config/constants";
import { Texts } from "../config/texts";

export function buildJoinEmbed(
  sprintId: string,
  durationMinutes: number,
  endTime: Date
): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
  const embed = new EmbedBuilder()
    .setColor(Colors.success)
    .setTitle("🏁 Lese-Sprint gestartet!")
    .setDescription(Texts.start.announcement(durationMinutes))
    .addFields({
      name: "Ende",
      value: `<t:${Math.floor(endTime.getTime() / 1000)}:R>`,
    });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.SPRINT_JOIN, sprintId))
      .setLabel("Beitreten")
      .setEmoji("🙋")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CustomId.SPRINT_MY_PANEL, sprintId))
      .setLabel(Texts.join.myPanelButtonLabel)
      .setEmoji("📋")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [row] };
}
