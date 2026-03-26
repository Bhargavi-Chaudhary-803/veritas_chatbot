import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type LangMode = "english" | "hindi" | "hinglish" | "tamil" | "bengali";
type Urgency = "Low" | "Moderate" | "High";

type AssessmentRequest = {
  age?: string;
  symptoms?: string;
  duration?: string;
  severity?: string;
  lang?: LangMode;
};

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
  urgency: Urgency;
  specialtyKey: SpecialtyKey;
  recommendedSpecialist: string;
  possibleCondition: string;
  confidenceNote: string;
  shouldSeeDoctor: boolean;
  advice: string[];
  redFlags: string[];
  disclaimer: string;
};

const SPECIALIST_LABELS: Record<SpecialtyKey, string> = {
  general_physician: "General Physician",
  dermatologist: "Dermatologist",
  cardiologist: "Cardiologist",
  orthopedic: "Orthopedic",
  ent: "ENT Specialist",
  ophthalmologist: "Ophthalmologist",
  psychiatrist: "Psychiatrist",
  pediatrician: "Pediatrician",
  gynecologist: "Gynecologist",
  neurologist: "Neurologist",
  gastroenterologist: "Gastroenterologist",
  pulmonologist: "Pulmonologist",
};

const SPECIALTY_RULES: Array<{
  key: SpecialtyKey;
  keywords: string[];
  possibleCondition: string;
}> = [
  {
    key: "orthopedic",
    keywords: [
      "ankle",
      "leg",
      "knee",
      "foot",
      "feet",
      "toe",
      "arm",
      "wrist",
      "elbow",
      "shoulder",
      "neck pain",
      "back pain",
      "joint",
      "bone",
      "fracture",
      "sprain",
      "strain",
      "bruise",
      "bruising",
      "swelling",
      "twisted",
      "fell",
      "fall",
      "injury",
      "hurt while walking",
      "cannot bear weight",
      "limping",
      "pain after fall",
    ],
    possibleCondition:
      "Possible sprain, bruise, soft tissue injury, ligament injury, or bone and joint-related condition.",
  },
  {
    key: "ophthalmologist",
    keywords: [
      "eye",
      "eyes",
      "vision",
      "blurred vision",
      "blurry vision",
      "eye pain",
      "eye redness",
      "red eye",
      "watering eyes",
      "itchy eyes",
      "eye strain",
      "swollen eyelid",
    ],
    possibleCondition:
      "Possible eye infection, allergy, strain, or other vision-related condition.",
  },
  {
    key: "cardiologist",
    keywords: [
      "chest pain",
      "chest tightness",
      "palpitation",
      "palpitations",
      "heart",
      "breathlessness",
      "shortness of breath",
      "difficulty breathing",
      "irregular heartbeat",
    ],
    possibleCondition:
      "Possible heart-related or circulation-related condition.",
  },
  {
    key: "pulmonologist",
    keywords: [
      "wheezing",
      "asthma",
      "persistent cough",
      "coughing",
      "breathing issue",
      "lung",
      "phlegm",
      "cough with mucus",
    ],
    possibleCondition:
      "Possible respiratory or lung-related condition.",
  },
  {
    key: "dermatologist",
    keywords: [
      "skin",
      "rash",
      "itching",
      "itchy skin",
      "acne",
      "pimple",
      "eczema",
      "fungal",
      "hives",
      "allergy on skin",
      "red patches",
    ],
    possibleCondition:
      "Possible skin allergy, dermatitis, acne-related issue, or other skin condition.",
  },
  {
    key: "ent",
    keywords: [
      "ear pain",
      "ear infection",
      "ear discharge",
      "nose block",
      "blocked nose",
      "runny nose",
      "sore throat",
      "throat pain",
      "tonsil",
      "tonsillitis",
      "sinus",
      "sinusitis",
      "hoarseness",
      "voice pain",
      "cold",
      "cough",
    ],
    possibleCondition:
      "Possible throat infection, sinus issue, ear condition, or other ENT problem.",
  },
  {
    key: "gastroenterologist",
    keywords: [
      "stomach",
      "abdomen",
      "abdominal pain",
      "gas",
      "acidity",
      "bloating",
      "constipation",
      "diarrhea",
      "vomiting",
      "nausea",
      "indigestion",
      "loose motion",
    ],
    possibleCondition:
      "Possible digestive, stomach, or gut-related condition.",
  },
  {
    key: "neurologist",
    keywords: [
      "migraine",
      "headache",
      "seizure",
      "numbness",
      "tingling",
      "dizziness",
      "vertigo",
      "fainting",
      "tremor",
    ],
    possibleCondition:
      "Possible nerve-related, migraine-related, or neurological condition.",
  },
  {
    key: "psychiatrist",
    keywords: [
      "anxiety",
      "panic",
      "depression",
      "stress",
      "mental health",
      "insomnia",
      "overthinking",
      "low mood",
      "sleep issue",
    ],
    possibleCondition:
      "Possible anxiety-related, mood-related, or sleep-related condition.",
  },
  {
    key: "gynecologist",
    keywords: [
      "period",
      "period pain",
      "menstrual",
      "pregnancy",
      "pcos",
      "pelvic pain",
      "white discharge",
      "uterus",
      "ovary",
    ],
    possibleCondition:
      "Possible gynecological or reproductive-health-related condition.",
  },
  {
    key: "pediatrician",
    keywords: ["child", "baby", "infant", "kid", "newborn", "toddler"],
    possibleCondition:
      "Possible child-health-related condition needing pediatric review.",
  },
];

