import { Heart, MapPin } from "lucide-react";
import { timeAgo, typeLabel, useStore, type HelpRequest } from "@/lib/store";

const statusStyles: Record<HelpRequest["status"], string> = {
  مفتوح: "bg-primary/10 text-primary",
  "قيد التنفيذ": "bg-accent/10 text-accent",
  مكتمل: "bg-muted text-muted-foreground",
};

export function RequestCard({ request }: { request: HelpRequest }) {
  const { favorites, toggleFavorite } = useStore();
  const fav = favorites.includes(request.id);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
            {request.owner.slice(0, 1)}
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">{request.title}</div>
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {request.description}
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label="مفضلة"
          onClick={() => toggleFavorite(request.id)}
          className="shrink-0 text-muted-foreground transition-colors"
        >
          <Heart className={`h-5 w-5 ${fav ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {request.city} · {timeAgo(request.createdAt)}
        </span>
        <span className={`rounded-full px-2.5 py-1 font-semibold ${statusStyles[request.status]}`}>
          {typeLabel(request.type)} · {request.status}
        </span>
      </div>
      {request.forSomeoneElse && (
        <div className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-[11px] font-bold text-primary">
          مخصص لمستفيد آخر · {request.beneficiaryName || "مستفيد"}
        </div>
      )}
    </div>
  );
}
