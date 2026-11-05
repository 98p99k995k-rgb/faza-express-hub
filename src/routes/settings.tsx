import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, Eye, Languages, Moon, Save, Sun, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import {
  defaultSettings,
  loadAppSettings,
  settingsKey,
  type AppSettings,
} from "@/lib/app-settings";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات – فزعة" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { setLanguage, setTheme } = useStore();
  const { t } = useTranslation();
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    setSettings(loadAppSettings());
  }, []);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      window.localStorage.setItem(settingsKey, JSON.stringify(settings));
      setLanguage(settings.language);
      setTheme(settings.theme);
      toast.success(t("تم حفظ إعداداتك على هذا الجهاز."));
    } catch {
      toast.error(t("تعذر حفظ الإعدادات. تحقق من مساحة التخزين في المتصفح."));
    }
  };

  const toggle = (key: "orderNotifications" | "offerNotifications" | "locationPrivacy") => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const chooseLanguage = (language: AppSettings["language"]) => {
    setSettings((current) => ({ ...current, language }));
    setLanguage(language);
  };

  const chooseTheme = (theme: AppSettings["theme"]) => {
    setSettings((current) => ({ ...current, theme }));
    setTheme(theme);
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
          <h1 className="text-xl font-extrabold text-foreground">{t("الإعدادات")}</h1>
        </div>
      </header>
      <main className="px-4">
        <Link
          to="/edit-profile"
          className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex items-center gap-3 text-sm font-bold text-foreground">
            <UserRound className="h-5 w-5 text-accent" /> {t("إعدادات الحساب وبياناتك")}
          </span>
          <ArrowRight className="h-4 w-4 rotate-180 text-muted-foreground" />
        </Link>
        <form onSubmit={save} className="mt-4 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Bell className="h-4 w-4 text-accent" /> {t("الإشعارات")}
            </h2>
            <SettingToggle
              label={t("تحديثات الطلبات")}
              checked={settings.orderNotifications}
              onChange={() => toggle("orderNotifications")}
            />
            <SettingToggle
              label={t("العروض والتنبيهات العامة")}
              checked={settings.offerNotifications}
              onChange={() => toggle("offerNotifications")}
            />
            <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
              {t(
                "حفظ التفضيلات متاح محلياً. إرسال إشعارات فعلية يحتاج خدمة إشعارات وربطاً بالخادم.",
              )}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Languages className="h-4 w-4 text-accent" /> {t("اللغة")}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-secondary/60 p-1">
              {(
                [
                  ["ar", t("العربية")],
                  ["en", "English"],
                ] as const
              ).map(([language, label]) => (
                <button
                  key={language}
                  type="button"
                  aria-pressed={settings.language === language}
                  onClick={() => chooseLanguage(language)}
                  className={`min-h-10 rounded-lg px-3 text-sm font-bold transition-colors ${
                    settings.language === language
                      ? "bg-card text-primary shadow-card-soft"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {t("يُحفظ اختيار اللغة ويُطبّق اتجاه الصفحة المناسب.")}
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Sun className="h-4 w-4 text-accent" /> {t("المظهر")}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-secondary/60 p-1">
              {(
                [
                  ["light", t("فاتح"), Sun],
                  ["dark", t("داكن"), Moon],
                ] as const
              ).map(([theme, label, Icon]) => (
                <button
                  key={theme}
                  type="button"
                  aria-pressed={settings.theme === theme}
                  onClick={() => chooseTheme(theme)}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${
                    settings.theme === theme
                      ? "bg-card text-primary shadow-card-soft"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
              <Eye className="h-4 w-4 text-accent" /> {t("الخصوصية")}
            </h2>
            <SettingToggle
              label={t("السماح بطلب إذن الموقع من الجهاز")}
              checked={settings.locationPrivacy}
              onChange={() => toggle("locationPrivacy")}
            />
            <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
              {t(
                "يظهر طلب المتصفح عند الضغط على زر تحديد الموقع. أوقف هذا الخيار لمنع صفحات التطبيق من طلب موقعك.",
              )}
            </p>
          </section>

          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-brand"
          >
            <Save className="h-4 w-4" /> {t("حفظ التغييرات")}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 text-sm text-foreground">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 accent-[var(--primary)]"
      />
    </label>
  );
}
