import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Copy, Mail, MessageSquareText } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { useTranslation } from "@/lib/useTranslation";

const supportEmail = "fazaasupport52@gmail.com";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "المساعدة والدعم – فزعة" }] }),
  component: SupportPage,
});

function SupportPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const url = new URL(`mailto:${supportEmail}`);
    url.searchParams.set("subject", subject.trim() || t("رسالة إلى دعم فزعة"));
    url.searchParams.set("body", message.trim());
    window.location.href = url.toString();
    toast.success(t("تم فتح تطبيق البريد. أرسل الرسالة منه لإتمام التواصل."));
    setSubject("");
    setMessage("");
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      toast.success(t("تم نسخ بريد الدعم."));
    } catch {
      toast.error(t("تعذر نسخ البريد. اضغط على العنوان لفتح تطبيق البريد."));
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <header className="flex items-center gap-3 px-4 pt-6">
        <Link
          to="/profile"
          aria-label={t("العودة إلى الملف الشخصي")}
          className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-card-soft"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold text-muted-foreground">{t("نحن هنا للمساعدة")}</p>
          <h1 className="text-xl font-extrabold text-foreground">{t("المساعدة والدعم")}</h1>
        </div>
      </header>
      <main className="px-4">
        <section className="mt-5 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-extrabold text-foreground">{t("الأسئلة الشائعة")}</h2>
          <details className="mt-3 border-b border-border py-3">
            <summary className="cursor-pointer text-sm font-bold text-foreground">
              {t("كيف أستخدم فزعة؟")}
            </summary>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {t(
                "اختر القسم من الصفحة الرئيسية، ثم حدّد موقعك أو اكتب مدينتك لاستعراض الأماكن المسجلة. يمكنك أيضاً إنشاء طلب مساعدة ومتابعته من صفحة الطلبات.",
              )}
            </p>
          </details>
          <details className="border-b border-border py-3">
            <summary className="cursor-pointer text-sm font-bold text-foreground">
              {t("كيف أقدّم طلباً؟")}
            </summary>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {t(
                "اختر «طلب مساعدة من المندوب»، اكتب الخدمة والعنوان والملاحظات، وأرفق موقعك اختيارياً. الطلبات تحفظ محلياً إلى أن يتم إعداد خدمة الطلبات.",
              )}
            </p>
          </details>
          <details className="py-3">
            <summary className="cursor-pointer text-sm font-bold text-foreground">
              {t("كيف أتواصل مع الدعم؟")}
            </summary>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {t("استخدم نموذج الرسالة أدناه، أو راسلنا مباشرة عبر البريد.")}
            </p>
          </details>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Mail className="h-4 w-4 text-accent" /> {t("البريد الإلكتروني للدعم")}
          </h2>
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-2">
            <a
              href={`mailto:${supportEmail}`}
              dir="ltr"
              className="min-w-0 break-all text-sm font-bold text-primary"
            >
              {supportEmail}
            </a>
            <button
              type="button"
              onClick={() => void copyEmail()}
              aria-label={t("نسخ بريد الدعم")}
              title={t("نسخ بريد الدعم")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-primary"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </section>

        <form
          onSubmit={send}
          className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <MessageSquareText className="h-4 w-4 text-accent" /> {t("أرسل رسالة أو شكوى")}
          </h2>
          <label className="block text-xs font-bold text-foreground">
            {t("عنوان الرسالة")}
            <input
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={120}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-xs font-bold text-foreground">
            {t("التفاصيل")}
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1.5 w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <button
            type="submit"
            className="min-h-12 w-full rounded-full bg-brand-gradient px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-brand"
          >
            {t("فتح البريد وإرسال الرسالة")}
          </button>
          <p className="text-[10px] leading-5 text-muted-foreground">
            {t("سيُفتح تطبيق البريد برسالتك؛ الإرسال النهائي يتم من تطبيق البريد.")}
          </p>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
