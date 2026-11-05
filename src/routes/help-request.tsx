import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle, LocateFixed, MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { locationUsageAllowed } from "@/lib/app-settings";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/help-request")({
  head: () => ({ meta: [{ title: "طلب مساعدة من المندوب – فزعة" }] }),
  component: HelpRequestPage,
});

function HelpRequestPage() {
  const navigate = useNavigate();
  const { addRequest, profile } = useStore();
  const { t } = useTranslation();
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState(profile?.city ?? "");
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const chooseLocation = () => {
    if (!locationUsageAllowed()) {
      toast.error(t("طلب الموقع موقوف من إعدادات الخصوصية."));
      return;
    }
    if (!navigator.geolocation) {
      toast.error(t("الموقع الجغرافي غير مدعوم. اكتب عنوانك يدوياً."));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lon: coords.longitude });
        setLocating(false);
        toast.success(t("تم تحديد موقعك لهذا الطلب."));
      },
      (error) => {
        setLocating(false);
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? t("لم تسمح بالوصول إلى موقعك. يمكنك كتابة العنوان يدوياً.")
            : t("تعذر تحديد موقعك. حاول مرة أخرى أو اكتب العنوان يدوياً."),
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!service.trim()) {
      toast.error(t("اكتب وصف الخدمة المطلوبة."));
      return;
    }
    addRequest({
      type: "service",
      title: "طلب مساعدة من المندوب",
      description: service.trim(),
      notes: notes.trim() || undefined,
      city: address.trim() || profile?.city || "غير محدد",
      deliveryAddress: address.trim() || undefined,
      location: location ?? undefined,
    });
    toast.success(t("تم حفظ طلبك على هذا الجهاز. ربطه بمندوب يتطلب إعداد خدمة الطلبات."));
    navigate({ to: "/orders" });
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-10">
      <header className="flex items-center gap-3 px-4 pt-6">
        <Link
          to="/"
          aria-label={t("العودة للرئيسية")}
          className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-card-soft"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold text-muted-foreground">فزعة</p>
          <h1 className="text-lg font-extrabold text-foreground">{t("طلب مساعدة من المندوب")}</h1>
        </div>
      </header>
      <main className="px-4">
        <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
          <img
            src="/اطلب مساعده فزعة.png"
            alt={t("صورة فزعة لخدمة طلب المساعدة من المندوب")}
            className="h-auto max-h-[34rem] w-full object-contain"
          />
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm font-bold text-foreground">
            {t("وصف الخدمة المطلوبة")}
            <textarea
              required
              value={service}
              onChange={(event) => setService(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t("اكتب ما تحتاج من المندوب بالتفصيل")}
              className="mt-2 w-full resize-y rounded-2xl border border-input bg-card px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-sm font-bold text-foreground">
            {t("العنوان أو المنطقة")}
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={180}
              placeholder={t("المدينة، الحي أو العنوان")}
              className="mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <button
            type="button"
            onClick={chooseLocation}
            disabled={locating}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary disabled:opacity-50"
          >
            {locating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : location ? (
              <MapPin className="h-4 w-4" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            {locating
              ? t("جارٍ تحديد الموقع...")
              : location
                ? t("تم إرفاق الموقع لهذا الطلب")
                : t("إرفاق موقعي بعد الموافقة")}
          </button>
          <label className="block text-sm font-bold text-foreground">
            {t("ملاحظات")}
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t("أي تفاصيل إضافية للمندوب")}
              className="mt-2 w-full resize-y rounded-2xl border border-input bg-card px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
            {t(
              "سيُحفظ الطلب على هذا الجهاز حالياً. لا يتم إرساله إلى مندوب حتى ربط خدمة الطلبات بالخادم.",
            )}
          </p>
          <button
            type="submit"
            className="min-h-12 w-full rounded-full bg-brand-gradient px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-brand"
          >
            {t("إرسال الطلب")}
          </button>
        </form>
      </main>
    </div>
  );
}
