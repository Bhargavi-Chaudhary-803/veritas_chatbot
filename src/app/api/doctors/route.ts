import { NextRequest, NextResponse } from "next/server";
import {
  geocodeLocation,
  searchNearbyDoctors,
  type DoctorPlace,
} from "../../../lib/osm";

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

type RequestBody = {
  location?: string;
  lat?: number;
  lon?: number;
  radiusMeters?: number;
  specialtyKey?: SpecialtyKey;
  recommendedSpecialist?: string;
};

type RankedDoctor = DoctorPlace & {
  score: number;
};

const SPECIALTY_MATCHERS: Record<SpecialtyKey, string[]> = {
  general_physician: [
    "general",
    "physician",
    "general physician",
    "family medicine",
    "doctor",
    "clinic",
    "medical",
  ],
  dermatologist: ["dermatology", "dermatologist", "skin"],
  cardiologist: ["cardiology", "cardiologist", "heart"],
  orthopedic: ["orthopedic", "orthopaedic", "orthopedics", "bone", "joint", "injury"],
  ent: ["ent", "ear", "nose", "throat", "otolaryngology"],
  ophthalmologist: ["ophthalmology", "ophthalmologist", "eye", "vision"],
  psychiatrist: ["psychiatry", "psychiatrist", "mental"],
  pediatrician: ["pediatrics", "pediatrician", "child"],
  gynecologist: ["gynecology", "gynaecology", "gynecologist", "obgyn", "women"],
  neurologist: ["neurology", "neurologist", "neuro"],
  gastroenterologist: [
    "gastroenterology",
    "gastroenterologist",
    "stomach",
    "digestive",
  ],
  pulmonologist: ["pulmonology", "pulmonologist", "lung", "respiratory"],
};

function normalizeText(value?: string) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function getDoctorText(doctor: DoctorPlace) {
  return normalizeText(
    [doctor.name, doctor.specialityHint, doctor.address].filter(Boolean).join(" ")
  );
}

function rankDoctors(
  doctors: DoctorPlace[],
  specialtyKey: SpecialtyKey = "general_physician"
): RankedDoctor[] {
  const specialtyMatchers = SPECIALTY_MATCHERS[specialtyKey] || [];
  const broadGeneralFallback = specialtyKey === "general_physician";

  return doctors
    .map((doctor) => {
      let score = 0;
      const haystack = getDoctorText(doctor);

      if (doctor.phone && doctor.phone !== "Phone not available") score += 2;
      if (doctor.address && doctor.address !== "Address not available") score += 2;
      if (doctor.website && doctor.website !== "Website not available") score += 1;
      if (doctor.name && doctor.name !== "Unnamed clinic") score += 1;

      if (doctor.distanceMeters <= 1000) score += 5;
      else if (doctor.distanceMeters <= 2000) score += 4;
      else if (doctor.distanceMeters <= 3500) score += 3;
      else if (doctor.distanceMeters <= 5000) score += 2;
      else score += 1;

      if (matchesAny(haystack, specialtyMatchers)) {
        score += 10;
      } else if (
        broadGeneralFallback &&
        matchesAny(haystack, ["general", "physician", "doctor", "clinic"])
      ) {
        score += 6;
      }

      return { ...doctor, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.distanceMeters - b.distanceMeters;
    });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;

    const radiusMeters =
      typeof body.radiusMeters === "number" && body.radiusMeters > 0
        ? Math.min(body.radiusMeters, 8000)
        : 2000;

    let lat = body.lat;
    let lon = body.lon;
    let resolvedLocation = body.location?.trim() || "";

    if (
      typeof lat !== "number" ||
      Number.isNaN(lat) ||
      typeof lon !== "number" ||
      Number.isNaN(lon)
    ) {
      if (!resolvedLocation) {
        return NextResponse.json(
          { ok: false, error: "Provide either location or lat/lon." },
          { status: 400 }
        );
      }

      const geocoded = await geocodeLocation(resolvedLocation);
      lat = geocoded.lat;
      lon = geocoded.lon;
      resolvedLocation = geocoded.displayName;
    }

    const specialtyKey = body.specialtyKey || "general_physician";
    const doctors = await searchNearbyDoctors(lat, lon, radiusMeters);
    const rankedDoctors = rankDoctors(doctors, specialtyKey).slice(0, 10);

    return NextResponse.json({
      ok: true,
      location: resolvedLocation,
      coordinates: { lat, lon },
      total: rankedDoctors.length,
      doctors: rankedDoctors,
      specialtyKey,
      recommendedSpecialist: body.recommendedSpecialist || null,
    });
  } catch (error: any) {
    console.error("Doctors API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Something went wrong while finding doctors.",
      },
      { status: 500 }
    );
  }
}