import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/chat/$chatId")({
  head: () => ({
    meta: [
      { title: "محادثة – فزعة" },
      { name: "description", content: "محادثة مباشرة داخل فزعة." },
      { property: "og:title", content: "محادثة – فزعة" },
      { property: "og:description", content: "محادثة مباشرة داخل فزعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const { chats, sendMessage } = useStore();
  const { t } = useTranslation();
  const chat = chats.find((c) => c.id === chatId);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length]);

  if (!chat) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 bg-background px-4">
        <p className="text-sm text-muted-foreground">{t("هذه المحادثة غير موجودة.")}</p>
        <button
          type="button"
          onClick={() => navigate({ to: "/chats" })}
          className="rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
        >
          {t("العودة للمحادثات")}
        </button>
      </div>
    );
  }

  const send = () => {
    if (!text.trim()) return;
    sendMessage(chat.id, text);
    setText("");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          aria-label={t("رجوع")}
          onClick={() => navigate({ to: "/chats" })}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-bold text-secondary-foreground">
          {chat.name.slice(0, 1)}
        </div>
        <span className="text-sm font-extrabold text-foreground">{chat.name}</span>
      </header>

      <main className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {chat.messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                m.from === "me"
                  ? "rounded-bl-sm bg-brand-gradient text-primary-foreground"
                  : "rounded-br-sm bg-card text-foreground shadow-card-soft"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </main>

      <footer className="flex items-center gap-2 border-t border-border bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("اكتب رسالتك...")}
          className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          aria-label={t("إرسال")}
          onClick={send}
          className="grid h-11 w-11 place-items-center rounded-full bg-brand-gradient text-primary-foreground shadow-brand transition-transform active:scale-95"
        >
          <Send className="h-5 w-5 -scale-x-100" />
        </button>
      </footer>
    </div>
  );
}