function sanitizeJsonBlock(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}

function normalizeText(value?: string) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasKeyword(text: string, keyword: string) {
  const escaped = escapeRegex(keyword.toLowerCase().trim());
  const regex = new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, "i");
  return regex.test(text);
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => hasKeyword(text, keyword));
}

function getSpecialistLabel(key: SpecialtyKey) {
  return SPECIALIST_LABELS[key];
}

function inferSpecialty(symptoms: string): {
  specialtyKey: SpecialtyKey;
  recommendedSpecialist: string;
  possibleCondition: string;
} {
  const text = normalizeText(symptoms);

  for (const rule of SPECIALTY_RULES) {
    if (hasAny(text, rule.keywords)) {
      return {
        specialtyKey: rule.key,
        recommendedSpecialist: getSpecialistLabel(rule.key),
        possibleCondition: rule.possibleCondition,
      };
    }
  }

  return {
    specialtyKey: "general_physician",
    recommendedSpecialist: getSpecialistLabel("general_physician"),
    possibleCondition:
      "Possible common infection, viral illness, fever-related illness, weakness-related illness, or other non-specific general condition.",
  };
}

function getUrgency(symptoms: string, severity?: string, specialtyKey?: SpecialtyKey): Urgency {
  const text = normalizeText(symptoms);
  const severityText = normalizeText(severity);

  if (
    severityText === "high" ||
    hasAny(text, [
      "severe chest pain",
      "difficulty breathing",
      "shortness of breath",
      "unconscious",
      "fainting",
      "seizure",
      "blood vomiting",
      "vomiting blood",
      "cannot bear weight",
      "severe swelling",
    ])
  ) {
    return "High";
  }

  if (specialtyKey === "cardiologist" || specialtyKey === "pulmonologist") {
    return "High";
  }

  if (severityText === "low" || hasAny(text, ["mild", "slight"])) {
    return "Low";
  }

  return "Moderate";
}

