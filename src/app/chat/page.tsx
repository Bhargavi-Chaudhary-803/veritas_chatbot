"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Clock3,
  Loader2,
  MapPin,
  Search,
  ShieldPlus,
  Stethoscope,
  UserRound,
  Languages,
} from "lucide-react";
import DoctorResults from "../../components/DoctorResults";

type Doctor = {
  name: string;
  lat: number;
  lon: number;
  address: string;
  phone: string;
  website: string;
  specialityHint: string;
  distanceMeters: number;
  source: "osm";
  score?: number;
};

type DoctorsApiResponse = {
  ok: boolean;
  location?: string;
  total?: number;
  doctors?: Doctor[];
  error?: string;
};

type LangMode = "english" | "hindi" | "hinglish" | "tamil" | "bengali";

type SpecialtyKey =
  | "general_physician"
  | "dermatologist"
  | "cardiologist"
  | "orthopedic"
  | "ent"
  | "ophthalmologist"
  | "psychiatrist"
  | "pediatrician"
  | "gynecologist"
  | "neurologist"
  | "gastroenterologist"
  | "pulmonologist";

type AssessmentResult = {
  summary: string;
  urgency: "Low" | "Moderate" | "High";
  specialtyKey: SpecialtyKey;
  recommendedSpecialist: string;
  possibleCondition: string;
  confidenceNote: string;
  shouldSeeDoctor: boolean;
  advice: string[];
  redFlags: string[];
  disclaimer: string;
};

type AssessmentApiResponse = {
  ok: boolean;
  assessment?: AssessmentResult;
  error?: string;
};

const uiText: Record<
  LangMode,
  {
    title: string;
    subtitle: string;
    age: string;
    location: string;
    symptoms: string;
    duration: string;
    severity: string;
    analyze: string;
    findDoctors: string;
    result: string;
    specialist: string;
    visitNeeded: string;
    possibleCondition: string;
    confidenceNote: string;
    advice: string;
    redFlags: string;
    low: string;
    moderate: string;
    high: string;
    yes: string;
    notImmediately: string;
    locationPlaceholder: string;
    symptomPlaceholder: string;
    durationPlaceholder: string;
    agePlaceholder: string;
  }
