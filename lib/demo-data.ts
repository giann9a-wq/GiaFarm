export const dashboardStats = [
  { label: "Campagna attiva", value: "2025/26", helper: "Novembre 2025 - Ottobre 2026" },
  { label: "Campi censiti", value: "2", helper: "4,01 ha coltivati demo" },
  { label: "Documenti recenti", value: "5", helper: "Drive pronto al collegamento" },
  { label: "Giacenza critica", value: "1", helper: "Da validare con magazzino reale" }
];

export const upcomingEvents = [
  { date: "22 apr", title: "Controllo irrigazione Campo Nord", type: "Manuale" },
  { date: "30 apr", title: "Scadenza verifica schede sicurezza", type: "Promemoria" },
  { date: "06 mag", title: "Trattamento programmato Mais Cornate", type: "Sistema" }
];

export const recentOperations = [
  { date: "28 mar 2026", title: "Semina Mais Cornate", detail: "92 kg semente su 4,01 ha" },
  { date: "14 mar 2026", title: "Erpicatura", detail: "Preparazione terreno su gruppo Mais" },
  { date: "05 feb 2026", title: "Concimazione pre-semina", detail: "Record demo da validare" }
];

export const recentDocuments = [
  { name: "Bolla ingresso semente", module: "Bolle", status: "Bozza" },
  { name: "Scheda sicurezza prodotto demo", module: "Schede Prodotti", status: "Da collegare" },
  { name: "Fattura fornitore agricolo", module: "Finanza", status: "Archiviata" }
];

export const moduleSummaries = [
  {
    title: "Campi",
    href: "/campi",
    description: "Anagrafica terreni, PAC storicizzata, coordinate e poligoni manuali.",
    status: "Base pronta"
  },
  {
    title: "Lavorazioni",
    href: "/lavorazioni",
    description: "Campagne agricole, gruppi campi, semina, raccolta, preparazioni e trattamenti.",
    status: "Base pronta"
  },
  {
    title: "Bolle / DDT",
    href: "/bolle-ddt",
    description: "Ingresso materiali da bolla, import da Gmail e DDT in uscita stampabili.",
    status: "Da collegare"
  },
  {
    title: "Magazzino",
    href: "/magazzino",
    description: "Giacenze calcolate, movimenti e rettifiche admin con audit trail.",
    status: "Base pronta"
  },
  {
    title: "Schede Prodotti",
    href: "/schede-prodotti",
    description: "Materiali, schede di sicurezza e documenti tecnici su Drive.",
    status: "Base pronta"
  },
  {
    title: "Finanza",
    href: "/finanza",
    description: "Costi, ricavi, allocazioni per gruppi e dashboard risultati.",
    status: "Base pronta"
  },
  {
    title: "Calendario",
    href: "/calendario",
    description: "Eventi generati da lavorazioni e appuntamenti manuali.",
    status: "Base pronta"
  }
];