function getLocalizedStrings(lang: LangMode) {
  const base = {
    english: {
      summary: "This is a basic symptom assessment, not a medical diagnosis.",
      confidenceNote:
        "This is only a possible cause based on the symptoms shared, not a confirmed diagnosis.",
      advice: [
        "Monitor symptoms closely and avoid self-medicating without clarity.",
        "Rest the affected area if there is injury, and note any new or worsening symptoms.",
        "Seek medical help quickly if serious warning signs appear.",
      ],
      redFlags: [
        "Difficulty breathing",
        "Severe chest pain",
        "Fainting or seizure",
        "Sudden worsening",
      ],
      disclaimer:
        "This assessment is informational and not a substitute for a licensed doctor.",
    },
    hindi: {
      summary: "यह एक बुनियादी लक्षण मूल्यांकन है, अंतिम चिकित्सीय निदान नहीं।",
      confidenceNote:
        "यह केवल साझा किए गए लक्षणों के आधार पर एक संभावित कारण है, पक्का निदान नहीं।",
      advice: [
        "लक्षणों पर नज़र रखें और बिना स्पष्टता के दवा न लें।",
        "चोट हो तो प्रभावित हिस्से को आराम दें और नए या बढ़ते लक्षण नोट करें।",
        "गंभीर चेतावनी संकेत होने पर तुरंत डॉक्टर से मिलें।",
      ],
      redFlags: [
        "सांस लेने में दिक्कत",
        "तेज सीने का दर्द",
        "बेहोशी या दौरा",
        "अचानक हालत बिगड़ना",
      ],
      disclaimer:
        "यह जानकारी केवल सामान्य मार्गदर्शन के लिए है, डॉक्टर की सलाह का विकल्प नहीं।",
    },
    hinglish: {
      summary: "Yeh basic symptom assessment hai, final medical diagnosis nahi hai.",
      confidenceNote:
        "Yeh symptoms ke basis par sirf ek possible cause hai, confirmed diagnosis nahi.",
      advice: [
        "Symptoms ko observe karo aur bina clarity ke medicine mat lo.",
        "Injury ho to affected area ko rest do aur naye ya worsening symptoms note karo.",
        "Serious warning signs aayen to jaldi doctor dikhao.",
      ],
      redFlags: [
        "Breathing issue",
        "Severe chest pain",
        "Fainting ya seizure",
        "Sudden worsening",
      ],
      disclaimer:
        "Yeh sirf informational guidance hai, licensed doctor ka substitute nahi hai.",
    },
    tamil: {
      summary: "இது அடிப்படை அறிகுறி மதிப்பீடு மட்டுமே; இது மருத்துவ இறுதி நோயறிதல் அல்ல.",
      confidenceNote:
        "பகிரப்பட்ட அறிகுறிகளை அடிப்படையாகக் கொண்ட ஒரு சாத்தியமான காரணம் மட்டுமே இது; உறுதியான நோயறிதல் அல்ல.",
      advice: [
        "அறிகுறிகளை கவனியுங்கள்; தெளிவில்லாமல் மருந்து எடுத்துக்கொள்ள வேண்டாம்.",
        "காயம் இருந்தால் பாதிக்கப்பட்ட பகுதியை ஓய்வில் வைத்துக் கொண்டு மோசமடையும் அறிகுறிகளை பதிவு செய்யுங்கள்.",
        "கடுமையான எச்சரிக்கை அறிகுறிகள் இருந்தால் உடனே மருத்துவரை அணுகுங்கள்.",
      ],
      redFlags: [
        "மூச்சுத் திணறல்",
        "கடுமையான மார்பு வலி",
        "மயக்கம் அல்லது fits",
        "திடீர் மோசமாதல்",
      ],
      disclaimer:
        "இது பொது தகவலுக்காக மட்டுமே; மருத்துவரின் ஆலோசனைக்கு மாற்றாகாது.",
    },
    bengali: {
      summary: "এটি একটি প্রাথমিক উপসর্গ মূল্যায়ন, চূড়ান্ত চিকিৎসা নির্ণয় নয়।",
      confidenceNote:
        "এটি শুধুমাত্র দেওয়া উপসর্গের ভিত্তিতে একটি সম্ভাব্য কারণ, নিশ্চিত রোগ নির্ণয় নয়।",
      advice: [
        "উপসর্গ লক্ষ্য করুন এবং নিশ্চিত না হয়ে ওষুধ খাবেন না।",
        "চোট থাকলে আক্রান্ত অংশকে বিশ্রাম দিন এবং নতুন বা বাড়তে থাকা উপসর্গ লিখে রাখুন।",
        "গুরুতর সতর্কতা দেখা দিলে দ্রুত ডাক্তার দেখান।",
      ],
      redFlags: [
        "শ্বাসকষ্ট",
        "তীব্র বুকের ব্যথা",
        "অজ্ঞান হওয়া বা খিঁচুনি",
        "হঠাৎ অবনতি",
      ],
      disclaimer:
        "এটি শুধুমাত্র সাধারণ তথ্যের জন্য, ডাক্তারের বিকল্প নয়।",
    },
  } as const;

  return base[lang];
}

function isValidUrgency(value: unknown): value is Urgency {
  return value === "Low" || value === "Moderate" || value === "High";
}

function isValidSpecialtyKey(value: unknown): value is SpecialtyKey {
  return Object.prototype.hasOwnProperty.call(SPECIALIST_LABELS, String(value));
}

function buildFallbackAssessment(body: AssessmentRequest): AssessmentResult {
  const lang = body.lang || "english";
  const inferred = inferSpecialty(body.symptoms || "");
  const urgency = getUrgency(body.symptoms || "", body.severity, inferred.specialtyKey);
  const copy = getLocalizedStrings(lang);

  return {
    summary: copy.summary,
    urgency,
    specialtyKey: inferred.specialtyKey,
    recommendedSpecialist: inferred.recommendedSpecialist,
    possibleCondition: inferred.possibleCondition,
    confidenceNote: copy.confidenceNote,
    shouldSeeDoctor: urgency !== "Low",
    advice: copy.advice,
    redFlags: copy.redFlags,
    disclaimer: copy.disclaimer,
  };
}

