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
    startTimeLabel: "Anfangsuhrzeit (HH:MM)",
    endTimeLabel: "Enduhrzeit (HH:MM)",
    success: (timestamp: string, duration: string) =>
      `✅ Sprint geplant für <t:${timestamp}:F> (Dauer: ${duration}).`,
    invalidDate: "❌ Ungültiges Datum/Uhrzeit-Format. Bitte TT.MM.JJJJ und HH:MM verwenden.",
    endBeforeStart: "❌ Die Enduhrzeit muss nach der Anfangsuhrzeit liegen.",
    inPast: "❌ Der geplante Zeitpunkt liegt in der Vergangenheit.",
    overlap: "❌ Dieser Zeitraum überschneidet sich mit einem laufenden oder bereits geplanten Sprint.",
    reminder30: "⏰ Erinnerung: Der Sprint startet in 30 Minuten!",
    reminder5: "⏰ Erinnerung: Der Sprint startet in 5 Minuten!",
  },

  start: {
    modalTitle: "Sprint sofort starten",
    endTimeLabel: "Enduhrzeit (HH:MM)",
    alreadyActive: "❌ Es läuft bereits ein aktiver Sprint in diesem Server.",
    announcement: (duration: string) =>
      `🏁 Ein neuer Lese-Sprint hat begonnen! Dauer: **${duration}**.`,
  },

  end: {
    noAdmin: "❌ Nur Administratoren dürfen einen Sprint vorzeitig beenden.",
    noActiveSprint: "❌ Es läuft aktuell kein Sprint.",
    ended: "⏹️ Der Sprint wurde manuell beendet.",
    sprintOver: "❌ Dieser Sprint ist bereits vorbei, ein Beitritt ist nicht mehr möglich.",
  },

  grace: {
    started: (minutes: number, endTimestamp: string) =>
      `⏳ Der Sprint ist vorbei! Ihr habt noch **${minutes} Minuten** Zeit, ` +
      `eure letzte Seite einzutragen (bis <t:${endTimestamp}:t>). Danach wird final ausgewertet.`,
    updateButtonLabel: "Seite aktualisieren",
  },

  scheduleRegister: {
    registered: "🔔 Du wirst benachrichtigt, sobald dieser Sprint startet.",
    unregistered: "🔕 Anmeldung entfernt.",
  },

  scheduleCancel: {
    noPermission: "❌ Nur der Ersteller oder ein Administrator kann diesen geplanten Sprint löschen.",
    notFound: "❌ Dieser geplante Sprint wurde bereits gelöscht oder gestartet.",
    success: "🗑️ Geplanter Sprint wurde gelöscht.",
    noneScheduled: "❌ Aktuell sind keine Sprints geplant.",
    buttonLabel: "Geplanten Sprint löschen",
    selectPlaceholder: "Welchen geplanten Sprint löschen?",
  },

  join: {
    modalTitle: "Sprint beitreten",
    bookTitleLabel: "Buchtitel",
    currentPageLabel: "Aktuelle Seite",
    totalPagesLabel: "Gesamtseitenzahl",
    goalPageLabel: "Seitenziel: wie viele Seiten? (optional)",
    alreadyJoined: "❌ Du nimmst bereits an diesem Sprint teil.",
    alreadyLeft: "❌ Du hast diesen Sprint bereits verlassen und kannst nicht erneut beitreten.",
    myPanelButtonLabel: "Mein Panel",
    notYetJoined: "❌ Du nimmst noch nicht an diesem Sprint teil. Klicke zuerst auf \"Beitreten\".",
    welcome: (bookTitle: string) =>
      `📖 Du liest gerade **${bookTitle}**. Nutze die Buttons, um deinen Fortschritt zu verwalten.`,
  },

  bookSelect: {
    prompt: "📚 Wähle ein Buch aus deiner Bibliothek oder trage ein neues ein:",
    placeholder: "Buch auswählen...",
    newBookOptionLabel: "📕 Neues Buch eintragen",
    newBookOptionDescription: "Titel & Gesamtseitenzahl selbst eingeben",
    bookOptionDescription: (totalPages: number) => `${totalPages} Seiten insgesamt`,
    modalTitleExisting: "Weiterlesen",
  },

  myBooks: {
    prompt: "📚 Wähle ein Buch aus deiner Bibliothek zum Bearbeiten oder Löschen:",
    placeholder: "Buch auswählen...",
    noBooks: "❌ Du hast noch keine Bücher in deiner Bibliothek.",
    managePrompt: (title: string) => `📖 **${title}** - was möchtest du tun?`,
    editButtonLabel: "Bearbeiten",
    deleteButtonLabel: "Löschen",
    editModalTitle: "Buch bearbeiten",
    editSuccess: "✅ Buch wurde aktualisiert.",
    deleteSuccess: (title: string) => `🗑️ **${title}** wurde aus deiner Bibliothek entfernt.`,
    notFound: "❌ Dieses Buch wurde nicht gefunden (evtl. bereits gelöscht).",
  },

  participant: {
    paused: "⏸️ Du hast pausiert. Klicke auf ▶️ Weiter, um fortzufahren.",
    resumed: "▶️ Weiter geht's!",
    left: "🚪 Du hast den Sprint verlassen.",
    switchBookSuccess: (title: string) => `📖 Neues Buch gestartet: **${title}**.`,
    oldBookPageLabel: "Aktuelle Seite (bisheriges Buch)",
    updatePageModalTitle: "Fortschritt aktualisieren",
    updatePageLabel: "Aktuelle Seite",
    updatePageSuccess: "✅ Fortschritt aktualisiert.",
    updatePageInvalid: "❌ Ungültige Seitenzahl. Sie muss zwischen Startseite und Gesamtseitenzahl liegen.",
  },

  sprintEnd: {
    title: "🏁 Sprint beendet!",
    noParticipants: "Niemand hat an diesem Sprint teilgenommen.",
    goalReached: "🎯 Ziel erreicht",
    goalMissed: "Ziel nicht erreicht",
    leftEarly: "🚪 Hat den Sprint vorzeitig verlassen",
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
