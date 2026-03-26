type GeocodeResult = {
  lat: number;
  lon: number;
  displayName: string;
};

export type DoctorPlace = {
  name: string;
  lat: number;
  lon: number;
  address: string;
  phone: string;
  website: string;
  specialityHint: string;
  distanceMeters: number;
  source: "osm";
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const APP_HEADERS = {
  "User-Agent": "veritas-healthcare-demo/1.0",
  "Accept-Language": "en",
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildAddress(tags: Record<string, string>) {
  const full =
    cleanText(tags["addr:full"]) ||
    cleanText(tags["contact:address"]) ||
    cleanText(tags["address"]);

  if (full) return full;

  const parts = [
    cleanText(tags["addr:housename"]),
    cleanText(tags["addr:housenumber"]),
    cleanText(tags["addr:street"]),
    cleanText(tags["addr:suburb"]),
    cleanText(tags["addr:neighbourhood"]),
    cleanText(tags["addr:city"] || tags["addr:town"] || tags["addr:village"]),
    cleanText(tags["addr:county"]),
    cleanText(tags["addr:state"]),
    cleanText(tags["addr:postcode"]),
    cleanText(tags["addr:country"]),
  ].filter(Boolean);

  return parts.join(", ");
}

function extractPhone(tags: Record<string, string>) {
  return (
    cleanText(tags["contact:phone"]) ||
    cleanText(tags["phone"]) ||
    cleanText(tags["contact:mobile"]) ||
    cleanText(tags["mobile"]) ||
    cleanText(tags["telephone"]) ||
    cleanText(tags["contact:telephone"]) ||
    ""
  );
}

function extractWebsite(tags: Record<string, string>) {
  return (
    cleanText(tags["contact:website"]) ||
    cleanText(tags["website"]) ||
    cleanText(tags["url"]) ||
    cleanText(tags["contact:url"]) ||
    ""
  );
}

function detectSpecialityHint(tags: Record<string, string>) {
  return (
    cleanText(tags["healthcare:speciality"]) ||
    cleanText(tags["healthcare:specialty"]) ||
    cleanText(tags["speciality"]) ||
    cleanText(tags["specialty"]) ||
    cleanText(tags["healthcare"]) ||
    cleanText(tags["amenity"]) ||
    "doctor"
  );
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15000
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?` +
      new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: "jsonv2",
        addressdetails: "1",
      }).toString();

    const data = await fetchJsonWithTimeout(
      url,
      {
        headers: APP_HEADERS,
      },
      12000
    );

    return cleanText(data?.display_name) || "Address not available";
  } catch {
    return "Address not available";
  }
}

async function fetchOverpass(query: string) {
  let lastError: unknown;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await fetchJsonWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": APP_HEADERS["User-Agent"],
          },
          body: `data=${encodeURIComponent(query)}`,
        },
        20000
      );

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("All Overpass endpoints failed.");
}

function mapElements(
  data: any,
  originLat: number,
  originLon: number
): DoctorPlace[] {
  if (!data?.elements || !Array.isArray(data.elements)) {
    return [];
  }

  return data.elements
    .map((el: any) => {
      const tags = el?.tags || {};
      const lat = Number(el?.lat ?? el?.center?.lat);
      const lon = Number(el?.lon ?? el?.center?.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }

      return {
        name: cleanText(tags.name) || "Unnamed clinic",
        lat,
        lon,
        address: buildAddress(tags) || "Address not available",
        phone: extractPhone(tags) || "Phone not available",
        website: extractWebsite(tags) || "Website not available",
        specialityHint: detectSpecialityHint(tags),
        distanceMeters: getDistanceMeters(originLat, originLon, lat, lon),
        source: "osm" as const,
      };
    })
    .filter(Boolean) as DoctorPlace[];
}

function dedupePlaces(items: DoctorPlace[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.name.toLowerCase()}|${item.lat.toFixed(5)}|${item.lon.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function enrichTopMissingAddresses(
  items: DoctorPlace[],
  maxLookups = 2
): Promise<DoctorPlace[]> {
  const result = [...items];
  let used = 0;

  for (let i = 0; i < result.length; i++) {
    if (used >= maxLookups) break;

    if (result[i].address === "Address not available") {
      if (used > 0) {
        await sleep(1100);
      }

      const resolved = await reverseGeocode(result[i].lat, result[i].lon);
      result[i] = {
        ...result[i],
        address: resolved || "Address not available",
      };
      used++;
    }
  }

  return result;
}

export async function geocodeLocation(
  location: string
): Promise<GeocodeResult> {
  const normalized = location.toLowerCase().includes("india")
    ? location
    : `${location}, India`;

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: normalized,
      format: "jsonv2",
      limit: "1",
      addressdetails: "1",
      countrycodes: "in",
    }).toString();

  const data = await fetchJsonWithTimeout(
    url,
    {
      headers: APP_HEADERS,
    },
    12000
  );

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Could not find that location.");
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    displayName: cleanText(data[0].display_name) || normalized,
  };
}

async function searchCategory(
  lat: number,
  lon: number,
  radiusMeters: number,
  category: "doctor" | "hospital"
): Promise<DoctorPlace[]> {
  const query =
    category === "doctor"
      ? `
[out:json][timeout:25];
(
  node(around:${radiusMeters},${lat},${lon})["amenity"="doctors"];
  way(around:${radiusMeters},${lat},${lon})["amenity"="doctors"];
  relation(around:${radiusMeters},${lat},${lon})["amenity"="doctors"];
  node(around:${radiusMeters},${lat},${lon})["healthcare"="doctor"];
  way(around:${radiusMeters},${lat},${lon})["healthcare"="doctor"];
  relation(around:${radiusMeters},${lat},${lon})["healthcare"="doctor"];
);
out center tags;
`.trim()
      : `
[out:json][timeout:25];
(
  node(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
  way(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
  relation(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
);
out center tags;
`.trim();

  const data = await fetchOverpass(query);
  let items = mapElements(data, lat, lon);

  items = dedupePlaces(items);
  items.sort((a, b) => a.distanceMeters - b.distanceMeters);
  items = items.slice(0, 10);
  items = await enrichTopMissingAddresses(items, 2);

  return items;
}

export async function searchNearbyDoctors(
  lat: number,
  lon: number,
  radiusMeters = 2000
): Promise<DoctorPlace[]> {
  const radii = [radiusMeters, 3500, 5000];

  for (const r of radii) {
    const doctors = await searchCategory(lat, lon, r, "doctor");
    if (doctors.length > 0) {
      return doctors;
    }
  }

  for (const r of radii) {
    const hospitals = await searchCategory(lat, lon, r, "hospital");
    if (hospitals.length > 0) {
      return hospitals;
    }
  }

  return [];
}