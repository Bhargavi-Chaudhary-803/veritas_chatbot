import { Language } from "./languages";

type CopySchema = {
  appName: string;
  tagline: string;
  disclaimerTitle: string;
  disclaimerText: string;
  startButton: string;
  languageLabel: string;
};

export const copy: Record<Language, CopySchema> = {
  en: {
    appName: "Veritas",
    tagline: "AI-powered multilingual pre-consultation assistant",
    disclaimerTitle: "Important",
    disclaimerText:
      "Veritas is not a diagnosis tool. It helps organize symptoms before a medical consultation. In emergencies, seek immediate medical attention.",
    startButton: "Start Assessment",
    languageLabel: "Language",
  },
  hi: {
    appName: "Veritas",
    tagline: "एआई आधारित बहुभाषी प्री-कंसल्टेशन सहायक",
    disclaimerTitle: "महत्वपूर्ण",
    disclaimerText:
      "Veritas कोई डायग्नोसिस टूल नहीं है। यह मेडिकल कंसल्टेशन से पहले लक्षणों को व्यवस्थित करने में मदद करता है। आपात स्थिति में तुरंत चिकित्सा सहायता लें।",
    startButton: "जांच शुरू करें",
    languageLabel: "भाषा",
  },
  hinglish: {
    appName: "Veritas",
    tagline: "AI-powered multilingual pre-consultation assistant",
    disclaimerTitle: "Important",
    disclaimerText:
      "Veritas diagnosis tool nahi hai. Yeh doctor consultation se pehle symptoms ko organize karne mein help karta hai. Emergency mein turant medical help lo.",
    startButton: "Assessment Start Karo",
    languageLabel: "Language",
  },
};