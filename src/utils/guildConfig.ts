// Liest optionale Server-Konfiguration aus Umgebungsvariablen.
// Beide sind optional: fehlt die jeweilige Variable, wird einfach nichts
// gepingt bzw. der normale Sprint-Kanal für Ergebnisse genutzt.

// Baut die Mention-Syntax für die "Lesesprinter"-Rolle, falls konfiguriert.
// Gibt einen leeren String zurück, wenn LESESPRINTER_ROLE_ID nicht gesetzt ist.
export function getRoleMention(): string {
  const roleId = process.env.LESESPRINTER_ROLE_ID;
  return roleId ? `<@&${roleId}>` : "";
}

// ID eines optionalen separaten Kanals für Sprint-Abschluss-Ergebnisse.
// Ist keiner konfiguriert, wird im selben Kanal wie der Sprint gepostet.
export function getResultsChannelId(): string | undefined {
  return process.env.RESULTS_CHANNEL_ID || undefined;
}
