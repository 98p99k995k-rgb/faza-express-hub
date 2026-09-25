import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, HandHeart, Search, Store, Users, Gift } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import brandLogo from "@/assets/fazaa-delivery-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "فزعة – مع بعض.. دايماً أقوى" },
      {
        name: "description",
        content: "فزعة: تطبيق سعودي للمساعدات والتوصيل والمفقودات. اطلب مساعدة أو ساعد غيرك.",
      },
      { property: "og:title", content: "فزعة – مع بعض.. دايماً أقوى" },
      {
        property: "og:description",
        content: "اطلب مساعدة عاجلة، توصيل، مفقودات أو خدمات من مجتمعك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { profile } = useStore();

  const serviceCards = [
    {
      title: "المقاهي",
      emoji: "☕",
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
      alt: "صورة مقهى عربي مع قهوة طازجة وأجواء هادئة",
      subtitle: "قهوة وأجواء مريحة",
    },
    {
      title: "المطاعم",
      emoji: "🍽️",
      image:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
      alt: "صورة مطعم بأطباق لذيذة ومشروبات",
      subtitle: "وجبات لذيذة وسريعة",
    },
    {
      title: "الصيدليات",
      emoji: "💊",
      image: "/images/pharmacy-card.svg",
      alt: "رسم توضيحي احترافي لصيدلية حديثة ومجموعة أدوية",
      subtitle: "رعاية صحية ومريحة",
    },
    {
      title: "طلب المساعدة من المندوب",
      emoji: "🤝",
      image: "/images/delivery-help-card.svg",
      alt: "رسم توضيحي احترافي لمستخدم يطلب المساعدة من مندوب",
      subtitle: "مساعدة سريعة ووثيقة",
    },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="flex items-center justify-between px-4 pt-4">
        <button
          type="button"
          aria-label="الإشعارات"
          className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-card-soft"
        >
          <Bell className="h-5 w-5" />
        </button>
        <Logo size="sm" />
      </header>

      <main className="px-4">
        {profile && (
          <p className="mt-4 text-sm text-muted-foreground">
            أهلاً <span className="font-bold text-foreground">{profile.fullName}</span> 👋
          </p>
        )}

        <section className="relative mt-3 overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-card-soft">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-brand-wave opacity-70" />
          <img
            src={brandLogo}
            alt="شعار فزعة: باب وشخص ودباب توصيل سريع"
            className="relative mx-auto h-auto w-full max-w-[330px] object-contain px-5 py-3"
          />
        </section>

        <Link
          to="/create"
          search={{}}
          className="mt-3 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-card-soft"
        >
          <Search className="h-4 w-4" />
          ابحث عن ما تحتاجه...
        </Link>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to="/family"
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-accent shadow-card-soft transition-transform active:scale-95"
          >
            <Users className="h-7 w-7" />
            <span className="text-xs font-bold">العائلة</span>
          </Link>
          <Link
            to="/create"
            search={{ type: "service" }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-primary/10 p-4 text-primary transition-transform active:scale-95"
          >
            <HandHeart className="h-8 w-8" />
            <span className="text-sm font-bold">طلب مساعدة</span>
          </Link>
          <Link
            to="/create"
            search={{ type: "delivery" }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-accent/10 p-4 text-accent transition-transform active:scale-95"
          >
            <Store className="h-7 w-7" />
            <span className="text-xs font-bold">توصيل</span>
          </Link>
          <Link
            to="/create"
            search={{ type: "other" }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-secondary/80 p-4 text-foreground transition-transform active:scale-95"
          >
            <Gift className="h-7 w-7 text-primary" />
            <span className="text-xs font-bold">فزعة لغيرك</span>
          </Link>
        </div>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground">خدمات فزعة</h2>
            <span className="text-[10px] font-bold text-primary">تصفح</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {serviceCards.map((service) => (
              <div
                key={service.title}
                className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-card-soft"
              >
                <div className="overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50">
                  <img
                    src={service.image}
                    alt={service.alt}
                    loading="lazy"
                    className="h-28 w-full object-cover object-center"
                  />
                </div>
                <div className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-foreground">{service.title}</span>
                    <span className="text-base leading-none">{service.emoji}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">{service.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="relative mt-5 overflow-hidden rounded-3xl bg-brand-gradient p-5 text-center text-primary-foreground shadow-brand">
          <span className="absolute inset-y-0 right-0 w-28 bg-speed-lines opacity-30" />
          <p className="text-lg font-extrabold">لأنك لست وحدك..</p>
          <p className="mt-1 text-sm opacity-90">فزعة دايماً معك ♥</p>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
