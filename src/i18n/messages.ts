import type { MessageCatalog } from "./types";

export const messages = {
  en: {
    description:
      "Tech jobs shared by GitHub communities, made easier to discover.",
    errorMessage: "Please try loading the mobile foundation again.",
    errorTitle: "Openings could not start",
    eyebrow: "Mobile foundation",
    localeLabel: "Language",
    retry: "Try again",
    status: "Foundation ready",
    title: "Openings",
  },
  "pt-BR": {
    description:
      "Vagas de tecnologia compartilhadas por comunidades do GitHub, mais fáceis de descobrir.",
    errorMessage: "Tente carregar a base mobile novamente.",
    errorTitle: "O Openings não conseguiu iniciar",
    eyebrow: "Base mobile",
    localeLabel: "Idioma",
    retry: "Tentar novamente",
    status: "A base está pronta",
    title: "Openings",
  },
  es: {
    description:
      "Empleos de tecnología compartidos por comunidades de GitHub, más fáciles de descubrir.",
    errorMessage: "Intenta cargar de nuevo la base móvil.",
    errorTitle: "Openings no pudo iniciarse",
    eyebrow: "Base móvil",
    localeLabel: "Idioma",
    retry: "Intentar de nuevo",
    status: "La base está lista",
    title: "Openings",
  },
  it: {
    description:
      "Offerte di lavoro tech condivise dalle community GitHub, più facili da trovare.",
    errorMessage: "Prova a caricare di nuovo la base mobile.",
    errorTitle: "Openings non è riuscito ad avviarsi",
    eyebrow: "Base mobile",
    localeLabel: "Lingua",
    retry: "Riprova",
    status: "La base è pronta",
    title: "Openings",
  },
  fr: {
    description:
      "Des offres tech partagées par les communautés GitHub, plus faciles à découvrir.",
    errorMessage: "Essayez de charger à nouveau la base mobile.",
    errorTitle: "Openings n’a pas pu démarrer",
    eyebrow: "Base mobile",
    localeLabel: "Langue",
    retry: "Réessayer",
    status: "La base est prête",
    title: "Openings",
  },
  de: {
    description:
      "Tech-Stellen aus GitHub-Communitys, einfacher zu entdecken.",
    errorMessage: "Lade die mobile Grundlage bitte erneut.",
    errorTitle: "Openings konnte nicht gestartet werden",
    eyebrow: "Mobile Grundlage",
    localeLabel: "Sprache",
    retry: "Erneut versuchen",
    status: "Die Grundlage ist bereit",
    title: "Openings",
  },
} as const satisfies MessageCatalog;
