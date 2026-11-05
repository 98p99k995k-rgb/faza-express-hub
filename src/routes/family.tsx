import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gift, Plus, ShoppingCart, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/useTranslation";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "العائلة – فزعة" },
      { name: "description", content: "إدارة عائلتك والسلة المشتركة في فزعة." },
      { property: "og:title", content: "العائلة – فزعة" },
      { property: "og:description", content: "السلة المشتركة والعضوية العائلية في فزعة." },
    ],
  }),
  component: FamilyPage,
});

function FamilyPage() {
  const { language, t } = useTranslation();
  const {
    profile,
    family,
    createFamily,
    joinFamily,
    inviteFamilyMember,
    addFamilyItem,
    updateFamilyName,
  } = useStore();

  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [itemName, setItemName] = useState("");

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-background px-6 pb-24 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-3xl font-extrabold text-accent">
          <Users className="h-9 w-9" />
        </div>
        <h1 className="text-lg font-extrabold text-foreground">{t("العائلة تحتاج حساباً")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("سجّل دخولك أولاً لإنشاء عائلتك أو الانضمام إليها ومشاركة السلة.")}
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

  const currentFamily = family;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      <header className="flex items-center justify-between px-4 pt-6">
        <Link
          to="/"
          className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-card-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-extrabold text-foreground">{t("العائلة")}</h1>
        <span className="w-10" />
      </header>

      <main className="space-y-4 px-4 pt-4">
        {!currentFamily ? (
          <div className="space-y-4">
            <div className="rounded-3xl bg-card p-4 shadow-card-soft">
              <label className="mb-2 block text-sm font-bold text-foreground">
                {t("إنشاء عائلة جديدة")}
              </label>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder={t("مثال: عائلة السالم")}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => {
                  const newFamily = createFamily(familyName);
                  if (newFamily) updateFamilyName(newFamily.name);
                }}
                className="mt-3 w-full rounded-full bg-brand-gradient py-3 text-sm font-extrabold text-primary-foreground shadow-brand"
              >
                {t("إنشاء عائلة")}
              </button>
            </div>

            <div className="rounded-3xl bg-card p-4 shadow-card-soft">
              <label className="mb-2 block text-sm font-bold text-foreground">
                {t("الانضمام إلى عائلة")}
              </label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder={t("أدخل رمز العائلة")}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => joinFamily(joinCode)}
                className="mt-3 w-full rounded-full bg-secondary py-3 text-sm font-extrabold text-secondary-foreground"
              >
                {t("الانضمام")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <section className="rounded-3xl bg-brand-gradient p-4 text-primary-foreground shadow-brand">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80">{t("حالة السلة المشتركة")}</p>
                  <h2 className="mt-1 text-xl font-black">{t(currentFamily.name)}</h2>
                </div>
                <div className="rounded-2xl bg-white/15 px-3 py-2 text-start">
                  <p className="text-[10px] opacity-80">{t("عدد المنتجات")}</p>
                  <p className="text-lg font-black">{currentFamily.items.length}</p>
                </div>
              </div>
              <p className="mt-3 text-sm opacity-90">
                {t("رمز العائلة: {{code}}", { code: currentFamily.code })}
              </p>
            </section>

            <section className="rounded-3xl bg-card p-4 shadow-card-soft">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground">{t("أفراد العائلة")}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                  {currentFamily.members.length}{" "}
                  {t(currentFamily.members.length === 1 ? "عضو" : "أعضاء")}
                </span>
              </div>
              <div className="space-y-2">
                {currentFamily.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">{member.phone}</p>
                    </div>
                    <span className="rounded-full bg-card px-2 py-1 text-[10px] font-bold text-accent">
                      {t(member.role === "owner" ? "مالك" : "عضو")}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-card p-4 shadow-card-soft">
              <h3 className="text-sm font-black text-foreground">{t("دعوة فرد للعائلة")}</h3>
              <div className="mt-3 space-y-3">
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder={t("اسم العضو")}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder={t("رقم الجوال")}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => {
                    inviteFamilyMember(inviteName, invitePhone);
                    setInviteName("");
                    setInvitePhone("");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3 text-sm font-extrabold text-secondary-foreground"
                >
                  <UserPlus className="h-4 w-4" />
                  {t("إرسال دعوة")}
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-card p-4 shadow-card-soft">
              <h3 className="text-sm font-black text-foreground">
                {t("إضافة منتج للسلة المشتركة")}
              </h3>
              <div className="mt-3 flex gap-2">
                <input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={t("أضف منتجاً مثل: خبز / ماء / بطاطس")}
                  className="flex-1 rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => {
                    addFamilyItem(itemName);
                    setItemName("");
                  }}
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-brand"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-card p-4 shadow-card-soft">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground">{t("السلة المشتركة")}</h3>
                <span className="flex items-center gap-1 text-xs font-bold text-primary">
                  <ShoppingCart className="h-4 w-4" />
                  {currentFamily.items.length} {t("عنصر")}
                </span>
              </div>

              {currentFamily.items.length === 0 ? (
                <p className="rounded-2xl bg-secondary px-3 py-4 text-center text-sm text-muted-foreground">
                  {t("لا توجد عناصر في السلة المشتركة بعد.")}
                </p>
              ) : (
                <div className="space-y-2">
                  {currentFamily.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-secondary px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t("أضافه: {{name}}", { name: item.addedBy })}
                        </p>
                      </div>
                      <span className="rounded-full bg-card px-2.5 py-1 text-[10px] font-bold text-primary">
                        {item.quantity}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <button
              type="button"
              onClick={() => {
                updateFamilyName("عائلتي");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-bold text-foreground"
            >
              <Gift className="h-4 w-4 text-primary" />
              {t("تجهيز العائلة للدفع")}
            </button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
