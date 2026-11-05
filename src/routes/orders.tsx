import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { RequestCard } from "@/components/RequestCard";
import { REQUEST_TYPES, useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات – فزعة" },
      { name: "description", content: "تصفح جميع طلبات المساعدة في فزعة وقدّم يد العون." },
      { property: "og:title", content: "الطلبات – فزعة" },
      { property: "og:description", content: "تصفح جميع طلبات المساعدة في فزعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { requests } = useStore();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.type === filter)),
    [requests, filter],
  );

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="px-4 pt-6">
        <h1 className="text-center text-lg font-extrabold text-foreground">{t("الطلبات")}</h1>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {[{ id: "all", label: "الكل" }, ...REQUEST_TYPES].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                filter === item.id
                  ? "bg-brand-gradient text-primary-foreground shadow-brand"
                  : "bg-card text-muted-foreground shadow-card-soft"
              }`}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </header>

      <main className="mt-4 space-y-3 px-4">
        {filtered.length === 0 && (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card-soft">
            {t("لا توجد طلبات في هذا التصنيف حالياً.")}
          </p>
        )}
        {filtered.map((r) => (
          <RequestCard key={r.id} request={r} />
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
