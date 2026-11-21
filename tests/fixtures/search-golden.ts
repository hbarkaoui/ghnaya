/**
 * Requêtes de référence du plan 1 (tâche 7), sur le catalogue fictif (`src/mocks/catalog.ts`) :
 * [requête, identifiant fictif de la chanson attendue dans le top 3]. Servent à la recherche en base
 * (tests d'intégration) et à la recherche en mémoire des aperçus (tests unitaires).
 */
export const GOLDEN_QUERIES: Array<[string, string]> = [
  ["sidi mansour", "s-sidi-mansour"],
  ["سيدي منصور", "s-sidi-mansour"],
  ["sidi mansur", "s-sidi-mansour"],
  ["sidi mansor", "s-sidi-mansour"],
  ["سيدى منصور", "s-sidi-mansour"],
  ["saber rebai", "s-sidi-mansour"],
  ["صابر الرباعي", "s-ala-nar"],
  ["3la nar", "s-ala-nar"],
  ["ana wel 3azab", "s-ana-wel-azab"],
  ["انا والعذاب", "s-ana-wel-azab"],
  ["bouchnak", "s-ana-wel-azab"],
  ["نحكيو على اللي فات", "s-ana-wel-azab"],
  ["enta 3omri", "s-enta-omri"],
  ["oum kalthoum", "s-enta-omri"],
  ["ام كلثوم", "s-enta-omri"],
  ["habaytak", "s-habaytak"],
  ["حبيتك", "s-habaytak"],
  ["fayrouz", "s-habaytak"],
  ["balti", "s-ya-lili"],
  ["بلطي", "s-ya-lili"],
  ["يستجيب القدر", "s-iradat-al-hayat"],
  ["chebbi", "s-iradat-al-hayat"],
  ["الشابي", "s-iradat-al-hayat"],
  ["ya lella", "s-ya-lella"],
  ["يا لالة", "s-ya-lella"],
  ["الجويني", "s-ya-lella"],
  ["khalli el ghnaya", "s-sidi-mansour"],
];
