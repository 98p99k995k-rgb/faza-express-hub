import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, HandHeart, Newspaper, Search, Siren, Store, Users } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { RequestCard } from "@/components/RequestCard";
import { useStore } from "@/lib/store";
import brandLogo from "@/assets/fazaa-delivery-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "فزعة – مع بعض.. دايماً أقوى" },
      { name: "description", content: "فزعة: تطبيق سعودي للمساعدات والتوصيل والمفقودات. اطلب مساعدة أو ساعد غيرك." },
      { property: "og:title", content: "فزعة – مع بعض.. دايماً أقوى" },
      { property: "og:description", content: "اطلب مساعدة عاجلة، توصيل، مفقودات أو خدمات من مجتمعك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { requests, profile } = useStore();
  const latest = requests.slice(0, 5);

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

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Link
            to="/orders"
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-accent shadow-card-soft transition-transform active:scale-95"
          >
            <Store className="h-7 w-7" />
            <span className="text-xs font-bold">متاجر جدة</span>
          </Link>
          <Link
            to="/create"
            search={{ type: "urgent" }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-primary/10 p-4 text-primary transition-transform active:scale-95"
          >
            <Siren className="h-8 w-8" />
            <span className="text-sm font-bold">مساعدة عاجلة</span>
          </Link>
          <Link
            to="/create"
            search={{ type: "service" }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-accent/10 p-4 text-accent transition-transform active:scale-95"
          >
            <HandHeart className="h-8 w-8" />
            <span className="text-sm font-bold">طلب مساعدة</span>
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-3">
          {[
            { icon: Newspaper, label: "أخبار" },
            { icon: Search, label: "مفقودات" },
            { icon: Users, label: "تطوع" },
            { icon: Newspaper, label: "أخبار" },
          ].map((item, i) => (
            <Link
              key={i}
              to="/orders"
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 shadow-card-soft transition-transform active:scale-95"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold text-foreground">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="relative mt-5 overflow-hidden rounded-3xl bg-brand-gradient p-5 text-center text-primary-foreground shadow-brand">
          <span className="absolute inset-y-0 right-0 w-28 bg-speed-lines opacity-30" />
          <p className="text-lg font-extrabold">لأنك لست وحدك..</p>
          <p className="mt-1 text-sm opacity-90">فزعة دايماً معك ♥</p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground">أحدث الطلبات</h2>
          <Link to="/orders" className="text-xs font-bold text-primary">
            عرض الكل
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {latest.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
