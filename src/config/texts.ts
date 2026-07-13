// Zentrale Textsammlung. Alles, was der Bot anzeigt, steht hier -
// so lässt sich der Bot ohne Code-Suche umformulieren oder übersetzen.
export const Texts = {
  panel: {
    title: "📚 Lese-Sprints",
    description:
      "Willkommen beim Lese-Sprint-Panel! Plane einen Sprint, starte sofort einen, " +
      "oder schau dir das Leaderboard an.",
  },

  schedule: {
    modalTitle: "Sprint planen",
    dateLabel: "Datum (TT.MM.JJJJ)",
    timeLabel: "Uhrzeit (HH:MM)",
    durationLabel: "Dauer (in Minuten)",
    success: (timestamp: string) => `✅ Sprint geplant für <t:${timestamp}:F>.`,
    invalidDate: "❌ Ungültiges Datum/Uhrzeit-Format. Bitte TT.MM.JJJJ und HH:MM verwenden.",
    inPast: "❌ Der geplante Zeitpunkt liegt in der Vergangenheit.",
    reminder30: "⏰ Erinnerung: Der Sprint startet in 30 Minuten!",
    reminder5: "⏰ Erinnerung: Der Sprint startet in 5 Minuten!",
  },

  start: {
    modalTitle: "Sprint sofort starten",
    durationLabel: "Dauer (in Minuten)",
    alreadyActive: "❌ Es läuft bereits ein aktiver Sprint in diesem Server.",
    announcement: (minutes: number) =>
      `🏁 Ein neuer Lese-Sprint hat begonnen! Dauer: **${minutes} Minuten**.`,
  },

  end: {
    noAdmin: "❌ Nur Administratoren dürfen einen Sprint vorzeitig beenden.",
    noActiveSprint: "❌ Es läuft aktuell kein Sprint.",
    ended: "⏹️ Der Sprint wurde manuell beendet.",
  },

  join: {
    modalTitle: "Sprint beitreten",
    bookTitleLabel: "Buchtitel",
    currentPageLabel: "Aktuelle Seite",
    totalPagesLabel: "Gesamtseitenzahl",
    goalPageLabel: "Seitenziel (optional)",
    alreadyJoined: "❌ Du nimmst bereits an diesem Sprint teil.",
    welcome: (bookTitle: string) =>
      `📖 Du liest gerade **${bookTitle}**. Nutze die Buttons, um deinen Fortschritt zu verwalten.`,
  },

  participant: {
    paused: "⏸️ Du hast pausiert. Klicke auf ▶️ Weiter, um fortzufahren.",
    resumed: "▶️ Weiter geht's!",
    left: "🚪 Du hast den Sprint verlassen.",
    switchBookSuccess: (title: string) => `📖 Neues Buch gestartet: **${title}**.`,
  },

  sprintEnd: {
    title: "🏁 Sprint beendet!",
    noParticipants: "Niemand hat an diesem Sprint teilgenommen.",
    goalReached: "🎯 Ziel erreicht",
    goalMissed: "Ziel nicht erreicht",
    levelUp: (level: number) => `🎉 Level-Up! Jetzt Level **${level}**.`,
  },

  leaderboard: {
    title: "🏆 Leaderboard",
    noData: "Noch keine Daten vorhanden. Sei der/die Erste!",
    entry: (
      rank: number,
      level: number,
      currentXP: number,
      xpForNext: number,
      totalXP: number
    ) =>
      `**#${rank}** — Level ${level}\n` +
      `${currentXP} / ${xpForNext} XP · ${xpForNext - currentXP} XP bis Level ${level + 1}\n` +
      `${totalXP} XP insgesamt`,
  },

  errors: {
    generic: "❌ Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    notInSprint: "❌ Du nimmst aktuell an keinem Sprint teil.",
  },
} as const;
