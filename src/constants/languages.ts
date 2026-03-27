export const SUPPORTED_LANGUAGES = ["en", "hi", "hinglish"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const languageLabels: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  hinglish: "Hinglish",
};
