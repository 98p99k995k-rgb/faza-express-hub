import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyAppAppearance,
  loadAppSettings,
  settingsKey,
  type AppSettings,
} from "@/lib/app-settings";
import type { Language } from "@/lib/translations";

export type RequestType = "urgent" | "delivery" | "lost" | "service" | "other";

export type HelpRequest = {
  id: string;
  type: RequestType;
  title: string;
  description: string;
  city: string;
  createdAt: string;
  status: "مفتوح" | "قيد التنفيذ" | "مكتمل";
  owner: string;
  mine: boolean;
  forSomeoneElse?: boolean;
  beneficiaryName?: string;
  beneficiaryPhone?: string;
  beneficiaryRelation?: string;
  deliveryAddress?: string;
  notes?: string;
  location?: { lat: number; lon: number };
};

export type Profile = {
  fullName: string;
  phone: string;
  city: string;
};

export type ChatMessage = { from: "me" | "them"; text: string; at: string };
export type Chat = { id: string; name: string; messages: ChatMessage[] };

export type FamilyMember = {
  id: string;
  name: string;
  phone: string;
  role: "owner" | "member";
  invitedBy?: string;
};

export type FamilyCartItem = {
  id: string;
  name: string;
  quantity: number;
  addedBy: string;
  createdAt: string;
};

export type FamilyState = {
  id: string;
  name: string;
  code: string;
  members: FamilyMember[];
  items: FamilyCartItem[];
};

const PROFILE_KEY = "fazaa.profile.v2";
const REQUESTS_KEY = "fazaa.requests.v2";
const FAVORITES_KEY = "fazaa.favorites.v2";
const CHATS_KEY = "fazaa.chats.v2";
const FAMILY_KEY = "fazaa.family.v1";
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  urgent: "مساعدة عاجلة",
  delivery: "توصيل",
  lost: "مفقودات",
  service: "خدمات",
  other: "أخرى",
};

export const REQUEST_TYPES: { id: RequestType; label: string }[] = Object.entries(
  REQUEST_TYPE_LABELS,
).flatMap(([id, label]) => {
  if (id === "urgent" || id === "lost") return [];
  return [{ id: id as RequestType, label }];
});

export const typeLabel = (t: RequestType) => REQUEST_TYPE_LABELS[t] ?? "أخرى";

const seedRequests: HelpRequest[] = [
  {
    id: "FZ-1001",
    type: "delivery",
    title: "مساعدة في توصيل",
    description: "أحتاج توصيل دواء إلى المستشفى بأسرع وقت ممكن.",
    city: "الرياض",
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    status: "مفتوح",
    owner: "أميرة",
    mine: false,
  },
  {
    id: "FZ-1002",
    type: "lost",
    title: "محفظة مفقودة",
    description: "فقدت محفظتي قرب حي النرجس، بداخلها بطاقات مهمة.",
    city: "الرياض",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "مفتوح",
    owner: "خالد",
    mine: false,
  },
  {
    id: "FZ-1003",
    type: "service",
    title: "نقل أغراض منزلية",
    description: "أحتاج شخصاً يساعدني في نقل كراتين لشقة قريبة.",
    city: "جدة",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: "قيد التنفيذ",
    owner: "سارة",
    mine: false,
  },
];

