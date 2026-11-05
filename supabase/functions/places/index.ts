const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Type",
};

const placesBaseUrl = "https://places.googleapis.com/v1";
const searchFieldMask = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.photos",
  "places.regularOpeningHours",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.attributions",
].join(",");
const detailFieldMask = [
  "id",
  "displayName",
  "location",
  "formattedAddress",
  "rating",
  "userRatingCount",
  "photos",
  "regularOpeningHours",
  "businessStatus",
  "googleMapsUri",
  "websiteUri",
  "nationalPhoneNumber",
  "attributions",
].join(",");

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

function isPlaceId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{5,200}$/.test(value);
}

function isPhotoName(value: string | null): value is string {
  return Boolean(value && /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_/-]+$/.test(value));
}

async function googleJson(url: string, apiKey: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      "X-Goog-Api-Key": apiKey,
      Accept: "application/json",
      ...init?.headers,
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey)
    return json({ error: "خدمة الأماكن غير مهيأة. يلزم إعداد مفتاح Google على الخادم." }, 503);

  if (request.method === "GET") {
    const url = new URL(request.url);
    if (url.searchParams.get("action") !== "photo") return json({ error: "الطلب غير صحيح." }, 400);
    const photoName = url.searchParams.get("name");
    if (!isPhotoName(photoName)) return json({ error: "مرجع الصورة غير صالح." }, 400);

    const photoUrl = new URL(`${placesBaseUrl}/${photoName}/media`);
    photoUrl.searchParams.set("maxHeightPx", "800");
    photoUrl.searchParams.set("maxWidthPx", "800");
    photoUrl.searchParams.set("key", apiKey);
    const response = await fetch(photoUrl, {
      redirect: "follow",
    });
    if (!response.ok) {
      console.error("Google Places photo request failed:", response.status);
      return json({ error: "تعذر تحميل صورة المكان من Google Places." }, 502);
    }
    const contentType = response.headers.get("Content-Type") ?? "";
    if (!contentType.startsWith("image/"))
      return json({ error: "مصدر الصورة لم يُرجع صورة صالحة." }, 502);
    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (request.method !== "POST") return json({ error: "الطريقة غير مدعومة." }, 405);

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "تعذر قراءة الطلب." }, 400);
  }

  if (payload.action === "search") {
    const category = payload.category;
    const latitude = payload.latitude;
    const longitude = payload.longitude;
    if (category !== "restaurants" && category !== "cafes") {
      return json({ error: "قسم البحث غير مدعوم." }, 400);
    }
    if (
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return json({ error: "إحداثيات خط العرض غير صالحة." }, 400);
    }
    if (
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return json({ error: "إحداثيات خط الطول غير صالحة." }, 400);
    }

    const response = await googleJson(`${placesBaseUrl}/places:searchNearby`, apiKey, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": searchFieldMask,
      },
      body: JSON.stringify({
        includedTypes: [category === "restaurants" ? "restaurant" : "cafe"],
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: 10000,
          },
        },
      }),
    });
    if (!response.ok) {
      console.error("Google Places nearby search failed:", response.status);
      return json(
        { error: "تعذر جلب الأماكن من Google Places. تحقق من المفتاح والفوترة والصلاحيات." },
        502,
      );
    }
    return new Response(await response.text(), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  if (payload.action === "details") {
    if (!isPlaceId(payload.placeId)) return json({ error: "معرف المكان غير صالح." }, 400);
    const detailUrl = new URL(`${placesBaseUrl}/places/${encodeURIComponent(payload.placeId)}`);
    const response = await googleJson(detailUrl.toString(), apiKey, {
      headers: { "X-Goog-FieldMask": detailFieldMask },
    });
    if (!response.ok) {
      console.error("Google Places details request failed:", response.status);
      return json({ error: "تعذر جلب تفاصيل المكان من Google Places." }, 502);
    }
    return new Response(await response.text(), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  return json({ error: "العملية المطلوبة غير مدعومة." }, 400);
});
