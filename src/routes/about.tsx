import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, HeartHandshake, Target } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "عن فزعة" }] }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();
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
        <h1 className="text-xl font-extrabold text-foreground">{t("عن فزعة")}</h1>
      </header>
      <main className="px-4">
        <section className="mt-5 flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-6 text-center shadow-card-soft">
          <Logo size="md" />
          <p className="text-sm leading-7 text-muted-foreground">
            {t("فزعة تطبيقك الذكي لطلب الخدمات والتوصيل بكل سهولة وراحة.")}
          </p>
          <p className="text-sm leading-7 text-foreground">
            {t(
              "نسعى في فزعة إلى توفير تجربة مميزة تجمع لك احتياجاتك في مكان واحد، من المطاعم والكافيهات والصيدليات إلى خدمات التوصيل وطلب المساعدة من المندوب.",
            )}
          </p>
        </section>
        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Eye className="h-5 w-5 text-accent" /> {t("رؤيتنا")}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t("أن نكون خيارك الأول للحصول على الخدمات اليومية بسهولة وسرعة وموثوقية.")}
          </p>
        </section>
        <section className="mt-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Target className="h-5 w-5 text-accent" /> {t("رسالتنا")}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t("تسهيل حياة العملاء وتوفير تجربة استخدام مريحة من خلال خدمات متنوعة وتقنيات حديثة.")}
          </p>
        </section>
        <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 py-4 text-center text-base font-extrabold text-primary-foreground">
          <HeartHandshake className="h-5 w-5" /> {t("فزعة.. نوصلك للي تحتاجه.")}
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
