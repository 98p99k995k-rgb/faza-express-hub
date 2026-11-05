export type AppSettings = {
  orderNotifications: boolean;
  offerNotifications: boolean;
  language: "ar" | "en";
  theme: "light" | "dark";
  locationPrivacy: boolean;
};

export const settingsKey = "fazaa.settings.v1";
export const defaultSettings: AppSettings = {
  orderNotifications: true,
  offerNotifications: false,
  language: "ar",
  theme: "light",
  locationPrivacy: true,
};

export function loadAppSettings(): AppSettings {
  try {
    const saved = window.localStorage.getItem(settingsKey);
    if (!saved) return defaultSettings;
    const parsed = JSON.parse(saved) as Partial<AppSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      language: parsed.language === "en" ? "en" : "ar",
      theme: parsed.theme === "dark" ? "dark" : "light",
    };
  } catch {
    return defaultSettings;
  }
}

export function applyAppAppearance(settings: Pick<AppSettings, "language" | "theme">) {
  document.documentElement.lang = settings.language;
  document.documentElement.dir = settings.language === "ar" ? "rtl" : "ltr";
  document.documentElement.classList.toggle("dark", settings.theme === "dark");
}

export function locationUsageAllowed() {
  try {
    return loadAppSettings().locationPrivacy;
  } catch {
    return true;
  }
}
