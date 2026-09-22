import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
};

export type Profile = {
  fullName: string;
  phone: string;
  city: string;
};

export type ChatMessage = { from: "me" | "them"; text: string; at: string };
export type Chat = { id: string; name: string; messages: ChatMessage[] };

const PROFILE_KEY = "fazaa.profile.v2";
const REQUESTS_KEY = "fazaa.requests.v2";
const FAVORITES_KEY = "fazaa.favorites.v2";
const CHATS_KEY = "fazaa.chats.v2";

export const REQUEST_TYPES: { id: RequestType; label: string }[] = [
  { id: "urgent", label: "مساعدة عاجلة" },
  { id: "delivery", label: "توصيل" },
  { id: "lost", label: "مفقودات" },
  { id: "service", label: "خدمات" },
  { id: "other", label: "أخرى" },
];

export const typeLabel = (t: RequestType) =>
  REQUEST_TYPES.find((r) => r.id === t)?.label ?? "أخرى";

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
      { from: "them", text: "أهلاً! شفت طلبك، أقدر أساعدك اليوم.", at: new Date(Date.now() - 3600000).toISOString() },
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
  profile: Profile | null;
  requests: HelpRequest[];
  favorites: string[];
  chats: Chat[];
  saveProfile: (p: Profile) => void;
  signOut: () => void;
  addRequest: (r: Omit<HelpRequest, "id" | "createdAt" | "status" | "owner" | "mine">) => HelpRequest;
  updateRequestStatus: (id: string, status: HelpRequest["status"]) => void;
  deleteRequest: (id: string) => void;
  toggleFavorite: (id: string) => void;
  sendMessage: (chatId: string, text: string) => void;
  timeAgo: (iso: string) => string;
};

const StoreContext = createContext<StoreValue | null>(null);

export function timeAgo(iso: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    setProfile(load<Profile | null>(PROFILE_KEY, null));
    setRequests(load<HelpRequest[]>(REQUESTS_KEY, seedRequests));
    setFavorites(load<string[]>(FAVORITES_KEY, []));
    setChats(load<Chat[]>(CHATS_KEY, seedChats));
    setHydrated(true);
  }, []);

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

  const saveProfile = useCallback((p: Profile) => setProfile(p), []);
  const signOut = useCallback(() => setProfile(null), []);

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
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
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
      profile,
      requests,
      favorites,
      chats,
      saveProfile,
      signOut,
      addRequest,
      updateRequestStatus,
      deleteRequest,
      toggleFavorite,
      sendMessage,
      timeAgo,
    }),
    [hydrated, profile, requests, favorites, chats, saveProfile, signOut, addRequest, updateRequestStatus, deleteRequest, toggleFavorite, sendMessage],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
