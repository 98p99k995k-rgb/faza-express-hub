import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Globe2,
  LoaderCircle,
  MapPin,
  Phone,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PlacePhoto } from "@/components/PlacePhoto";
import { getGooglePlace } from "@/lib/google-places";
import {
  getCategoryLabel,
  getMapUrl,
  getPlace,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import { useTranslation } from "@/lib/useTranslation";

const categories = ["restaurants", "cafes", "pharmacies"] as const;

export const Route = createFileRoute("/place/$category/$placeId")({
  head: () => ({ meta: [{ title: "تفاصيل المكان – فزعة" }] }),
  component: PlaceDetailsPage,
});

function PlaceDetailsPage() {
  const { t } = useTranslation();
  const { category: categoryParam, placeId } = Route.useParams();
  const category = categories.includes(categoryParam as PlaceCategory)
    ? (categoryParam as PlaceCategory)
    : null;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!category) {
      setLoading(false);
      setError("هذا القسم غير معروف.");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const request =
      category === "pharmacies"
        ? getPlace(placeId, category, controller.signal)
        : getGooglePlace(placeId, category, controller.signal);
    void request
      .then((result) => {
        if (!result) setError("لم يعد هذا المكان متاحاً في مصدر البيانات.");
        setPlace(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "تعذر تحميل بيانات المكان.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [category, placeId, t]);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <header className="flex items-center gap-3 px-4 pt-6">
        <Link
          to={
            category === "cafes"
              ? "/cafes"
              : category === "pharmacies"
                ? "/pharmacies"
                : "/restaurants"
          }
          aria-label={t("العودة إلى قائمة الأماكن")}
          className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-card-soft"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold text-muted-foreground">
            {category ? t(getCategoryLabel(category)) : t("الأماكن")}
          </p>
          <h1 className="text-lg font-extrabold text-foreground">{t("تفاصيل المكان")}</h1>
        </div>
      </header>

      <main className="px-4">
        {loading && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-card p-8 text-sm font-bold text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />{" "}
            {t("جارٍ تحميل البيانات...")}
          </div>
        )}
        {error && !loading && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center text-sm leading-6 text-foreground"
          >
            {t(error)}
          </div>
        )}
        {place && !loading && (
          <>
            <section className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-card-soft">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-accent">
                <Store className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-black text-foreground">{place.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(getCategoryLabel(place.category))}
              </p>
              <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                {place.source === "google" && (
                  <PlacePhoto
                    photo={place.photos?.[0]}
                    alt={place.name}
                    className="max-h-80 w-full rounded-xl object-cover"
                  />
                )}
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {place.address || t("العنوان التفصيلي غير متوفر في المصدر")}
                </p>
                {place.openingHours?.map((hours) => (
                  <p key={hours} className="flex items-start gap-2 text-muted-foreground">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {hours}
                  </p>
                ))}
                {typeof place.openNow === "boolean" ? (
                  <p className="font-semibold text-foreground">
                    {t(place.openNow ? "مفتوح الآن" : "مغلق الآن")}
                  </p>
                ) : place.businessStatus === "CLOSED_TEMPORARILY" ||
                  place.businessStatus === "CLOSED_PERMANENTLY" ? (
                  <p className="font-semibold text-muted-foreground">{t("مغلق")}</p>
                ) : null}
                {place.phone && (
                  <a
                    href={`tel:${place.phone}`}
                    dir="ltr"
                    className="flex items-center gap-2 text-accent"
                  >
                    <Phone className="h-4 w-4" />
                    {place.phone}
                  </a>
                )}
                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 break-all text-accent"
                  >
                    <Globe2 className="h-4 w-4 shrink-0" />
                    {t("الموقع الإلكتروني")}
                  </a>
                )}
                {typeof place.rating === "number" && (
                  <p>
                    {t("التقييم")}: {place.rating.toFixed(1)}
                    {place.ratingCount !== undefined &&
                      ` (${new Intl.NumberFormat(language).format(place.ratingCount)})`}
                  </p>
                )}
              </div>
              <a
                href={getMapUrl(place)}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-brand"
              >
                <MapPin className="h-4 w-4" /> {t("عرض الموقع على الخريطة")}{" "}
                <ExternalLink className="h-4 w-4" />
              </a>
            </section>

            <section className="mt-4 rounded-2xl border border-dashed border-border bg-card p-5">
              <h3 className="text-sm font-extrabold text-foreground">{t("المنتجات والقوائم")}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {t(
                  "لا يوفر مصدر الأماكن قائمة وجبات أو منتجات أو أسعاراً لهذا المكان. لن نعرض عناصر غير موثقة. يمكن إضافة هذا القسم عند توفر واجهة رسمية من الجهة أو تكامل معتمد.",
                )}
              </p>
            </section>
            <p className="mt-4 text-center text-[10px] leading-5 text-muted-foreground">
              {place.source === "google"
                ? t("بيانات المكان والصور من Google Maps. تُعرض الصور مع نسب مؤلفها عند توفره.")
                : t("بيانات المكان من OpenStreetMap، وهي قابلة للتحديث من مساهمي المصدر.")}
            </p>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
