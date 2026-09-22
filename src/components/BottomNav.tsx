import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, Home, MessageCircle, Plus, User } from "lucide-react";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/orders", label: "الطلبات", icon: ClipboardList },
  { to: "/create", label: "", icon: Plus, center: true },
  { to: "/chats", label: "المحادثات", icon: MessageCircle },
  { to: "/profile", label: "الملف الشخصي", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pt-1">
        {items.map((item) => {
          const active = pathname === item.to;
          if ("center" in item && item.center) {
            return (
              <Link
                key={item.to}
                to={item.to}
                search={{}}
                aria-label="إنشاء طلب"
                className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-primary-foreground shadow-brand transition-transform active:scale-95"
              >
                <Plus className="h-7 w-7" />
              </Link>
            );
          }
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-semibold transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
