import { Client, Events } from "discord.js";
import { startScheduler } from "../jobs/scheduler";

export const name = Events.ClientReady;
export const once = true;

export function execute(client: Client<true>): void {
  console.log(`[Bot] Eingeloggt als ${client.user.tag}`);
  startScheduler(client);
}
