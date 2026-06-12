/** Emojis de réaction (ballons de foot expressifs) — images dans public/emoji/. */
export type EmojiDef = { key: string; src: string; label: string };

export const EMOJIS: EmojiDef[] = [
  { key: "emoji-1", src: "/emoji/emoji-1.webp", label: "Joie" },
  { key: "emoji-2", src: "/emoji/emoji-2.webp", label: "MDR" },
  { key: "emoji-3", src: "/emoji/emoji-3.webp", label: "Amour" },
  { key: "emoji-4", src: "/emoji/emoji-4.webp", label: "Classe" },
  { key: "emoji-5", src: "/emoji/emoji-5.webp", label: "En feu" },
  { key: "emoji-6", src: "/emoji/emoji-6.webp", label: "Choqué" },
  { key: "emoji-7", src: "/emoji/emoji-7.webp", label: "Triste" },
  { key: "emoji-8", src: "/emoji/emoji-8.webp", label: "Énervé" },
  { key: "emoji-9", src: "/emoji/emoji-9.webp", label: "Clown" },
  { key: "emoji-10", src: "/emoji/emoji-10.webp", label: "Caca" },
];

export const EMOJI_BY_KEY: Record<string, EmojiDef> = Object.fromEntries(EMOJIS.map((e) => [e.key, e]));
