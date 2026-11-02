import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action = "list" | "save" | "default" | "delete";

type PaymentMethodRequest = {
  action?: Action;
  tokenId?: string;
  methodId?: string;
};

type MoyasarToken = {
  id?: string;
  status?: string;
  brand?: string;
  last_four?: string;
  name?: string;
  month?: string;
  year?: string;
  metadata?: Record<string, unknown> | null;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return json({ error: "الطريقة غير مدعومة." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "يلزم تسجيل الدخول والتحقق من الحساب." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const moyasarSecretKey = Deno.env.get("MOYASAR_SECRET_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !moyasarSecretKey) {
    return json({ error: "إعدادات خدمة الدفع على الخادم غير مكتملة." }, 503);
  }
  if (!moyasarSecretKey.startsWith("sk_test_")) {
    return json({ error: "خدمة الدفع مهيأة لبيئة Sandbox فقط." }, 503);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) {
    return json({ error: "جلسة الدخول غير صالحة. سجّل الدخول مجدداً." }, 401);
  }
  const user = authData.user;

  let payload: PaymentMethodRequest;
  try {
    payload = (await request.json()) as PaymentMethodRequest;
  } catch {
    return json({ error: "تعذر قراءة الطلب." }, 400);
  }
  if (!payload || !["list", "save", "default", "delete"].includes(payload.action ?? "")) {
    return json({ error: "العملية المطلوبة غير صحيحة." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (payload.action === "list") {
    const { data, error } = await admin
      .from("payment_methods")
      .select("id, brand, last_four, cardholder_name, exp_month, exp_year, is_default, created_at")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Could not list payment methods:", error.message);
      return json({ error: "تعذر تحميل البطاقات المحفوظة." }, 500);
    }
    return json({ methods: data });
  }

  if (payload.action === "save") {
    if (!payload.tokenId || !/^token_[A-Za-z0-9]+$/.test(payload.tokenId)) {
      return json({ error: "معرف البطاقة غير صالح." }, 400);
    }
    const tokenResponse = await fetch(
      `https://api.moyasar.com/v1/tokens/${encodeURIComponent(payload.tokenId)}`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${moyasarSecretKey}:`)}`,
          Accept: "application/json",
        },
      },
    );
    if (!tokenResponse.ok) {
      console.error("Moyasar token verification failed:", tokenResponse.status);
      return json({ error: "تعذر التحقق من البطاقة لدى Moyasar." }, 502);
    }
    const token = (await tokenResponse.json()) as MoyasarToken;
    if (
      token.id !== payload.tokenId ||
      token.status !== "active" ||
      token.metadata?.supabase_user_id !== user.id
    ) {
      return json({ error: "لم يكتمل التحقق البنكي أو لا تتبع البطاقة لهذا الحساب." }, 422);
    }

    const month = Number(token.month);
    let year = Number(token.year);
    if (year < 100) year += 2000;
    const lastFour = token.last_four ?? "";
    const now = new Date();
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1) ||
      !/^\d{4}$/.test(lastFour) ||
      !token.name
    ) {
      return json({ error: "تعذر التحقق من بيانات البطاقة الآمنة." }, 422);
    }

    const { data: methodId, error } = await admin.rpc("create_payment_method", {
      p_user_id: user.id,
      p_token_id: token.id,
      p_brand: normalizeBrand(token.brand),
      p_last_four: lastFour,
      p_cardholder_name: token.name,
      p_exp_month: month,
      p_exp_year: year,
    });
    if (error) {
      console.error("Could not save payment method:", error.message);
      return json({ error: "تعذر حفظ البطاقة الآمنة." }, 500);
    }
    return json({ id: methodId });
  }

  if (!payload.methodId || !/^[0-9a-f-]{36}$/i.test(payload.methodId)) {
    return json({ error: "معرف البطاقة غير صالح." }, 400);
  }

  const { data: method, error: lookupError } = await admin
    .from("payment_methods")
    .select("id, moyasar_token_id, is_default")
    .eq("id", payload.methodId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError) {
    console.error("Could not read payment method:", lookupError.message);
    return json({ error: "تعذر قراءة البطاقة المطلوبة." }, 500);
  }
  if (!method) return json({ error: "البطاقة غير موجودة في حسابك." }, 404);

  if (payload.action === "default") {
    const { error } = await admin.rpc("set_default_payment_method", {
      p_user_id: user.id,
      p_method_id: method.id,
    });
    if (error) {
      console.error("Could not set default payment method:", error.message);
      return json({ error: "تعذر تغيير البطاقة الافتراضية." }, 500);
    }
    return json({ ok: true });
  }

  const deleteResponse = await fetch(
    `https://api.moyasar.com/v1/tokens/${encodeURIComponent(method.moyasar_token_id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Basic ${btoa(`${moyasarSecretKey}:`)}` },
    },
  );
  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    console.error("Moyasar token deletion failed:", deleteResponse.status);
    return json({ error: "لم يتمكن Moyasar من حذف البطاقة. لم تُحذف من حسابك." }, 502);
  }
  const { error: deleteError } = await admin.rpc("delete_payment_method", {
    p_user_id: user.id,
    p_method_id: method.id,
  });
  if (deleteError) {
    console.error("Could not remove payment method record:", deleteError.message);
    return json(
      { error: "حُذفت البطاقة من Moyasar لكن تعذّر تحديث سجل الحساب. أعد المحاولة." },
      500,
    );
  }
  return json({ ok: true });
});

function normalizeBrand(brand?: string) {
  if (brand === "mada" || brand === "visa") return brand;
  if (brand === "master" || brand === "mastercard") return "mastercard";
  return "other";
}
