"use client";

import { Language, languageLabels } from "@/constants/languages";

type Props = {
  value: Language;
  onChange: (language: Language) => void;
};

export default function LanguageSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="language" className="text-sm font-medium text-slate-700">
        Language
      </label>

      <select
        id="language"
        value={value}
        onChange={(e) => onChange(e.target.value as Language)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
      >
        {Object.entries(languageLabels).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}