const seedChats: Chat[] = [
  {
    id: "c1",
    name: "أميرة",
    messages: [
      {
        from: "them",
        text: "أهلاً! شفت طلبك، أقدر أساعدك اليوم.",
        at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
];

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

type StoreValue = {
  hydrated: boolean;
  language: Language;
  theme: AppSettings["theme"];
  profile: Profile | null;
  requests: HelpRequest[];
  favorites: string[];
  chats: Chat[];
  family: FamilyState | null;
  welcomeComplete: boolean;
  saveProfile: (p: Profile) => void;
  signOut: () => void;
  completeWelcome: () => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: AppSettings["theme"]) => void;
  createFamily: (name: string) => FamilyState | null;
  joinFamily: (code: string, name?: string) => FamilyState | null;
  inviteFamilyMember: (name: string, phone: string) => void;
  addFamilyItem: (itemName: string) => void;
  updateFamilyName: (name: string) => void;
  setFamily: (family: FamilyState | null) => void;
  addRequest: (
    r: Omit<HelpRequest, "id" | "createdAt" | "status" | "owner" | "mine">,
  ) => HelpRequest;
  updateRequestStatus: (id: string, status: HelpRequest["status"]) => void;
  deleteRequest: (id: string) => void;
  toggleFavorite: (id: string) => void;
  sendMessage: (chatId: string, text: string) => void;
  timeAgo: (iso: string, language?: Language) => string;
};

const StoreContext = createContext<StoreValue | null>(null);

export function timeAgo(iso: string, language: Language = "ar") {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
  if (mins < 60) return formatter.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return formatter.format(-hours, "hour");
  return formatter.format(-Math.floor(hours / 24), "day");
}

function makeFamilyCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [language, setLanguageState] = useState<Language>("ar");
  const [theme, setThemeState] = useState<AppSettings["theme"]>("light");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [family, setFamily] = useState<FamilyState | null>(null);
  const [welcomeComplete, setWelcomeComplete] = useState(false);

  useEffect(() => {
    const settings = loadAppSettings();
    setLanguageState(settings.language);
    setThemeState(settings.theme);
    applyAppAppearance(settings);
    setProfile(load<Profile | null>(PROFILE_KEY, null));
    setRequests(load<HelpRequest[]>(REQUESTS_KEY, seedRequests));
    setFavorites(load<string[]>(FAVORITES_KEY, []));
    setChats(load<Chat[]>(CHATS_KEY, seedChats));
    setFamily(load<FamilyState | null>(FAMILY_KEY, null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const current = loadAppSettings();
    const next = { ...current, language, theme };
    try {
      window.localStorage.setItem(settingsKey, JSON.stringify(next));
    } catch {
      // The current selection still applies for this session when storage is unavailable.
    }
    applyAppAppearance(next);
  }, [hydrated, language, theme]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  }, [requests, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  }, [chats, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(FAMILY_KEY, JSON.stringify(family));
  }, [family, hydrated]);
  const saveProfile = useCallback((p: Profile) => setProfile(p), []);
  const signOut = useCallback(() => setProfile(null), []);
  const completeWelcome = useCallback(() => setWelcomeComplete(true), []);
  const setLanguage = useCallback((next: Language) => setLanguageState(next), []);
  const setTheme = useCallback((next: AppSettings["theme"]) => setThemeState(next), []);

  const createFamily = useCallback(
    (name: string) => {
      if (!profile) return null;
      const nextFamily: FamilyState = {
        id: `family-${Date.now()}`,
        name: name.trim() || "عائلتي",
        code: makeFamilyCode(),
        members: [
          {
            id: `member-${Date.now()}`,
            name: profile.fullName,
            phone: profile.phone,
            role: "owner",
          },
        ],
        items: [],
      };
      setFamily(nextFamily);
      return nextFamily;
    },
    [profile],
  );

  const joinFamily = useCallback(
    (code: string, name?: string) => {
      if (!profile) return null;
      const normalizedCode = code.trim().toUpperCase();
      if (!normalizedCode) return null;
      const nextFamily: FamilyState = {
        id: `family-${Date.now()}`,
        name: name?.trim() || "عائلة مشتركة",
        code: normalizedCode,
        members: [
          {
            id: `member-${Date.now()}`,
            name: profile.fullName,
            phone: profile.phone,
            role: "member",
          },
        ],
        items: [],
      };
      setFamily(nextFamily);
      return nextFamily;
    },
    [profile],
  );

  const inviteFamilyMember = useCallback(
    (name: string, phone: string) => {
      if (!family || !name.trim() || !phone.trim()) return;
      setFamily((current) => {
        if (!current) return current;
        const exists = current.members.some(
          (member) => member.phone === phone.trim() || member.name === name.trim(),
        );
        if (exists) return current;
        return {
          ...current,
          members: [
            ...current.members,
            {
              id: `member-${Date.now()}`,
              name: name.trim(),
              phone: phone.trim(),
              role: "member",
              invitedBy: profile?.fullName || "فزعة",
            },
          ],
        };
      });
    },
    [family, profile],
  );

  const addFamilyItem = useCallback(
    (itemName: string) => {
      if (!family || !itemName.trim()) return;
      const nextItem: FamilyCartItem = {
        id: `family-item-${Date.now()}`,
        name: itemName.trim(),
        quantity: 1,
        addedBy: profile?.fullName || "أنا",
        createdAt: new Date().toISOString(),
      };
      setFamily((current) =>
        current ? { ...current, items: [nextItem, ...current.items] } : current,
      );
    },
    [family, profile],
  );

  const updateFamilyName = useCallback(
    (name: string) => {
      if (!family) return;
      setFamily((current) =>
        current ? { ...current, name: name.trim() || current.name } : current,
      );
    },
    [family],
  );

  const addRequest = useCallback<StoreValue["addRequest"]>(
    (r) => {
      const request: HelpRequest = {
        ...r,
        id: `FZ-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        status: "مفتوح",
        owner: profile?.fullName || "أنا",
        mine: true,
      };
      setRequests((prev) => [request, ...prev]);
      return request;
    },
    [profile],
  );

  const updateRequestStatus = useCallback((id: string, status: HelpRequest["status"]) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const deleteRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setFavorites((prev) => prev.filter((f) => f !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const sendMessage = useCallback((chatId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { from: "me", text: trimmed, at: new Date().toISOString() },
              ],
            }
          : c,
      ),
    );
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      language,
      theme,
      profile,
      requests,
      favorites,
      chats,
      family,
      welcomeComplete,
      saveProfile,
      signOut,
      completeWelcome,
      setLanguage,
      setTheme,
      createFamily,
      joinFamily,
      inviteFamilyMember,
      addFamilyItem,
      updateFamilyName,
      setFamily,
      addRequest,
      updateRequestStatus,
      deleteRequest,
      toggleFavorite,
      sendMessage,
      timeAgo,
    }),
    [
      hydrated,
      language,
      theme,
      profile,
      requests,
      favorites,
      chats,
      family,
      welcomeComplete,
      saveProfile,
      signOut,
      completeWelcome,
      setLanguage,
      setTheme,
      createFamily,
      joinFamily,
      inviteFamilyMember,
      addFamilyItem,
      updateFamilyName,
      addRequest,
      updateRequestStatus,
      deleteRequest,
      toggleFavorite,
      sendMessage,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
