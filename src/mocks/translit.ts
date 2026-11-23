/**
 * Translittérations fictives, alignées ligne à ligne (lignes vides comprises) sur les paroles de
 * src/mocks/catalog.ts. Conventions d'arabizi tunisien : 3 = ع, 7 = ح, 9 = ق, ch = ش, kh = خ, gh = غ.
 * Ce sont des translittérations des paroles inventées de la maquette (et des vers de Chebbi).
 * Lus par `src/mocks/catalog.ts`, donc par `pnpm seed:fixtures` : la génération à la demande est faite
 * par `lib/translit` depuis le plan 4.
 */
export const TRANSLIT_TEXTS: Record<string, string> = {
  "s-sidi-mansour": `ya lil tawwel chwaya
khalli el-ghnaya tkammel
nghanniw m3a ba3dhna
w el-galb fer7an w mhallel

ya gmar dhawwi 3lina
w ennjoum tas-her m3ana`,
  "s-ala-nar": `nestanna es-sbe7 ytell
w ech-chou9 fi galbi ma rta7
nekteb esmek fi er-riya7
w nerja3 nghanni men jdid

ya lili tawwel chwaya
khalli el-kelma tob9a binna`,
  "s-ana-wel-azab": `el-lil w ez-zekriyet
n7akiw 3al elli fet
w el-ghnaya tjam3na
kif el-ward fil-jnaynet

nerj3ou lel-kelma el-7elwa
w nesahrou 7atta es-sbe7`,
  "s-enta-omri": `rge3t aghanni men tani
wel-alb safi w hani
wel-leil yesma3 kalami
wel-fara7 nour zamani

ya leil khallik ma3ana
le7ad ma yetla3 nahar`,
  "s-habaytak": `3al ba7r kenna nghanni
ta7t ech-chajar wes-sama
w nerja3 akher el-leil
ne7ki 3an el-amar

wed-day3a natretna
wet-tari2 ba3do tawil`,
  "s-ya-lella": `ya lella ghannili
ghannili ghnaya 7elwa
khalli ed-dar tdhawwi
wel-a7bab yetlammou

ya lella ya lella
el-lila lilet far7`,
  "s-iradat-al-hayat": `idha ach-cha3bou yawman arada al-7ayat
fala boudda an yastajiba al-qadar

wa la boudda lil-layli an yanjali
wa la boudda lil-qaydi an yankasir`,
  "s-taht-el-yasmina": `w er-ri7 tjib er-ri7a
men ej-jnina lel-dar
nghanniw lelli ghayeb
wel-kelma temchi s7i7a

ya yasmina ya bidha
khalli el-lil ytawwel`,
  "s-nassam-alayna": `ya hawa khodna ma3ak
3ad-day3a elli men7ebba
wel-amar sahran honik
wel-ghenniyeh bet7arsa`,
  "s-el-atlal": `el-leil tawil wes-sahar 7elw
wel-kelma tegma3 elli b3id
neghanni led-dar wel-nas
w nerga3 lel-7ekaya men gdid

el-leil tawil wes-sahar 7elw
wel-kelma tegma3 elli b3id
neghanni led-dar wel-nas
w nerga3 lel-7ekaya men gdid

ya leil ya 3ein
khalli el-ghenwa tekammel`,
  "s-ya-lili": `nemchi fil-7ouma bil-lil
w nghanni 3la ez-zman
es-s7ab el-kol m3aya
wed-dounya twalli aman`,
};

/** Translittérations déjà présentes en base au chargement (les autres sont générées à la demande). */
export const STORED_TRANSLIT: Record<string, "auto" | "reviewed"> = {
  "s-iradat-al-hayat": "reviewed",
  "s-sidi-mansour": "auto",
  "s-ya-lella": "auto",
};
