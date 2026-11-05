import { Link } from "@tanstack/react-router";
import {
  Clock3,
  ExternalLink,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PlacePhoto } from "@/components/PlacePhoto";
import { locationUsageAllowed } from "@/lib/app-settings";
import { searchGooglePlaces } from "@/lib/google-places";
import {
  distanceKm,
  findLocation,
  formatDistance,
  getMapUrl,
  groupPlacesByDistance,
  searchPlaces,
  type GeoPoint,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

const categoryPosters: Record<PlaceCategory, string> = {
  restaurants: "/مطعم فزعه.png",
  cafes: "/كافيه فزعة.png",
  pharmacies: "/صيدليات فزعة.png",
};

const categoryLabels: Record<PlaceCategory, string> = {
  restaurants: "المطاعم",
  cafes: "الكافيهات",
  pharmacies: "الصيدليات",
};

const locationKey = "fazaa.places.location.v1";

function readLocation(): GeoPoint | null {
  try {
    const saved = window.localStorage.getItem(locationKey);
    return saved ? (JSON.parse(saved) as GeoPoint) : null;
  } catch {
    return null;
  }
}

export function PlaceDirectory({ category }: { category: PlaceCategory }) {
  const { profile } = useStore();
  const { language, t } = useTranslation();
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [city, setCity] = useState(profile?.city ?? "");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const saveLocation = useCallback((next: GeoPoint) => {
    setLocation(next);
    try {
      window.localStorage.setItem(locationKey, JSON.stringify(next));
    } catch {
      // Keep the selected location for the current visit if storage is unavailable.
    }
  }, []);

  const requestCurrentLocation = useCallback(() => {
    if (!locationUsageAllowed()) {
      setError("طلب الموقع موقوف من إعدادات الخصوصية. يمكنك كتابة المدينة أو تفعيله من الإعدادات.");
      return;
    }
    if (!navigator.geolocation) {
      setError("الموقع الجغرافي غير مدعوم في هذا المتصفح. أدخل المدينة يدوياً.");
      return;
    }

    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        saveLocation({
          lat: coords.latitude,
          lon: coords.longitude,
          label: "__current_location__",
        });
        setLocating(false);
      },
      (cause) => {
        setLocating(false);
        setError(
          cause.code === cause.PERMISSION_DENIED
            ? "لم تسمح بالوصول إلى موقعك. يمكنك كتابة المدينة أو الحي بدلاً من ذلك."
            : "تعذر تحديد موقعك. تحقق من إعدادات الموقع أو أدخل المدينة يدوياً.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, [saveLocation]);

  useEffect(() => {
    const savedLocation = readLocation();
    if (savedLocation) {
      setLocation(savedLocation);
      return;
    }
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  useEffect(() => {
    if (!location) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPlaces([]);
    const search =
      category === "pharmacies"
        ? searchPlaces(category, location, controller.signal)
        : searchGooglePlaces(category, location, controller.signal);
    void search
      .then(setPlaces)
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setPlaces([]);
        setError(cause instanceof Error ? cause.message : "تعذر تحميل الأماكن حالياً.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [category, location]);

  const searchCity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocating(true);
    setError("");
    try {
      saveLocation(await findLocation(city, language));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر البحث عن الموقع.");
    } finally {
      setLocating(false);
    }
  };

  const refreshPlaces = () => {
    if (!location) {
      requestCurrentLocation();
      return;
    }
    setLocation({ ...location });
  };

  const categoryLabel = t(categoryLabels[category]);
  const distanceGroups = location ? groupPlacesByDistance(places, location) : [];
  const sourceName = category === "pharmacies" ? "OpenStreetMap" : "Google Maps";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <header className="px-4 pt-6">
        <Link to="/profile" className="text-xs font-bold text-primary">
          {t("الملف الشخصي")}
        </Link>
        <h1 className="mt-3 text-2xl font-black text-foreground">{categoryLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("الأماكن الحقيقية القريبة منك عبر {{source}}", { source: sourceName })}
        </p>
      </header>

      <main className="px-4">
        <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card-soft">
          <img
            src={categoryPosters[category]}
            alt={t("صورة فزعة لقسم {{category}}", { category: categoryLabel })}
            className="h-auto max-h-[34rem] w-full object-contain"
          />
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted-foreground">
                {t("الموقع للبحث عن الأماكن القريبة")}
              </p>
              <p className="mt-1 truncate text-sm font-extrabold text-foreground">
                {location
                  ? location.label === "__current_location__"
                    ? t("موقعي الحالي")
                    : location.label
                  : t("لم يتم اختيار موقع")}
              </p>
              {location && (
                <p className="mt-1 text-[10px] text-muted-foreground" dir="ltr">
                  {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={requestCurrentLocation}
              disabled={locating}
              aria-label={t("تحديد موقعي الحالي")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary disabled:opacity-50"
            >
              {locating ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <LocateFixed className="h-5 w-5" />
              )}
            </button>
          </div>
          <form onSubmit={searchCity} className="mt-3 flex gap-2">
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              aria-label={t("المدينة أو الحي")}
              placeholder={t("اكتب المدينة أو الحي")}
              className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={locating || !city.trim()}
              aria-label={t("البحث عن المدينة")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-primary-foreground disabled:opacity-50"
            >
              {locating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </form>
        </section>

        <div className="mt-5 flex items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-foreground">{t("أماكن قريبة")}</h2>
          <button
            type="button"
            onClick={refreshPlaces}
            disabled={loading || locating}
            className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {t("تحديث النتائج")}
          </button>
        </div>

        {!location && !error && (
          <p className="mt-3 rounded-2xl border border-dashed border-border bg-card p-5 text-center text-sm leading-6 text-muted-foreground">
            {t("حدّد موقعك أو اكتب اسم المدينة لعرض الأماكن المسجلة حولك.")}
          </p>
        )}
        {loading && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-card p-7 text-sm font-bold text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
            {t("جارٍ جلب الأماكن...")}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-foreground"
          >
            <p>{t(error)}</p>
            <button
              type="button"
              onClick={refreshPlaces}
              disabled={loading || locating}
              className="mt-2 flex items-center gap-2 font-bold text-primary disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> {t("إعادة المحاولة")}
            </button>
          </div>
        )}
        {location && !loading && !error && places.length === 0 && (
          <p className="mt-3 rounded-2xl border border-dashed border-border bg-card p-5 text-center text-sm leading-6 text-muted-foreground">
            {t("لا توجد أماكن ضمن 10 كم من هذا الموقع. جرّب تحديث النتائج أو تغيير موقعك.")}
          </p>
        )}

        <div className="mt-3 space-y-5">
          {distanceGroups.map(
            (group) =>
              group.places.length > 0 && (
                <section key={group.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-foreground">{t(group.title)}</h3>
                    <span className="text-[10px] text-muted-foreground">
                      {t("{{count}} مكان", { count: group.places.length })}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.places.map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        distanceKm={place.distanceKm}
                        language={language}
                      />
                    ))}
                  </div>
                </section>
              ),
          )}
        </div>

        <p className="mt-5 text-center text-[10px] leading-5 text-muted-foreground">
          {category === "pharmacies"
            ? t("بيانات الصيدليات من OpenStreetMap.")
            : t(
                "بيانات الأماكن والصور من Google Maps. أسماء الجهات والتقييمات وساعات العمل تُعرض كما يوردها المصدر.",
              )}{" "}
          <a
            href={
              category === "pharmacies"
                ? "https://www.openstreetmap.org/copyright"
                : "https://maps.google.com"
            }
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            {sourceName}
          </a>
        </p>
      </main>
    </div>
  );
}

function PlaceCard({
  place,
  distanceKm,
  language,
}: {
  place: Place;
  distanceKm: number;
  language: "ar" | "en";
}) {
  const { t } = useTranslation();
  const mapUrl = getMapUrl(place);
  const photo = place.photos?.[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card-soft">
      <PlacePhoto
        photo={photo}
        alt={place.name}
        className="aspect-[16/10] w-full bg-secondary object-cover"
      />
      <Link
        to="/place/$category/$placeId"
        params={{ category: place.category, placeId: place.id }}
        className="block"
      >
        <div className="flex items-start justify-between gap-3 p-3 pb-2">
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-foreground">{place.name}</h4>
            {place.rating !== undefined && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {place.rating.toFixed(1)}
                {place.ratingCount !== undefined && (
                  <span>({new Intl.NumberFormat(language).format(place.ratingCount)})</span>
                )}
              </p>
            )}
          </div>
          <span
            className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
            dir="ltr"
          >
            {formatDistance(distanceKm, language)}
          </span>
        </div>
      </Link>
      <div className="space-y-2 px-3 pb-3 text-xs text-muted-foreground">
        {place.address && (
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>{place.address}</span>
          </p>
        )}
        {place.openingHours?.slice(0, 2).map((hours) => (
          <p key={hours} className="flex items-start gap-1.5">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>{hours}</span>
          </p>
        ))}
        {typeof place.openNow === "boolean" ? (
          <p
            className={
              place.openNow ? "font-semibold text-success" : "font-semibold text-muted-foreground"
            }
          >
            {t(place.openNow ? "مفتوح الآن" : "مغلق الآن")}
          </p>
        ) : place.businessStatus === "CLOSED_TEMPORARILY" ||
          place.businessStatus === "CLOSED_PERMANENTLY" ? (
          <p className="font-semibold text-muted-foreground">{t("مغلق")}</p>
        ) : null}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-bold text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" /> {t("عرض الموقع على الخريطة")}
          </a>
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              dir="ltr"
              className="flex items-center gap-1 font-bold text-accent"
            >
              <Phone className="h-3.5 w-3.5" /> {place.phone}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
