import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Noto_Naskh_Arabic,
  Reem_Kufi,
} from "next/font/google";

// Les noms de variables correspondent à ceux attendus par design-tokens.css.
const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["500", "600"],
  variable: "--font-reem-kufi",
  display: "swap",
});

// Interface : IBM Plex Sans Arabic seule, avec ses jeux arabe ET latin (son latin est celui
// d'IBM Plex Sans). next/font insère toujours après chaque police une police de secours basée sur
// Arial, qui contient des lettres arabes : avec deux polices (latin puis arabe) dans la pile,
// l'arabe serait affiché en Arial. Une seule police couvrant les deux écritures évite ce piège.
const plexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-sans-arabic",
  display: "swap",
});

// IBM Plex Sans (latin seul) : réservé à la ligne de translittération du lecteur.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-sans",
  display: "swap",
  preload: false,
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-noto-naskh",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

export const fontVariables = [reemKufi, plexSans, plexSansArabic, notoNaskh, plexMono]
  .map((font) => font.variable)
  .join(" ");