function normalizeAssessmentResult(
  parsed: Partial<AssessmentResult>,
  body: AssessmentRequest
): AssessmentResult {
  const fallback = buildFallbackAssessment(body);
  const specialtyKey = isValidSpecialtyKey(parsed.specialtyKey)
    ? parsed.specialtyKey
    : fallback.specialtyKey;

  return {
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : fallback.summary,
    urgency: isValidUrgency(parsed.urgency) ? parsed.urgency : fallback.urgency,
    specialtyKey,
    recommendedSpecialist: getSpecialistLabel(specialtyKey),
    possibleCondition:
      typeof parsed.possibleCondition === "string" && parsed.possibleCondition.trim()
        ? parsed.possibleCondition.trim()
        : fallback.possibleCondition,
    confidenceNote:
      typeof parsed.confidenceNote === "string" && parsed.confidenceNote.trim()
        ? parsed.confidenceNote.trim()
        : fallback.confidenceNote,
    shouldSeeDoctor:
      typeof parsed.shouldSeeDoctor === "boolean"
        ? parsed.shouldSeeDoctor
        : fallback.shouldSeeDoctor,
    advice:
      Array.isArray(parsed.advice) && parsed.advice.length
        ? parsed.advice.filter(
            (item): item is string => typeof item === "string" && item.trim().length > 0
          )
        : fallback.advice,
    redFlags:
      Array.isArray(parsed.redFlags) && parsed.redFlags.length
        ? parsed.redFlags.filter(
            (item): item is string => typeof item === "string" && item.trim().length > 0
          )
        : fallback.redFlags,
    disclaimer:
      typeof parsed.disclaimer === "string" && parsed.disclaimer.trim()
        ? parsed.disclaimer.trim()
        : fallback.disclaimer,
  };
}

export async function POST(req: NextRequest) {
  let body: AssessmentRequest = {};

  try {
    body = (await req.json()) as AssessmentRequest;

    if (!body.symptoms?.trim()) {
      return NextResponse.json(
        { error: "Symptoms are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        ok: true,
        assessment: buildFallbackAssessment(body),
        mode: "fallback",
      });
    }

    const lang = body.lang || "english";

    const instructions = `
You are a cautious medical triage assistant for a student healthcare app.
You must not claim a definitive diagnosis.
You may mention the most likely possible condition or disease category, but only as a possibility, never as confirmation.

Return STRICT JSON only with this exact shape:
{
  "summary": "string",
  "urgency": "Low" | "Moderate" | "High",
  "specialtyKey": "general_physician" | "dermatologist" | "cardiologist" | "orthopedic" | "ent" | "ophthalmologist" | "psychiatrist" | "pediatrician" | "gynecologist" | "neurologist" | "gastroenterologist" | "pulmonologist",
  "recommendedSpecialist": "string",
  "possibleCondition": "string",
  "confidenceNote": "string",
  "shouldSeeDoctor": true,
  "advice": ["string", "string", "string"],
  "redFlags": ["string", "string", "string"],
  "disclaimer": "string"
}

Rules:
- Write the response in ${lang}
- specialtyKey must be one of the exact allowed values
- recommendedSpecialist must correctly match specialtyKey
- For falls, bruising, swelling, ankle pain, leg pain, joint injuries, sprains, fractures, or pain after injury, strongly prefer orthopedic
- Only choose ophthalmologist for clearly eye-related symptoms
- Use general_physician only for broad, mixed, fever-related, weakness-related, or unclear symptoms
- possibleCondition must be a likely possibility only, not a confirmed diagnosis
- Keep summary short
- Give exactly 3 advice points
- Give 3 or 4 red flags
- Do not include markdown
`;

    const input = `
Age: ${body.age || "not provided"}
Symptoms: ${body.symptoms || ""}
Duration: ${body.duration || "not provided"}
Severity: ${body.severity || "not provided"}

Assess this case and recommend the most relevant doctor specialty.
`;

    const response = await client.responses.create({
      model: "gpt-5.4",
      instructions,
      input,
    });

    const text = sanitizeJsonBlock(response.output_text || "");
    const parsed = JSON.parse(text) as Partial<AssessmentResult>;

    return NextResponse.json({
      ok: true,
      assessment: normalizeAssessmentResult(parsed, body),
      mode: "openai",
    });
  } catch (error) {
    console.error("Assessment API error:", error);

    return NextResponse.json({
      ok: true,
      assessment: buildFallbackAssessment(body),
      mode: "fallback",
    });
  }
}