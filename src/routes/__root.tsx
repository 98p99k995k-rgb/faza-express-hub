import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  Navigate,
  createRootRouteWithContext,
  useLocation,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { applyAppAppearance, loadAppSettings } from "../lib/app-settings";
import { translate, type Language } from "@/lib/translations";
import { StoreProvider, useStore } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const t = useFallbackTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("الصفحة غير موجودة")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("الصفحة التي تبحث عنها غير متاحة أو تم نقلها.")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("الرئيسية")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const t = useFallbackTranslation();
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("تعذر تحميل الصفحة")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو العودة إلى الرئيسية.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("إعادة المحاولة")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("الرئيسية")}
          </a>
        </div>
      </div>
    </div>
  );
}

function useFallbackTranslation() {
  const [language, setLanguage] = useState<Language>("ar");
  useEffect(() => {
    setLanguage(loadAppSettings().language);
  }, []);
  return (message: string) => translate(message, language);
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "فزعة – مع بعض.. دايماً أقوى" },
      { name: "description", content: "فزعة: تطبيق سعودي للمساعدات والتوصيل والمفقودات." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppRoutes() {
  const { hydrated, welcomeComplete } = useStore();
  const location = useLocation();

  useEffect(() => {
    applyAppAppearance(loadAppSettings());
  }, []);

  if (!hydrated) return null;
  if (!welcomeComplete && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <div key={location.pathname} className="route-transition">
      <Outlet />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AppRoutes />
        <Toaster position="top-center" richColors />
      </StoreProvider>
    </QueryClientProvider>
  );
}
