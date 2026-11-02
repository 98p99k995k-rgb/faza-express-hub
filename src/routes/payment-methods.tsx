import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  ArrowRight,
  Check,
  CreditCard,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { getMoyasarPublishableKey, getSupabaseClient } from "@/lib/supabase";

export const Route = createFileRoute("/payment-methods")({
  head: () => ({
    meta: [
      { title: "طرق الدفع – فزعة" },
      { name: "description", content: "إدارة بطاقات الدفع المحفوظة في فزعة." },
    ],
  }),
  component: PaymentMethodsPage,
});

type PaymentMethod = {
  id: string;
  brand: "mada" | "visa" | "mastercard" | "other";
  last_four: string;
  cardholder_name: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
};

type MoyasarTokenResponse = {
  id?: string;
  status?: string;
  verification_url?: string;
  message?: string;
};

const pendingTokenKey = "fazaa.pendingMoyasarToken";

function PaymentMethodsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const client = getSupabaseClient();
  const publishableKey = getMoyasarPublishableKey();
  const configured = Boolean(client && publishableKey.startsWith("pk_test_"));

  const loadMethods = useCallback(async () => {
    if (!client || !user) return;
    setMethodsLoading(true);
    try {
      const { data, error } = await client.functions.invoke("payment-methods", {
        body: { action: "list" },
      });
      if (error) {
        setBackendReady(false);
        setBackendError(true);
        setMethods([]);
        toast.error("تعذر تحميل البطاقات. تحقق من إعداد خدمة الدفع ثم أعد المحاولة.");
        return;
      }
      if (!Array.isArray(data?.methods)) {
        setBackendReady(false);
        setBackendError(true);
        setMethods([]);
        toast.error("وصل رد غير متوقع من خدمة الدفع.");
        return;
      }
      setBackendReady(true);
      setBackendError(false);
      setMethods(data.methods as PaymentMethod[]);
    } catch {
      setBackendReady(false);
      setBackendError(true);
      setMethods([]);
      toast.error("تعذر الاتصال بخدمة الدفع الآمنة.");
    } finally {
      setMethodsLoading(false);
    }
  }, [client, user]);

  const saveVerifiedToken = useCallback(
    async (tokenId: string) => {
      if (!client) return;
      const { data, error } = await client.functions.invoke("payment-methods", {
        body: { action: "save", tokenId },
      });
      if (error || data?.error) {
        toast.error(data?.error ?? "تعذر التحقق من البطاقة. تأكد من إتمام التحقق البنكي.");
        return;
      }
      toast.success("تم حفظ البطاقة بأمان.");
      setShowForm(false);
      await loadMethods();
    },
    [client, loadMethods],
  );

  useEffect(() => {
    if (!client) {
      setAuthReady(true);
      return;
    }
    let active = true;
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) toast.error("تعذر التحقق من تسجيل الدخول.");
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setMethods([]);
        setBackendReady(false);
        setBackendError(false);
      }
      setOtpSent(false);
      setOtp("");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!user || !configured) return;
    void loadMethods();
  }, [user, configured, loadMethods]);

  useEffect(() => {
    if (!user || !configured || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pendingToken = window.sessionStorage.getItem(pendingTokenKey);
    if (
      params.get("moyasar_return") !== "1" &&
      !params.has("token_id") &&
      !params.has("id") &&
      !pendingToken
    ) {
      return;
    }

    const tokenId = params.get("token_id") ?? params.get("id") ?? pendingToken;
    window.sessionStorage.removeItem(pendingTokenKey);
    window.history.replaceState({}, "", window.location.pathname);

    if (!tokenId) {
      toast.error("لم يكتمل التحقق من البطاقة. حاول إضافتها مرة أخرى.");
      return;
    }
    void saveVerifiedToken(tokenId);
  }, [user, configured, saveVerifiedToken]);

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client) {
      toast.error("إعداد تسجيل الدخول الآمن غير مكتمل.");
      return;
    }
    const normalizedPhone = normalizeSaudiPhone(phone);
    if (!normalizedPhone) {
      toast.error("أدخل رقم جوال سعودي صحيحاً.");
      return;
    }
    setAuthBusy(true);
    const { error } = await client.auth.signInWithOtp({ phone: normalizedPhone });
    setAuthBusy(false);
    if (error) {
      toast.error("تعذر إرسال رمز التحقق. تحقق من إعداد SMS في Supabase.");
      return;
    }
    setPhone(normalizedPhone);
    setOtpSent(true);
    toast.success("تم إرسال رمز التحقق إلى جوالك.");
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client || !/^\d{6}$/.test(otp)) {
      toast.error("أدخل رمز التحقق المكوّن من 6 أرقام.");
      return;
    }
    setAuthBusy(true);
    const { data, error } = await client.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setAuthBusy(false);
    if (error || !data.user) {
      toast.error("رمز التحقق غير صحيح أو منتهي الصلاحية.");
      return;
    }
    setUser(data.user);
    setOtp("");
    toast.success("تم التحقق من رقم جوالك.");
  };

  const addCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client || !user || !publishableKey.startsWith("pk_test_") || !backendReady) {
      toast.error("الدفع متاح في بيئة Sandbox فقط بعد إعداد مفاتيح Moyasar.");
      return;
    }

    const digits = cardNumber.replace(/\D/g, "");
    const expiryMatch = expiry.trim().match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2}|\d{4})$/);
    if (!cardholder.trim() || digits.length < 12 || digits.length > 19 || !expiryMatch) {
      toast.error("تحقق من اسم حامل البطاقة ورقمها وتاريخ الانتهاء.");
      return;
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      toast.error("رمز CVV يجب أن يتكون من 3 أو 4 أرقام.");
      return;
    }

    const month = Number(expiryMatch[1] ?? "0");
    const shortYear = Number(
      (expiryMatch[2] ?? "").length === 2 ? expiryMatch[2] : (expiryMatch[2] ?? "").slice(-2),
    );
    const year = 2000 + shortYear;
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      toast.error("تاريخ انتهاء البطاقة غير صالح.");
      return;
    }

    setSavingCard(true);
    const submittedCard = {
      name: cardholder.trim(),
      number: digits,
      month,
      year: shortYear,
      cvc,
      callback_url: `${window.location.origin}/payment-methods?moyasar_return=1`,
      metadata: { supabase_user_id: user.id },
    };
    setCardholder("");
    setCardNumber("");
    setExpiry("");
    setCvc("");

    try {
      const response = await fetch("https://api.moyasar.com/v1/tokens", {
        method: "POST",
        headers: {
          Authorization: `Basic ${window.btoa(`${publishableKey}:`)}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(submittedCard),
      });
      const result = (await response.json()) as MoyasarTokenResponse;
      if (!response.ok || !result.id) {
        toast.error(
          result.message ?? "رفضت بوابة الدفع إضافة البطاقة. راجع البيانات وحاول مجدداً.",
        );
        return;
      }

      if (result.status === "active") {
        await saveVerifiedToken(result.id);
        return;
      }
      if (result.status !== "initiated" || !result.verification_url) {
        toast.error("تعذر بدء التحقق البنكي للبطاقة.");
        return;
      }

      const verificationUrl = new URL(result.verification_url);
      if (verificationUrl.origin !== "https://api.moyasar.com") {
        toast.error("عنوان التحقق البنكي غير موثوق.");
        return;
      }
      window.sessionStorage.setItem(pendingTokenKey, result.id);
      window.location.assign(verificationUrl.toString());
    } catch {
      toast.error("تعذر الاتصال الآمن ببوابة Moyasar. حاول مرة أخرى.");
    } finally {
      setSavingCard(false);
    }
  };

  const updateMethod = async (action: "default" | "delete", id: string) => {
    if (!client) return;
    if (action === "delete" && !window.confirm("هل تريد حذف هذه البطاقة؟")) return;
    const { data, error } = await client.functions.invoke("payment-methods", {
      body: { action, methodId: id },
    });
    if (error || data?.error) {
      toast.error(data?.error ?? "تعذر تحديث البطاقة. حاول مرة أخرى.");
      return;
    }
    toast.success(action === "default" ? "تم تحديث البطاقة الافتراضية." : "تم حذف البطاقة.");
    await loadMethods();
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-28">
      <header className="flex items-center gap-3 px-5 pb-4 pt-7">
        <Link
          to="/profile"
          aria-label="العودة إلى الملف الشخصي"
          className="grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-card-soft"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">طرق الدفع</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">بطاقاتك محفوظة بأمان عبر Moyasar</p>
        </div>
        <div className="mr-auto grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <WalletCards className="h-5 w-5" />
        </div>
      </header>

      <main className="space-y-5 px-4">
        <section className="rounded-3xl bg-gradient-to-br from-[#4c1a99] via-[#6827ad] to-[#a43eac] p-5 text-white shadow-brand">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-extrabold">دفع أسهل، وأمان أعلى</p>
              <p className="mt-1 text-xs leading-6 text-white/80">
                لا نحفظ رقم البطاقة أو رمز الأمان. تتم عملية التحقق وحفظ الرمز لدى Moyasar.
              </p>
            </div>
            <ShieldCheck className="h-7 w-7 shrink-0 text-white/90" />
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold">
            <span className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" /> اتصال مشفّر
            </span>
            <span>Sandbox</span>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-card-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">شبكات الدفع لدى Moyasar</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                التفعيل الفعلي يتطلب إعداد حساب التاجر
              </p>
            </div>
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <BrandBadge label="mada" className="text-emerald-700" />
            <BrandBadge label="VISA" className="text-blue-800" />
            <BrandBadge label="mastercard" className="text-[#d33a43]" />
            <div className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border bg-background text-[10px] font-bold text-foreground">
              <Apple className="h-4 w-4" /> Pay
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            إضافة البطاقات المحفوظة متاحة لمدى وVisa وMastercard. Apple Pay غير مفعّل حتى إعداد صفحة
            دفع ونطاق تاجر معتمد؛ ولا تُحفظ بياناته من هذه الصفحة.
          </p>
        </section>

        {!configured && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p className="font-extrabold">يلزم إعداد Sandbox قبل إضافة البطاقات</p>
            <p className="mt-1 text-xs">
              أضف مفاتيح Supabase وMoyasar التجريبية، ثم انشر ترحيل قاعدة البيانات ووظيفة الدفع. لا
              تُقبل مفاتيح Moyasar الحية في هذه الشاشة.
            </p>
          </section>
        )}
        {configured && user && backendError && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p className="font-extrabold">خدمة حفظ البطاقات غير جاهزة</p>
            <p className="mt-1 text-xs">
              لم نتمكن من التحقق من وظيفة Supabase وإعدادات Sandbox. لن نرسل طلب إضافة بطاقة حتى
              تعمل الخدمة.
            </p>
            <button
              type="button"
              onClick={() => void loadMethods()}
              className="mt-3 rounded-full bg-amber-900 px-4 py-2 text-xs font-bold text-white"
            >
              إعادة المحاولة
            </button>
          </section>
        )}

        {!authReady ? (
          <LoadingCard label="جارٍ التحقق من الحساب..." />
        ) : !client ? (
          <SetupCard />
        ) : !user ? (
          <PhoneVerification
            authBusy={authBusy}
            otpSent={otpSent}
            phone={phone}
            otp={otp}
            setPhone={setPhone}
            setOtp={setOtp}
            onRequestOtp={requestOtp}
            onVerifyOtp={verifyOtp}
            onChangePhone={() => {
              setOtpSent(false);
              setOtp("");
            }}
          />
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-extrabold text-foreground">بطاقاتي</h2>
                <span className="text-xs text-muted-foreground">{methods.length} بطاقة</span>
              </div>
              {methodsLoading ? (
                <LoadingCard label="جارٍ تحميل بطاقاتك..." />
              ) : methods.length ? (
                methods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onDefault={() => void updateMethod("default", method.id)}
                    onDelete={() => void updateMethod("delete", method.id)}
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-8 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-accent">
                    <CreditCard className="h-7 w-7" />
                  </div>
                  <p className="mt-3 text-sm font-extrabold text-foreground">
                    ما أضفت أي بطاقة بعد
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    أضف بطاقة بأمان، وسيتم التحقق منها لدى Moyasar.
                  </p>
                </div>
              )}
            </section>

            {showForm ? (
              <form
                onSubmit={addCard}
                className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card-soft"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-foreground">إضافة بطاقة جديدة</h2>
                  <LockKeyhole className="h-5 w-5 text-success" />
                </div>
                <p className="text-[11px] leading-5 text-muted-foreground">
                  بيانات البطاقة تُرسل مباشرة من جهازك إلى Moyasar عبر HTTPS، ولا تمر بخادم فزعة.
                </p>
                <label className="block text-xs font-bold text-foreground">
                  اسم حامل البطاقة
                  <input
                    required
                    autoComplete="cc-name"
                    value={cardholder}
                    onChange={(event) => setCardholder(event.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="كما يظهر على البطاقة"
                  />
                </label>
                <label className="block text-xs font-bold text-foreground">
                  رقم البطاقة
                  <input
                    required
                    autoComplete="cc-number"
                    inputMode="numeric"
                    dir="ltr"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(event.target.value.replace(/[^\d ]/g, ""))}
                    className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-3 text-left text-sm tracking-wider outline-none focus:ring-2 focus:ring-ring"
                    placeholder="•••• •••• •••• ••••"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-bold text-foreground">
                    تاريخ الانتهاء
                    <input
                      required
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      dir="ltr"
                      value={expiry}
                      onChange={(event) => setExpiry(event.target.value.replace(/[^\d/]/g, ""))}
                      className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-3 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="MM/YY"
                    />
                  </label>
                  <label className="block text-xs font-bold text-foreground">
                    رمز CVV
                    <input
                      required
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      dir="ltr"
                      value={cvc}
                      onChange={(event) =>
                        setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-3 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="•••"
                    />
                  </label>
                </div>
                <p className="rounded-xl bg-secondary/70 px-3 py-2 text-[10px] leading-5 text-muted-foreground">
                  تتطلب إضافة البطاقة تحققاً بنكياً. قد ينشئ البنك تفويض تحقق بقيمة 1 ريال يتم
                  إلغاؤه تلقائياً من Moyasar ولا يُحصّل.
                </p>
                <button
                  type="submit"
                  disabled={savingCard || !configured || !backendReady}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingCard ? "جارٍ بدء التحقق..." : "تحقق واحفظ البطاقة"}
                  <ShieldCheck className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full py-2 text-xs font-bold text-muted-foreground"
                >
                  إلغاء
                </button>
              </form>
            ) : (
              <button
                type="button"
                disabled={!configured || !backendReady}
                onClick={() => setShowForm(true)}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                إضافة بطاقة جديدة
              </button>
            )}

            <button
              type="button"
              onClick={() => void client.auth.signOut()}
              className="w-full py-2 text-xs font-bold text-muted-foreground underline"
            >
              تسجيل الخروج من إدارة وسائل الدفع
            </button>
          </>
        )}

        <div className="flex items-start gap-2 rounded-2xl bg-secondary/70 p-3 text-[10px] leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p>
            لا يخزن فزعة رقم البطاقة الكامل أو CVV. تحفظ قاعدة البيانات معرف Moyasar والبيانات
            المقنّعة فقط، مع تقييدها بحسابك الموثّق.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function BrandBadge({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`flex min-h-11 items-center justify-center rounded-xl border border-border bg-background text-[10px] font-black ${className}`}
    >
      {label}
    </div>
  );
}

function PaymentMethodCard({
  method,
  onDefault,
  onDelete,
}: {
  method: PaymentMethod;
  onDefault: () => void;
  onDelete: () => void;
}) {
  const brandName =
    method.brand === "mada"
      ? "مدى"
      : method.brand === "mastercard"
        ? "Mastercard"
        : method.brand === "visa"
          ? "Visa"
          : "بطاقة";
  return (
    <article className="rounded-3xl border border-border bg-card p-4 shadow-card-soft">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-accent">
          <CreditCard className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-extrabold text-foreground">{brandName}</p>
            {method.is_default && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-bold text-success">
                افتراضية
              </span>
            )}
          </div>
          <p className="mt-1 text-xs tracking-widest text-muted-foreground" dir="ltr">
            •••• •••• •••• {method.last_four}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {method.cardholder_name} · تنتهي {String(method.exp_month).padStart(2, "0")}/
            {method.exp_year}
          </p>
        </div>
        <button
          type="button"
          aria-label="حذف البطاقة"
          onClick={onDelete}
          className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {!method.is_default && (
        <button
          type="button"
          onClick={onDefault}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/70 py-2.5 text-xs font-bold text-foreground"
        >
          <Star className="h-4 w-4 text-primary" />
          تعيين كطريقة افتراضية
        </button>
      )}
      {method.is_default && (
        <p className="mt-3 flex items-center justify-center gap-1 text-[10px] font-bold text-success">
          <Check className="h-3.5 w-3.5" /> طريقة الدفع الافتراضية
        </p>
      )}
    </article>
  );
}

function PhoneVerification({
  authBusy,
  otpSent,
  phone,
  otp,
  setPhone,
  setOtp,
  onRequestOtp,
  onVerifyOtp,
  onChangePhone,
}: {
  authBusy: boolean;
  otpSent: boolean;
  phone: string;
  otp: string;
  setPhone: (value: string) => void;
  setOtp: (value: string) => void;
  onRequestOtp: (event: FormEvent<HTMLFormElement>) => void;
  onVerifyOtp: (event: FormEvent<HTMLFormElement>) => void;
  onChangePhone: () => void;
}) {
  return (
    <form
      onSubmit={otpSent ? onVerifyOtp : onRequestOtp}
      className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card-soft"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <LockKeyhole className="h-6 w-6" />
      </div>
      <div className="text-center">
        <h2 className="text-base font-extrabold text-foreground">تحقق من رقم جوالك</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          نستخدم رمزاً لمرة واحدة لحماية بطاقاتك وربطها بحسابك.
        </p>
      </div>
      {!otpSent ? (
        <label className="block text-xs font-bold text-foreground">
          رقم الجوال السعودي
          <input
            required
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-3 text-left text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="05XXXXXXXX"
          />
        </label>
      ) : (
        <label className="block text-xs font-bold text-foreground">
          رمز التحقق المرسل إلى {phone}
          <input
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            dir="ltr"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••"
          />
        </label>
      )}
      <button
        type="submit"
        disabled={authBusy}
        className="w-full rounded-full bg-brand-gradient py-3.5 text-sm font-extrabold text-primary-foreground shadow-brand disabled:opacity-50"
      >
        {authBusy ? "لحظة من فضلك..." : otpSent ? "تأكيد الرمز" : "إرسال رمز التحقق"}
      </button>
      {otpSent && (
        <button
          type="button"
          onClick={onChangePhone}
          className="w-full py-1 text-xs font-bold text-muted-foreground"
        >
          تغيير رقم الجوال
        </button>
      )}
    </form>
  );
}

function SetupCard() {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 text-center shadow-card-soft">
      <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-3 text-sm font-extrabold text-foreground">إعداد الدفع الآمن غير مكتمل</h2>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        يلزم إعداد مشروع Supabase وبيئة Moyasar Sandbox. لن تُحفظ بطاقات أو بيانات تجريبية قبل
        اكتمال الإعداد.
      </p>
    </section>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}

function normalizeSaudiPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("966") ? digits.slice(3) : digits;
  if (/^05\d{8}$/.test(local)) return `+966${local.slice(1)}`;
  if (/^5\d{8}$/.test(local)) return `+966${local}`;
  return null;
}
