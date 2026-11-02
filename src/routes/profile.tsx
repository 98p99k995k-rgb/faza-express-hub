import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ClipboardList,
  Heart,
  Info,
  LogOut,
  Settings,
  CircleHelp,
  Users,
  WalletCards,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي – فزعة" },
      { name: "description", content: "حسابك وطلباتك ومفضلاتك في فزعة." },
      { property: "og:title", content: "الملف الشخصي – فزعة" },
      { property: "og:description", content: "حسابك وطلباتك ومفضلاتك في فزعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, requests, favorites, signOut, hydrated } = useStore();
  const navigate = useNavigate();
  const myRequests = requests.filter((r) => r.mine);

  if (hydrated && !profile) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-background px-6 pb-24 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-3xl font-extrabold text-accent">
          ؟
        </div>
        <h1 className="text-lg font-extrabold text-foreground">لم تسجّل دخولك بعد</h1>
        <p className="text-sm text-muted-foreground">
          سجّل دخولك لتتمكن من إنشاء الطلبات ومتابعتها وحفظ مفضلاتك.
        </p>
        <Link
          to="/auth"
          className="w-full rounded-full bg-brand-gradient py-3.5 text-sm font-extrabold text-primary-foreground shadow-brand"
        >
          تسجيل الدخول
        </Link>
        <BottomNav />
      </div>
    );
  }

  const menu = [
    { icon: ClipboardList, label: "طلباتي", badge: myRequests.length, to: "/orders" as const },
    { icon: Heart, label: "مفضلاتي", badge: favorites.length, to: "/orders" as const },
    { icon: Users, label: "العائلة", to: "/family" as const },
    { icon: WalletCards, label: "طرق الدفع", to: "/payment-methods" as const },
    { icon: Settings, label: "الإعدادات" },
    { icon: CircleHelp, label: "المساعدة والدعم" },
    { icon: Info, label: "عن فزعة" },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="flex flex-col items-center pt-10">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-gradient text-3xl font-extrabold text-primary-foreground shadow-brand">
          {profile?.fullName.slice(0, 1) || "ف"}
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-foreground">{profile?.fullName}</h1>
        <p className="mt-1 flex items-center gap-1 text-xs text-primary">
          <Heart className="h-3 w-3 fill-primary" /> دايماً معك
        </p>
      </header>

      <main className="mt-6 space-y-1 px-4">
        {menu.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => item.to && navigate({ to: item.to })}
            className="flex w-full items-center justify-between rounded-2xl px-3 py-3.5 transition-colors hover:bg-card"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            <span className="flex flex-1 items-center justify-end gap-2 text-sm font-bold text-foreground">
              {item.badge !== undefined && item.badge > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  {item.badge}
                </span>
              )}
              {item.label}
              <item.icon className="h-5 w-5 text-accent" />
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            signOut();
            navigate({ to: "/" });
          }}
          className="flex w-full items-center justify-end gap-2 rounded-2xl px-3 py-3.5 text-sm font-bold text-primary transition-colors hover:bg-card"
        >
          تسجيل الخروج
          <LogOut className="h-5 w-5" />
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
