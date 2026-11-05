import { getSupabaseClient, getSupabaseFunctionConfig } from "@/lib/supabase";
import type { GeoPoint, Place, PlaceCategory, PlacePhoto } from "@/lib/places";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: {
    name?: string;
    authorAttributions?: { displayName?: string; uri?: string; photoUri?: string }[];
  }[];
  regularOpeningHours?: { weekdayDescriptions?: string[]; openNow?: boolean };
  businessStatus?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
};

type GooglePlacesResponse = { places?: GooglePlace[]; error?: string } & GooglePlace;

function normalizeGooglePlace(place: GooglePlace, category: PlaceCategory): Place | null {
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  if (
    !place.id ||
    !place.displayName?.text ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  const photos: PlacePhoto[] = (place.photos ?? []).flatMap((photo) =>
    photo.name
      ? [
          {
            name: photo.name,
            authorAttributions: (photo.authorAttributions ?? []).flatMap((author) =>
              author.displayName
                ? [
                    {
                      displayName: author.displayName,
                      uri: author.uri,
                      photoUri: author.photoUri,
                    },
                  ]
                : [],
            ),
          },
        ]
      : [],
  );
  return {
    id: place.id,
    source: "google",
    name: place.displayName.text,
    category,
    lat: latitude as number,
    lon: longitude as number,
    address: place.formattedAddress,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    openingHours: place.regularOpeningHours?.weekdayDescriptions,
    rating: place.rating,
    ratingCount: place.userRatingCount,
    photos,
    businessStatus: place.businessStatus,
    openNow: place.regularOpeningHours?.openNow,
    googleMapsUri: place.googleMapsUri,
  };
}

function getPlacesFunction() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("خدمة الأماكن غير مهيأة. يلزم إعداد Supabase ومفتاح Google على الخادم.");
  }
  return client;
}

export async function searchGooglePlaces(
  category: Extract<PlaceCategory, "restaurants" | "cafes">,
  point: GeoPoint,
  signal?: AbortSignal,
): Promise<Place[]> {
  const client = getPlacesFunction();
  const { data, error } = await client.functions.invoke<GooglePlacesResponse>("places", {
    body: {
      action: "search",
      category,
      latitude: point.lat,
      longitude: point.lon,
    },
    signal,
  });
  if (error) {
    if (signal?.aborted) throw error;
    throw new Error("تعذر الاتصال بخدمة الأماكن. تحقق من إعداد Google Places والإنترنت.");
  }
  if (data?.error) throw new Error(data.error);
  return (data?.places ?? [])
    .map((place) => normalizeGooglePlace(place, category))
    .filter((place): place is Place => place !== null);
}

export async function getGooglePlace(
  placeId: string,
  category: Extract<PlaceCategory, "restaurants" | "cafes">,
  signal?: AbortSignal,
): Promise<Place | null> {
  const client = getPlacesFunction();
  const { data, error } = await client.functions.invoke<GooglePlacesResponse>("places", {
    body: { action: "details", placeId },
    signal,
  });
  if (error) {
    if (signal?.aborted) throw error;
    throw new Error("تعذر جلب تفاصيل المكان من Google Places.");
  }
  if (data?.error) throw new Error(data.error);
  return normalizeGooglePlace(data ?? {}, category);
}

export async function fetchGooglePlacePhoto(photoName: string, signal?: AbortSignal) {
  getPlacesFunction();
  const config = getSupabaseFunctionConfig();
  if (!config) throw new Error("خدمة الأماكن غير مهيأة.");
  const photoUrl = new URL(`${config.url}/functions/v1/places`);
  photoUrl.searchParams.set("action", "photo");
  photoUrl.searchParams.set("name", photoName);
  const response = await fetch(photoUrl, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
    signal,
  });
  if (!response.ok) throw new Error("تعذر تحميل صورة المكان.");
  return URL.createObjectURL(await response.blob());
}
