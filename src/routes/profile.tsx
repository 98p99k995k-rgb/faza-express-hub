import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ClipboardList,
  ContactRound,
  Info,
  LogOut,
  Settings,
  CircleHelp,
  Users,
  WalletCards,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي – فزعة" },
      { name: "description", content: "بيانات حسابك وخدماتك في فزعة." },
      { property: "og:title", content: "الملف الشخصي – فزعة" },
      { property: "og:description", content: "بيانات حسابك وخدماتك في فزعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, requests, signOut, hydrated } = useStore();
  const { language, t } = useTranslation();
  const navigate = useNavigate();
  const myRequests = requests.filter((r) => r.mine);

  if (hydrated && !profile) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-background px-6 pb-24 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-3xl font-extrabold text-accent">
          ؟
        </div>
        <h1 className="text-lg font-extrabold text-foreground">{t("لم تسجّل دخولك بعد")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("سجّل دخولك لتتمكن من إنشاء الطلبات ومتابعتها.")}
        </p>
        <Link
          to="/auth"
          className="w-full rounded-full bg-brand-gradient py-3.5 text-sm font-extrabold text-primary-foreground shadow-brand"
        >
          {t("تسجيل الدخول")}
        </Link>
        <BottomNav />
      </div>
    );
  }

  const menu = [
    { icon: ContactRound, label: t("البيانات الشخصية"), to: "/edit-profile" as const },
    { icon: ClipboardList, label: t("طلباتي"), badge: myRequests.length, to: "/orders" as const },
    { icon: Users, label: t("العائلة"), to: "/family" as const },
    { icon: WalletCards, label: t("طرق الدفع"), to: "/payment-methods" as const },
    { icon: Settings, label: t("الإعدادات"), to: "/settings" as const },
    { icon: CircleHelp, label: t("المساعدة والدعم"), to: "/support" as const },
    { icon: Info, label: t("عن فزعة"), to: "/about" as const },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="flex flex-col items-center pt-10">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-gradient text-3xl font-extrabold text-primary-foreground shadow-brand">
          {profile?.fullName.slice(0, 1) || (language === "ar" ? "ف" : "F")}
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-foreground">{profile?.fullName}</h1>
        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
          {profile?.phone}
        </p>
        {profile?.city && <p className="mt-1 text-xs text-muted-foreground">{profile.city}</p>}
      </header>

      <main className="mt-6 space-y-1 px-4">
        {menu.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate({ to: item.to })}
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
          {t("تسجيل الخروج")}
          <LogOut className="h-5 w-5" />
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