> = {
  english: {
    title: "Veritas Health Assessment",
    subtitle: "Describe symptoms below.",
    age: "Age",
    location: "Location",
    symptoms: "Symptoms",
    duration: "Duration",
    severity: "Severity",
    analyze: "Analyze symptoms",
    findDoctors: "Find nearby doctors",
    result: "Assessment Result",
    specialist: "Recommended specialist",
    visitNeeded: "Doctor visit needed",
    possibleCondition: "Possible condition",
    confidenceNote: "Assessment note",
    advice: "Basic advice",
    redFlags: "Red flags",
    low: "Low",
    moderate: "Moderate",
    high: "High",
    yes: "Yes",
    notImmediately: "Not immediately",
    locationPlaceholder: "City or area",
    symptomPlaceholder: "Describe what you are feeling",
    durationPlaceholder: "Since today / 2 days / 1 week",
    agePlaceholder: "Enter age",
  },
  hindi: {
    title: "स्वास्थ्य मूल्यांकन",
    subtitle: "पहले लक्षण लिखें। डॉक्टर खोज बाद में होगी।",
    age: "उम्र",
    location: "स्थान",
    symptoms: "लक्षण",
    duration: "अवधि",
    severity: "गंभीरता",
    analyze: "लक्षणों का विश्लेषण करें",
    findDoctors: "नज़दीकी डॉक्टर खोजें",
    result: "मूल्यांकन परिणाम",
    specialist: "सुझावित विशेषज्ञ",
    visitNeeded: "क्या डॉक्टर से मिलना चाहिए",
    possibleCondition: "संभावित स्थिति",
    confidenceNote: "मूल्यांकन नोट",
    advice: "सामान्य सलाह",
    redFlags: "खतरे के संकेत",
    low: "कम",
    moderate: "मध्यम",
    high: "अधिक",
    yes: "हाँ",
    notImmediately: "अभी तुरंत नहीं",
    locationPlaceholder: "शहर या इलाका",
    symptomPlaceholder: "जो महसूस हो रहा है उसे लिखें",
    durationPlaceholder: "आज से / 2 दिन / 1 सप्ताह",
    agePlaceholder: "उम्र लिखें",
  },
  hinglish: {
    title: "Veritas Health Assessment",
    subtitle: "Pehle symptoms likhiye neeche.",
    age: "Age",
    location: "Location",
    symptoms: "Symptoms",
    duration: "Duration",
    severity: "Severity",
    analyze: "Analyze symptoms",
    findDoctors: "Find nearby doctors",
    result: "Assessment Result",
    specialist: "Recommended specialist",
    visitNeeded: "Doctor visit needed",
    possibleCondition: "Possible condition",
    confidenceNote: "Assessment note",
    advice: "Basic advice",
    redFlags: "Red flags",
    low: "Low",
    moderate: "Moderate",
    high: "High",
    yes: "Yes",
    notImmediately: "Not immediately",
    locationPlaceholder: "City ya area",
    symptomPlaceholder: "Jo feel ho raha hai woh likho",
    durationPlaceholder: "Since today / 2 days / 1 week",
    agePlaceholder: "Age enter karo",
  },
  tamil: {
    title: "உடல்நல மதிப்பீடு",
    subtitle: "முதலில் அறிகுறிகளை எழுதுங்கள். அதன் பிறகு மருத்துவரை தேடலாம்.",
    age: "வயது",
    location: "இடம்",
    symptoms: "அறிகுறிகள்",
    duration: "காலநிலை",
    severity: "தீவிரம்",
    analyze: "அறிகுறிகளை பகுப்பாய்வு செய்",
    findDoctors: "அருகிலுள்ள மருத்துவர்களைக் கண்டுபிடி",
    result: "மதிப்பீட்டு முடிவு",
    specialist: "பரிந்துரைக்கப்பட்ட நிபுணர்",
    visitNeeded: "மருத்துவரை பார்க்க வேண்டுமா",
    possibleCondition: "சாத்தியமான நிலை",
    confidenceNote: "மதிப்பீட்டு குறிப்பு",
    advice: "அடிப்படை ஆலோசனை",
    redFlags: "அபாய அறிகுறிகள்",
    low: "குறைவு",
    moderate: "மிதமான",
    high: "அதிகம்",
    yes: "ஆம்",
    notImmediately: "உடனடியாக இல்லை",
    locationPlaceholder: "நகரம் அல்லது பகுதி",
    symptomPlaceholder: "உங்களுக்கு என்ன உணரப்படுகிறது என்று எழுதுங்கள்",
    durationPlaceholder: "இன்று முதல் / 2 நாட்கள் / 1 வாரம்",
    agePlaceholder: "வயதை எழுதுங்கள்",
  },
  bengali: {
    title: "স্বাস্থ্য মূল্যায়ন",
    subtitle: "আগে উপসর্গ লিখুন। ডাক্তার খোঁজা পরে হবে।",
    age: "বয়স",
    location: "স্থান",
    symptoms: "উপসর্গ",
    duration: "সময়কাল",
    severity: "তীব্রতা",
    analyze: "উপসর্গ বিশ্লেষণ করুন",
    findDoctors: "কাছাকাছি ডাক্তার খুঁজুন",
    result: "মূল্যায়নের ফল",
    specialist: "প্রস্তাবিত বিশেষজ্ঞ",
    visitNeeded: "ডাক্তার দেখানো দরকার",
    possibleCondition: "সম্ভাব্য অবস্থা",
    confidenceNote: "মূল্যায়ন নোট",
    advice: "প্রাথমিক পরামর্শ",
    redFlags: "ঝুঁকির লক্ষণ",
    low: "কম",
    moderate: "মাঝারি",
    high: "বেশি",
    yes: "হ্যাঁ",
    notImmediately: "এই মুহূর্তে নয়",
    locationPlaceholder: "শহর বা এলাকা",
    symptomPlaceholder: "আপনার কী অনুভূতি হচ্ছে লিখুন",
    durationPlaceholder: "আজ থেকে / ২ দিন / ১ সপ্তাহ",
    agePlaceholder: "বয়স লিখুন",
  },
};

