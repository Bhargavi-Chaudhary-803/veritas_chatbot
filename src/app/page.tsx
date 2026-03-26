"use client";

import { useState } from "react";
import Link from "next/link";

type Language = "en" | "hi" | "hinglish";

const copy = {
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

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("en");
  const text = copy[language];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{text.appName}</h1>
            <p className="mt-2 text-sm text-slate-600">{text.tagline}</p>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="language" className="text-sm font-medium text-slate-700">
              {text.languageLabel}
            </label>

            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{text.disclaimerTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {text.disclaimerText}
          </p>

          <div className="mt-6">
            <Link
              href="/chat"
              className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {text.startButton}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}