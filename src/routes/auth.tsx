import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول – فزعة" },
      { name: "description", content: "سجّل دخولك إلى فزعة بالاسم ورقم الجوال." },
      { property: "og:title", content: "تسجيل الدخول – فزعة" },
      { property: "og:description", content: "سجّل دخولك إلى فزعة بالاسم ورقم الجوال." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { saveProfile } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const submit = () => {
    if (!fullName.trim() || !phone.trim()) {
      toast.error(t("فضلاً أدخل الاسم ورقم الجوال"));
      return;
    }
    if (!/^0?5\d{8}$/.test(phone.replace(/\s/g, ""))) {
      toast.error(t("رقم الجوال غير صحيح — مثال: 05XXXXXXXX"));
      return;
    }
    saveProfile({ fullName: fullName.trim(), phone: phone.trim(), city: city.trim() });
    toast.success(t("أهلاً بك في فزعة يا {{name}}!", { name: fullName.trim() }));
    navigate({ to: "/" });
  };

  return (
    <div className="brand-screen mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 pb-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <Logo size="lg" />
        <p className="mt-1 text-sm font-bold text-primary">{t("توصيل جدة بسرعة وأمان")}</p>

        <div className="mt-8 w-full space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-foreground">
              {t("الاسم الكامل")}
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("مثال: أميرة محمد")}
              className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-foreground">
              {t("رقم الجوال")}
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              inputMode="tel"
              dir="ltr"
              className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-foreground">
              {t("المدينة (اختياري)")}
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("جدة")}
              className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            className="w-full rounded-full bg-brand-gradient py-4 text-base font-extrabold text-primary-foreground shadow-brand transition-transform active:scale-[0.98]"
          >
            {t("دخول")}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("بدخولك أنت توافق على شروط الاستخدام وسياسة الخصوصية.")}
          </p>
        </div>
      </div>
    </div>
  );
}