export default function ChatPage() {
  const [lang, setLang] = useState<LangMode>("english");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("moderate");

  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(false);

  const [assessmentError, setAssessmentError] = useState("");
  const [doctorError, setDoctorError] = useState("");

  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [doctorResult, setDoctorResult] = useState<DoctorsApiResponse | null>(null);

  const t = uiText[lang];
  const canAssess = useMemo(() => symptoms.trim().length > 0, [symptoms]);

  async function handleAssessment(e: React.FormEvent) {
    e.preventDefault();

    if (!symptoms.trim()) {
      setAssessmentError("Please describe the symptoms first.");
      return;
    }

    try {
      setAssessmentLoading(true);
      setAssessmentError("");
      setDoctorError("");
      setDoctorResult(null);

      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age,
          symptoms,
          duration,
          severity,
          lang,
        }),
      });

      const data = (await res.json()) as AssessmentApiResponse;

      if (!res.ok || !data.ok || !data.assessment) {
        throw new Error(data.error || "Assessment could not be completed.");
      }

      setAssessment(data.assessment);
    } catch (err: any) {
      setAssessmentError(err?.message || "Assessment could not be completed.");
    } finally {
      setAssessmentLoading(false);
    }
  }

  async function findDoctors() {
    if (!location.trim()) {
      setDoctorError("Please enter a location to find nearby doctors.");
      return;
    }

    if (!assessment) {
      setDoctorError("Complete the assessment first.");
      return;
    }

    try {
      setDoctorLoading(true);
      setDoctorError("");

      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: location.trim(),
          specialtyKey: assessment.specialtyKey,
          recommendedSpecialist: assessment.recommendedSpecialist,
          radiusMeters: 2000,
        }),
      });

      const data = (await res.json()) as DoctorsApiResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not fetch doctors.");
      }

      setDoctorResult(data);
    } catch (err: any) {
      setDoctorError(err?.message || "Something went wrong while finding doctors.");
    } finally {
      setDoctorLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-sky-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 font-[var(--font-heading)]">
                {t.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{t.subtitle}</p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-sky-100 px-3 py-2">
              <Languages className="h-4 w-4 text-sky-600" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangMode)}
                className="bg-transparent text-sm text-slate-800 outline-none font-sans"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="hinglish">Hinglish</option>
                <option value="tamil">Tamil</option>
                <option value="bengali">Bengali</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleAssessment} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-sky-100 px-4 py-3">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <UserRound className="h-4 w-4 text-sky-600" />
                  {t.age}
                </label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t.agePlaceholder}
                  className="w-full bg-transparent text-sm text-slate-800 outline-none font-sans"
                />
              </div>

              <div className="rounded-xl border border-sky-100 px-4 py-3">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-sky-600" />
                  {t.location}
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t.locationPlaceholder}
                  className="w-full bg-transparent text-sm text-slate-800 outline-none font-sans"
                />
              </div>
            </div>

            <div className="rounded-xl border border-sky-100 px-4 py-3">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Activity className="h-4 w-4 text-sky-600" />
                {t.symptoms}
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={t.symptomPlaceholder}
                rows={5}
                className="w-full resize-none bg-transparent text-sm text-slate-800 outline-none font-sans"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-sky-100 px-4 py-3">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock3 className="h-4 w-4 text-sky-600" />
                  {t.duration}
                </label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder={t.durationPlaceholder}
                  className="w-full bg-transparent text-sm text-slate-800 outline-none font-sans"
                />
              </div>

              <div className="rounded-xl border border-sky-100 px-4 py-3">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <AlertCircle className="h-4 w-4 text-sky-600" />
                  {t.severity}
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 outline-none font-sans"
                >
                  <option value="low">{t.low}</option>
                  <option value="moderate">{t.moderate}</option>
                  <option value="high">{t.high}</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={assessmentLoading || !canAssess}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {assessmentLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldPlus className="h-4 w-4" />
              )}
              {t.analyze}
            </button>
          </form>

          {assessmentError && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {assessmentError}
            </div>
          )}
        </div>

        {assessment && (
          <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 font-[var(--font-heading)]">
                  {t.result}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{assessment.summary}</p>
              </div>

              <div className="rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
                {assessment.urgency}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-sky-100 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Stethoscope className="h-4 w-4 text-sky-600" />
                  {t.specialist}
                </div>
                <p className="mt-2 text-slate-900">{assessment.recommendedSpecialist}</p>
              </div>

              <div className="rounded-xl border border-sky-100 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ShieldPlus className="h-4 w-4 text-sky-600" />
                  {t.visitNeeded}
                </div>
                <p className="mt-2 text-slate-900">
                  {assessment.shouldSeeDoctor ? t.yes : t.notImmediately}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-sky-100 p-4">
                <div className="text-sm font-medium text-slate-700">
                  {t.possibleCondition}
                </div>
                <p className="mt-2 text-sm text-slate-900">
                  {assessment.possibleCondition}
                </p>
              </div>

              <div className="rounded-xl border border-sky-100 p-4">
                <div className="text-sm font-medium text-slate-700">
                  {t.confidenceNote}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {assessment.confidenceNote}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-sky-100 p-4">
                <div className="text-sm font-medium text-slate-700">{t.advice}</div>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {assessment.advice.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-sky-100 p-4">
                <div className="text-sm font-medium text-slate-700">{t.redFlags}</div>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {assessment.redFlags.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-sky-100 p-4 text-sm text-slate-500">
              {assessment.disclaimer}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={findDoctors}
                disabled={doctorLoading || !location.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {doctorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {t.findDoctors}
              </button>
            </div>

            {doctorError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {doctorError}
              </div>
            )}
          </div>
        )}

        {assessment && (
          <DoctorResults
            loading={doctorLoading}
            doctors={doctorResult?.doctors || []}
          />
        )}
      </div>
    </main>
  );
}