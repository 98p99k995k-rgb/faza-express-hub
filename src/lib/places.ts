import type { Language } from "@/lib/translations";

export type PlaceCategory = "restaurants" | "cafes" | "pharmacies";
export type OsmElementType = "node" | "way" | "relation";
export type PlacePhoto = {
  name: string;
  authorAttributions: { displayName: string; uri?: string; photoUri?: string }[];
};

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  source: "google" | "osm";
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string[];
  rating?: number;
  ratingCount?: number;
  photos?: PlacePhoto[];
  businessStatus?: string;
  openNow?: boolean;
  googleMapsUri?: string;
  elementType?: OsmElementType;
};

export type PlaceDistanceGroup = {
  id: "within-1-km" | "1-to-3-km" | "3-to-5-km" | "5-to-10-km";
  title: string;
  places: (Place & { distanceKm: number })[];
};

export type GeoPoint = { lat: number; lon: number; label: string };

type OsmElement = {
  id: number;
  type: OsmElementType;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const categoryAmenities: Record<PlaceCategory, string> = {
  restaurants: '"amenity"~"restaurant|fast_food"',
  cafes: '"amenity"="cafe"',
  pharmacies: '"amenity"="pharmacy"',
};

function categoryLabel(category: PlaceCategory) {
  return category === "restaurants" ? "المطاعم" : category === "cafes" ? "الكافيهات" : "الصيدليات";
}

function elementToPlace(element: OsmElement, category: PlaceCategory): Place | null {
  const tags = element.tags ?? {};
  const point = element.center ?? element;
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return null;

  const name = tags.name || tags["name:ar"];
  if (!name) return null;

  const addressParts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:suburb"],
    tags["addr:city"],
  ].filter(Boolean);

  return {
    id: `${element.type}-${element.id}`,
    source: "osm",
    elementType: element.type,
    name,
    category,
    lat: point.lat as number,
    lon: point.lon as number,
    address: addressParts.join("، ") || undefined,
    phone: tags["contact:phone"] || tags.phone,
    website: tags["contact:website"] || tags.website,
    openingHours: tags.opening_hours ? [tags.opening_hours] : undefined,
  };
}

async function fetchOsm(query: string, signal?: AbortSignal): Promise<OsmElement[]> {
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ data: query }),
    signal,
  });
  if (!response.ok) throw new Error("تعذر الاتصال بمصدر بيانات الأماكن.");
  const payload = (await response.json()) as { elements?: OsmElement[] };
  if (!Array.isArray(payload.elements)) throw new Error("وصل رد غير مفهوم من مصدر بيانات الأماكن.");
  return payload.elements;
}

export async function searchPlaces(
  category: PlaceCategory,
  point: GeoPoint,
  signal?: AbortSignal,
): Promise<Place[]> {
  const amenity = categoryAmenities[category];
  const query = `[out:json][timeout:25];(node[${amenity}](around:7000,${point.lat},${point.lon});way[${amenity}](around:7000,${point.lat},${point.lon});relation[${amenity}](around:7000,${point.lat},${point.lon}););out center tags;`;
  const elements = await fetchOsm(query, signal);
  return elements
    .map((element) => elementToPlace(element, category))
    .filter((place): place is Place => place !== null)
    .sort((a, b) => distanceKm(point, a) - distanceKm(point, b));
}

export async function getPlace(
  id: string,
  category: PlaceCategory,
  signal?: AbortSignal,
): Promise<Place | null> {
  const match = /^(node|way|relation)-(\d+)$/.exec(id);
  if (!match) return null;
  const elementType = match[1] as OsmElementType;
  const osmId = match[2];
  const elements = await fetchOsm(
    `[out:json][timeout:20];${elementType}(${osmId});out center tags;`,
    signal,
  );
  return elements[0] ? elementToPlace(elements[0], category) : null;
}

export async function findLocation(
  query: string,
  language: Language = "ar",
  signal?: AbortSignal,
): Promise<GeoPoint> {
  const normalized = query.trim();
  if (!normalized) throw new Error("أدخل اسم المدينة أو الحي.");
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", normalized);
  url.searchParams.set("accept-language", language);
  const response = await fetch(url, { headers: { "Accept-Language": language }, signal });
  if (!response.ok) throw new Error("تعذر البحث عن الموقع. تحقق من اتصال الإنترنت.");
  const results = (await response.json()) as {
    lat?: string;
    lon?: string;
    display_name?: string;
  }[];
  const result = results[0];
  if (!result?.lat || !result.lon)
    throw new Error("لم نعثر على هذا الموقع. جرّب كتابة اسم المدينة والحي.");
  return {
    lat: Number(result.lat),
    lon: Number(result.lon),
    label: result.display_name || normalized,
  };
}

export function distanceKm(from: Pick<GeoPoint, "lat" | "lon">, to: Pick<Place, "lat" | "lon">) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = radians(to.lat - from.lat);
  const deltaLon = radians(to.lon - from.lon);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function formatDistance(distance: number, language: Language = "ar") {
  const unit = distance < 1 ? "meter" : "kilometer";
  const value = distance < 1 ? Math.round(distance * 1000) : distance;
  return new Intl.NumberFormat(language, { style: "unit", unit, unitDisplay: "short" }).format(
    value,
  );
}

export function getCategoryLabel(category: PlaceCategory) {
  return categoryLabel(category);
}

export function getMapUrl(place: Place) {
  if (place.googleMapsUri) return place.googleMapsUri;
  if (place.source === "google") {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.id)}`;
  }
  return place.elementType
    ? `https://www.openstreetmap.org/${place.elementType}/${place.id.split("-")[1]}`
    : `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=18/${place.lat}/${place.lon}`;
}

export function groupPlacesByDistance(
  places: Place[],
  origin: Pick<GeoPoint, "lat" | "lon">,
): PlaceDistanceGroup[] {
  const groups: PlaceDistanceGroup[] = [
    { id: "within-1-km", title: "الأقرب إليك", places: [] },
    { id: "1-to-3-km", title: "قريبة منك", places: [] },
    { id: "3-to-5-km", title: "أماكن أخرى", places: [] },
    { id: "5-to-10-km", title: "أماكن أبعد", places: [] },
  ];

  for (const place of places) {
    const distance = distanceKm(origin, place);
    if (distance > 10) continue;
    const groupIndex = distance <= 1 ? 0 : distance <= 3 ? 1 : distance <= 5 ? 2 : 3;
    groups[groupIndex]?.places.push({ ...place, distanceKm: distance });
  }

  for (const group of groups) {
    group.places.sort((left, right) => left.distanceKm - right.distanceKm);
  }
  return groups;
}
