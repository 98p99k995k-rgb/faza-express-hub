import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Car, ChevronRight, Ellipsis, Search, Siren, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useStore, type RequestType } from "@/lib/store";

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): { type?: RequestType | undefined } => ({
    type: (search["type"] as RequestType | undefined) ?? undefined,
  }),
  head: () => ({
    meta: [
      { title: "إنشاء طلب – فزعة" },
      { name: "description", content: "أنشئ طلب مساعدة جديد في فزعة خلال دقيقة." },
      { property: "og:title", content: "إنشاء طلب – فزعة" },
      { property: "og:description", content: "أنشئ طلب مساعدة جديد في فزعة خلال دقيقة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatePage,
});

const typeOptions: { id: RequestType; label: string; icon: typeof Siren }[] = [
  { id: "urgent", label: "مساعدة عاجلة", icon: Siren },
  { id: "delivery", label: "توصيل", icon: Car },
  { id: "lost", label: "مفقودات", icon: Search },
  { id: "service", label: "خدمات", icon: Wrench },
  { id: "other", label: "أخرى", icon: Ellipsis },
];

function CreatePage() {
  const { type: initialType } = Route.useSearch();
  const navigate = useNavigate();
  const { addRequest, profile } = useStore();

  const [step, setStep] = useState(initialType ? 2 : 1);
  const [type, setType] = useState<RequestType | null>(initialType ?? null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(profile?.city ?? "");

  const submit = () => {
    if (!type || !title.trim() || !description.trim() || !city.trim()) {
      toast.error("فضلاً أكمل جميع الحقول");
      return;
    }
    addRequest({ type, title: title.trim(), description: description.trim(), city: city.trim() });
    toast.success("تم نشر طلبك بنجاح");
    navigate({ to: "/orders" });
  };

  return (
    <div className="brand-screen mx-auto min-h-screen max-w-md bg-background pb-10">
      <header className="flex items-center justify-between px-4 pt-6">
        <button
          type="button"
          aria-label="رجوع"
          onClick={() => (step === 2 ? setStep(1) : navigate({ to: "/" }))}
          className="grid h-10 w-10 place-items-center rounded-full text-foreground"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-extrabold text-foreground">إنشاء طلب</h1>
        <span className="w-10" />
      </header>

      <main className="px-4">
        {step === 1 && (
          <>
            <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl bg-secondary/60 p-6">
              <Logo size="md" />
              <p className="text-sm font-bold text-secondary-foreground">اختر نوع الطلب</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setType(opt.id);
                    setStep(2);
                  }}
                  className={`flex flex-col items-center gap-2 rounded-3xl border p-5 transition-all active:scale-95 ${
                    opt.id === "other"
                      ? "col-span-2 border-border bg-secondary/40 text-secondary-foreground"
                      : "border-border bg-card text-foreground shadow-card-soft"
                  }`}
                >
                  <opt.icon className={`h-7 w-7 ${opt.id === "urgent" ? "text-primary" : "text-accent"}`} />
                  <span className="text-sm font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-foreground">عنوان الطلب</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: أحتاج توصيل دواء"
                className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-foreground">التفاصيل</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح ما تحتاجه بالتفصيل..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-foreground">المدينة</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="جدة"
                className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={submit}
              className="w-full rounded-full bg-brand-gradient py-4 text-base font-extrabold text-primary-foreground shadow-brand transition-transform active:scale-[0.98]"
            >
              نشر الطلب
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
