import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { timeAgo, useStore } from "@/lib/store";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "المحادثات – فزعة" },
      { name: "description", content: "محادثاتك مع المساعدين وأصحاب الطلبات في فزعة." },
      { property: "og:title", content: "المحادثات – فزعة" },
      { property: "og:description", content: "محادثاتك مع المساعدين وأصحاب الطلبات في فزعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatsPage,
});

function ChatsPage() {
  const { chats } = useStore();

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="px-4 pt-6">
        <h1 className="text-center text-lg font-extrabold text-foreground">المحادثات</h1>
      </header>

      <main className="mt-5 space-y-2 px-4">
        {chats.length === 0 && (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card-soft">
            لا توجد محادثات بعد. ستظهر هنا عند تواصلك مع أحد المساعدين.
          </p>
        )}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1];
          return (
            <Link
              key={chat.id}
              to="/chat/$chatId"
              params={{ chatId: chat.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card-soft transition-transform active:scale-[0.98]"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-bold text-secondary-foreground">
                {chat.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{chat.name}</span>
                  {last && (
                    <span className="text-[10px] text-muted-foreground">{timeAgo(last.at)}</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {last ? last.text : "ابدأ المحادثة"}
                </p>
              </div>
            </Link>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}
