// Outils de test des messages (tâche 20) : utilisés par les tests seulement, pas par l'application.

type Messages = { [key: string]: string | Messages };

/** `{ a: { b: "x" } }` → `{ "a.b": "x" }`. */
export function flattenMessages(messages: Messages, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string" ? [[path, value]] : Object.entries(flattenMessages(value, path));
    }),
  );
}

/** Une accolade qui suit un sélecteur de pluriel (`one {`, `=0 {`) ouvre une branche, pas un argument. */
const BRANCH_SELECTOR = /(?:zero|one|two|few|many|other|=\d+)\s*$/;

/**
 * Arguments ICU (`{name}`, `{count, plural, …}`) et balises de t.rich (`<club>`) d'un message,
 * triés et sans doublons : deux traductions d'un même message doivent en avoir exactement les mêmes.
 */
export function icuArguments(message: string): string[] {
  const found = new Set<string>();
  for (const match of message.matchAll(/\{\s*([A-Za-z_]\w*)\s*(?=[,}])/g)) {
    if (!BRANCH_SELECTOR.test(message.slice(0, match.index))) found.add(match[1]);
  }
  for (const match of message.matchAll(/<([A-Za-z]\w*)>/g)) found.add(`<${match[1]}>`);
  return [...found].sort();
}

/** Chiffres arabo-indiens (٠-٩) et persans (۰-۹) : l'interface n'en affiche jamais (usage tunisien). */
export const easternDigits = (text: string): string[] => text.match(/[٠-٩۰-۹]/g) ?? [];