export const modulePages = {
  campi: {
    title: "Campi",
    subtitle: "Anagrafica terreni con PAC per anno, coordinate e relazioni con gruppi e lavorazioni.",
    primaryAction: "Nuovo campo",
    rows: [
      ["Campo Nord", "Foglio 12", "Mappale 145", "2,31 ha coltivati", "PAC 2026: si"],
      ["Campo Sud", "Foglio 13", "Mappale 88", "1,70 ha coltivati", "PAC 2026: si"]
    ],
    detail: [
      ["Mappa MVP", "Coordinate e poligono manuale; catasto ufficiale in fase futura."],
      ["Relazioni", "Campagne, gruppi campi, lavorazioni e documenti collegabili."]
    ]
  },
  lavorazioni: {
    title: "Lavorazioni",
    subtitle: "Registro operativo per campagna agricola con categorie distinte e allegati PDF.",
    primaryAction: "Nuova lavorazione",
    rows: [
      ["28 mar 2026", "Semina", "Mais Cornate", "Semente mais demo", "4,01 ha"],
      ["14 mar 2026", "Erpicatura", "Mais Cornate", "Meccanica", "4,01 ha"]
    ],
    detail: [
      ["Campagna", "2025/26 attiva, da novembre 2025 a ottobre 2026."],
      ["Categorie", "Semina, raccolta, preparazione terreno, trattamento, irrigazione, altro."]
    ]
  },
  "bolle-ddt": {
    title: "Bolle / DDT",
    subtitle: "Bolle in ingresso, import da Gmail e DDT in uscita con numerazione coerente.",
    primaryAction: "Nuova bozza",
    rows: [
      ["Ingresso", "Bolla semente demo", "Fornitore Agricolo Demo", "Bozza", "PDF da importare"],
      ["Uscita", "DDT 2026-001", "Cliente Cereali Demo", "Bozza", "Stampabile"]
    ],
    detail: [
      ["Gmail import", "Lista messaggi con allegati, bozza modificabile, archiviazione su Drive."],
      ["PDF DDT", "Layout pulito previsto in milestone 3."]
    ]
  },
  magazzino: {
    title: "Magazzino",
    subtitle: "Giacenze calcolate da ingressi e utilizzi, con rettifiche admin tracciate.",
    primaryAction: "Rettifica admin",
    rows: [
      ["Semente mais demo", "kg", "-92", "Scarico da lavorazione", "Da riallineare"],
      ["Concime demo", "kg", "500", "Giacenza iniziale", "OK"]
    ],
    detail: [
      ["Calcolo", "Ingressi da bolle meno uscite da lavorazioni e rettifiche."],
      ["Audit", "Nota obbligatoria per ogni rettifica manuale."]
    ]
  },
  "schede-prodotti": {
    title: "Schede Prodotti",
    subtitle: "Archivio materiali con schede di sicurezza e documenti tecnici collegati a Drive.",
    primaryAction: "Nuovo prodotto",
    rows: [
      ["Semente mais demo", "Semente", "kg", "1 documento", "Attivo"],
      ["Prodotto fitosanitario demo", "Trattamento", "l", "Scheda mancante", "Da completare"]
    ],
    detail: [
      ["Documenti", "Schede sicurezza, etichette e allegati tecnici."],
      ["Collegamenti", "Lavorazioni, magazzino e finanza leggono la stessa anagrafica."]
    ]
  },
  finanza: {
    title: "Finanza",
    subtitle: "Costi, ricavi e risultati economici allocati per campagna e gruppi di campi.",
    primaryAction: "Nuovo movimento",
    rows: [
      ["Costo", "Semente mais", "Campagna 2025/26", "€ 1.250,00", "Allocato"],
      ["Ricavo", "Vendita cereali demo", "Campagna 2025/26", "€ 3.800,00", "Stimato"]
    ],
    detail: [
      ["Dashboard", "Costi, ricavi, margine per gruppo, filtri per periodo e campagna."],
      ["Documenti", "Fatture ricevute/emesse collegate a Drive."]
    ]
  },
  calendario: {
    title: "Calendario",
    subtitle: "Eventi generati dal sistema e appuntamenti manuali in vista giorno/settimana/mese.",
    primaryAction: "Nuovo evento",
    rows: [
      ["28 mar 2026", "Semina Mais Cornate", "Sistema", "Lavorazione collegata", "Completato"],
      ["22 apr 2026", "Controllo irrigazione Campo Nord", "Manuale", "Promemoria", "Programmato"]
    ],
    detail: [
      ["Origine", "Eventi sistema da lavorazioni, eventi manuali per scadenze operative."],
      ["Viste", "La base dati supporta giorno, settimana e mese."]
    ]
  },
  impostazioni: {
    title: "Impostazioni",
    subtitle: "Utenti autorizzati, ruoli, integrazioni Google e configurazioni aziendali.",
    primaryAction: "Aggiungi utente",
    rows: [
      ["admin@giafarm.local", "Admin", "Seed demo", "Attivo", "Da sostituire"],
      ["utente@example.com", "User", "Whitelist", "Non configurato", "Esempio"]
    ],
    detail: [
      ["Ruoli", "Admin e user, estendibili con permessi granulari."],
      ["Google", "OAuth, Drive root folder e mailbox scanner dedicata."]
    ]
  }
} as const;
