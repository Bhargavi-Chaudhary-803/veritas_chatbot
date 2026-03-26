"use client";

import {
  Globe,
  MapPin,
  Navigation,
  Phone,
  Stethoscope,
  Trophy,
} from "lucide-react";

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

type DoctorResultsProps = {
  doctors?: Doctor[];
  loading?: boolean;
};

const FALLBACKS = {
  name: "Unnamed clinic",
  address: "Address not available",
  phone: "Phone not available",
  website: "Website not available",
  specialty: "Doctor",
};

function formatDistance(distanceMeters?: number) {
  if (typeof distanceMeters !== "number") return "";
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function normalizeWebsite(url?: string) {
  if (!url || url === FALLBACKS.website) return "";
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
}

function safeText(value?: string, fallback?: string) {
  return value && value.trim() ? value.trim() : fallback || "";
}

export default function DoctorResults({
  doctors = [],
  loading = false,
}: DoctorResultsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 h-5 w-40 animate-pulse rounded bg-sky-100" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-sky-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-sky-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-sky-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!doctors.length) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
        No nearby doctors found for this specialty yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {doctors.map((doctor, index) => {
        const name = safeText(doctor.name, FALLBACKS.name);
        const specialty = safeText(doctor.specialityHint, FALLBACKS.specialty);
        const address = safeText(doctor.address, FALLBACKS.address);
        const phone = safeText(doctor.phone, FALLBACKS.phone);
        const website = safeText(doctor.website, FALLBACKS.website);

        const hasPhone = phone !== FALLBACKS.phone;
        const websiteHref = normalizeWebsite(website);
        const hasWebsite = Boolean(websiteHref);

        return (
          <div
            key={`${doctor.name}-${doctor.lat}-${doctor.lon}-${index}`}
            className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{name}</h3>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {specialty}
                  </div>

                  {typeof doctor.score === "number" && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      <Trophy className="h-3.5 w-3.5" />
                      Score {doctor.score}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm font-medium text-sky-700">
                {formatDistance(doctor.distanceMeters)}
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span>{address}</span>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span>{phone}</span>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                {hasWebsite ? (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sky-700 underline"
                  >
                    {website}
                  </a>
                ) : (
                  <span>{FALLBACKS.website}</span>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {hasPhone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              )}

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${doctor.lat},${doctor.lon}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
              >
                <Navigation className="h-4 w-4" />
                Directions
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}