import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/edit-profile")({
  head: () => ({ meta: [{ title: "البيانات الشخصية – فزعة" }] }),
  component: EditProfilePage,
});

function EditProfilePage() {
  const { profile, saveProfile } = useStore();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [city, setCity] = useState(profile?.city ?? "");

  useEffect(() => {
    setFullName(profile?.fullName ?? "");
    setPhone(profile?.phone ?? "");
    setCity(profile?.city ?? "");
  }, [profile]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = phone.replace(/\s/g, "");
    if (!fullName.trim()) {
      toast.error(t("أدخل الاسم الكامل."));
      return;
    }
    if (!/^0?5\d{8}$/.test(normalizedPhone)) {
      toast.error(t("أدخل رقم جوال سعودي صحيحاً."));
      return;
    }
    saveProfile({ fullName: fullName.trim(), phone: normalizedPhone, city: city.trim() });
    toast.success(t("تم حفظ بياناتك على هذا الجهاز."));
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <header className="flex items-center gap-3 px-4 pt-6">
        <Link
          to="/profile"
          aria-label={t("العودة إلى الملف الشخصي")}
          className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-card-soft"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold text-muted-foreground">{t("حسابك")}</p>
          <h1 className="text-xl font-extrabold text-foreground">{t("البيانات الشخصية")}</h1>
        </div>
      </header>
      <form onSubmit={submit} className="mt-5 space-y-4 px-4">
        <label className="block text-sm font-bold text-foreground">
          {t("الاسم الكامل")}
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            className="mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block text-sm font-bold text-foreground">
          {t("رقم الهاتف")}
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3 text-left text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block text-sm font-bold text-foreground">
          {t("المدينة والعنوان عند الحاجة")}
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            autoComplete="address-level2"
            className="mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
          {t(
            "تُحفظ البيانات محلياً في هذا المتصفح. مزامنتها بين الأجهزة تحتاج إلى إعداد المصادقة وقاعدة البيانات.",
          )}
        </p>
        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-brand"
        >
          <Save className="h-4 w-4" /> {t("حفظ البيانات")}
        </button>
      </form>
      <BottomNav />
    </div>
  );
}
