import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { sampleItems, sampleOwners, type Category, type Item, type Owner } from "./data";
import { formatRange } from "./dates";
import { PHOTO_BUCKET, supabase, supabaseConfigured } from "./supabase";

export const REQUEST_TTL_MS = 2 * 60 * 60 * 1000;

export type RequestStatus = "pending" | "approved" | "declined" | "cancelled";
export type DisplayStatus = RequestStatus | "expired";

export type Profile = { id: string; name: string; program: string };

export type BorrowRequest = {
  id: string;
  itemId: string;
  borrowerId: string;
  start: string;
  end: string;
  days: number;
  total: number;
  status: RequestStatus;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  kind: "text" | "system";
  text: string;
  at: string;
};

export type Thread = {
  id: string;
  itemId: string;
  borrowerId: string;
  ownerId: string;
  /** The person on the other side of this conversation. */
  otherId: string;
  messages: ChatMessage[];
  updatedAt: string;
};

export type ListingInput = {
  title: string;
  category: Category;
  price: number;
  coverage: number;
  description: string;
  pickup: string;
  /** A data: URL for a newly picked photo, an existing https URL, or "" for none. */
  photo: string;
};

type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

/* ───────── Row shapes from the database ───────── */
type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  category: Category;
  price: number;
  coverage: number;
  description: string;
  pickup: string;
  photo_url: string | null;
  created_at: string;
};
type RequestRow = {
  id: string;
  listing_id: string;
  borrower_id: string;
  start_date: string;
  end_date: string;
  days: number;
  total: number;
  status: RequestStatus;
  created_at: string;
};
type ConversationRow = { id: string; listing_id: string; borrower_id: string; owner_id: string; updated_at: string };
type MessageRow = { id: string; conversation_id: string; sender_id: string; body: string; kind: "text" | "system"; created_at: string };

const toItem = (row: ListingRow): Item => ({
  id: row.id,
  title: row.title,
  category: row.category,
  price: row.price,
  coverage: row.coverage,
  description: row.description,
  pickup: row.pickup,
  photo: row.photo_url ?? "",
  alt: row.title,
  ownerId: row.owner_id,
  distance: "On campus",
  createdAt: row.created_at,
});

const toRequest = (row: RequestRow): BorrowRequest => ({
  id: row.id,
  itemId: row.listing_id,
  borrowerId: row.borrower_id,
  start: row.start_date,
  end: row.end_date,
  days: row.days,
  total: row.total,
  status: row.status,
  createdAt: row.created_at,
});

/** Turn database errors into sentences people can act on. */
export function friendlyError(error: { message?: string } | null | undefined): string {
  const message = error?.message ?? "";
  if (/uci\.edu/i.test(message) || /database error saving new user/i.test(message))
    return "Only @uci.edu email addresses can sign up.";
  if (/already registered|already been registered|user_already_exists/i.test(message))
    return "An account with this email already exists. Log in instead.";
  if (/invalid login credentials/i.test(message)) return "That email and password don’t match.";
  if (/password should be at least/i.test(message)) return "Use a password with at least 8 characters.";
  if (/rate limit|too many requests/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  if (/failed to fetch|network/i.test(message)) return "Can’t reach the server. Check your connection and try again.";
  const known = [
    "You can't request your own item",
    "Pick a start date that isn't in the past",
    "This request is already closed",
    "This request expired after 2 hours without a response",
    "That listing no longer exists",
  ];
  const match = known.find((text) => message.includes(text));
  if (match) return match.replace("can't", "can’t").replace("isn't", "isn’t") + ".";
  return message || "Something went wrong. Please try again.";
}

const fail = <T,>(error: { message?: string } | null | undefined): Result<T> => ({ ok: false, error: friendlyError(error) });

export function displayStatus(request: BorrowRequest, now = Date.now()): DisplayStatus {
  if (request.status === "pending" && now - new Date(request.createdAt).getTime() > REQUEST_TTL_MS) return "expired";
  return request.status;
}

/* ───────── Store ───────── */
type Store = {
  configured: boolean;
  authReady: boolean;
  session: Session | null;
  email: string;
  me: Profile | null;
  loading: boolean;
  loadError: string;

  allItems: Item[];
  myListings: Item[];
  favorites: string[];
  /** Requests I sent as a borrower, newest first. */
  requests: BorrowRequest[];
  /** Requests other people sent for my listings, newest first. */
  incoming: BorrowRequest[];
  threads: Thread[];
  activeRequestCount: number;

  findItem: (id: string | undefined) => Item | undefined;
  ownerOf: (item: Item) => Owner;
  person: (id: string) => Owner;
  isMine: (item: Item) => boolean;
  threadFor: (itemId: string, borrowerId: string) => Thread | undefined;

  signUp: (input: { name: string; email: string; password: string; program: string }) => Promise<Result<{ needsConfirmation: boolean }>>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  updateProfile: (input: { name: string; program: string }) => Promise<Result>;
  toggleFavorite: (itemId: string) => Promise<void>;
  saveListing: (input: ListingInput, existingId?: string) => Promise<Result<string>>;
  removeListing: (id: string) => Promise<Result>;
  createRequest: (itemId: string, start: string, end: string) => Promise<Result<string>>;
  setRequestStatus: (id: string, status: "approved" | "declined" | "cancelled") => Promise<Result>;
  openThread: (itemId: string) => Promise<Result<string>>;
  sendMessage: (threadId: string, text: string, kind?: "text" | "system") => Promise<Result>;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [requestRows, setRequestRows] = useState<RequestRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const userId = session?.user.id ?? null;
  const loadedFor = useRef<string | null>(null);

  /* Auth session */
  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession((current) => (current?.access_token === next?.access_token ? current : next));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  /* Load everything this person can see. The data set is small (one campus), so we fetch it all. */
  const refresh = useCallback(async () => {
    if (!userId) return;
    const [p, l, r, c, m, f] = await Promise.all([
      supabase.from("profiles").select("id, name, program"),
      supabase.from("listings").select("*").order("created_at", { ascending: false }),
      supabase.from("requests").select("*").order("created_at", { ascending: false }),
      supabase.from("conversations").select("*").order("updated_at", { ascending: false }),
      supabase.from("messages").select("*").order("created_at", { ascending: true }),
      supabase.from("favorites").select("listing_id"),
    ]);
    const error = p.error || l.error || r.error || c.error || m.error || f.error;
    if (error) {
      setLoadError(friendlyError(error));
      return;
    }
    setLoadError("");
    setProfiles(Object.fromEntries((p.data as Profile[]).map((row) => [row.id, row])));
    setListings(l.data as ListingRow[]);
    setRequestRows(r.data as RequestRow[]);
    setConversations(c.data as ConversationRow[]);
    setMessages(m.data as MessageRow[]);
    setFavorites((f.data as { listing_id: string }[]).map((row) => row.listing_id));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      loadedFor.current = null;
      setProfiles({});
      setListings([]);
      setRequestRows([]);
      setConversations([]);
      setMessages([]);
      setFavorites([]);
      return;
    }
    if (loadedFor.current === userId) return;
    loadedFor.current = userId;
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [userId, refresh]);

  /* Live updates: when anything changes for this person, reload (debounced). */
  useEffect(() => {
    if (!userId) return;
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refresh(), 250);
    };
    const channel = supabase
      .channel(`lendr-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, schedule)
      .subscribe();
    // Fallback for flaky realtime connections: refresh when the tab regains focus, and every 30s.
    const onFocus = () => schedule();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(schedule, 30_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  /* ───────── Derived data ───────── */
  const derived = useMemo(() => {
    const realItems = listings.map(toItem);
    const allItems = [...realItems, ...sampleItems];
    const itemById = new Map(allItems.map((item) => [item.id, item]));
    const myListings = realItems.filter((item) => item.ownerId === userId);
    const myListingIds = new Set(myListings.map((item) => item.id));
    const allRequests = requestRows.map(toRequest);
    const requests = allRequests.filter((request) => request.borrowerId === userId);
    const incoming = allRequests.filter((request) => myListingIds.has(request.itemId));
    const byConversation = new Map<string, ChatMessage[]>();
    for (const row of messages) {
      const list = byConversation.get(row.conversation_id) ?? [];
      list.push({ id: row.id, senderId: row.sender_id, kind: row.kind, text: row.body, at: row.created_at });
      byConversation.set(row.conversation_id, list);
    }
    const threads: Thread[] = conversations
      .filter((row) => itemById.has(row.listing_id))
      .map((row) => ({
        id: row.id,
        itemId: row.listing_id,
        borrowerId: row.borrower_id,
        ownerId: row.owner_id,
        otherId: row.borrower_id === userId ? row.owner_id : row.borrower_id,
        messages: byConversation.get(row.id) ?? [],
        updatedAt: row.updated_at,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const activeRequestCount =
      requests.filter((request) => displayStatus(request) === "pending").length +
      incoming.filter((request) => displayStatus(request) === "pending").length;
    return { allItems, itemById, myListings, requests, incoming, threads, activeRequestCount };
  }, [listings, requestRows, conversations, messages, userId]);

  const person = useCallback(
    (id: string): Owner => {
      if (sampleOwners[id]) return sampleOwners[id];
      const profile = profiles[id];
      return profile ? { id, name: profile.name, program: profile.program } : { id, name: "UCI student" };
    },
    [profiles],
  );

  /* ───────── Actions ───────── */
  const signUp: Store["signUp"] = async ({ name, email, password, program }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim(), program: program.trim() } },
    });
    if (error) return fail(error);
    // Supabase hides "already registered" behind a fake success when email confirmation is on.
    if (data.user && data.user.identities?.length === 0)
      return { ok: false, error: "An account with this email already exists. Log in instead." };
    return { ok: true, value: { needsConfirmation: !data.session } };
  };

  const signIn: Store["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    return error ? fail(error) : { ok: true, value: undefined };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile: Store["updateProfile"] = async ({ name, program }) => {
    if (!userId) return { ok: false, error: "You’re signed out." };
    const { error } = await supabase.from("profiles").update({ name: name.trim(), program: program.trim() }).eq("id", userId);
    if (error) return fail(error);
    await refresh();
    return { ok: true, value: undefined };
  };

  const toggleFavorite = async (itemId: string) => {
    if (!userId) return;
    const saved = favorites.includes(itemId);
    setFavorites((current) => (saved ? current.filter((id) => id !== itemId) : [...current, itemId]));
    const { error } = saved
      ? await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", itemId)
      : await supabase.from("favorites").insert({ listing_id: itemId });
    if (error) setFavorites((current) => (saved ? [...current, itemId] : current.filter((id) => id !== itemId)));
  };

  const uploadPhoto = async (dataUrl: string): Promise<Result<string>> => {
    const blob = await dataUrlToBlob(dataUrl);
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
    if (error) return fail(error);
    return { ok: true, value: supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl };
  };

  const saveListing: Store["saveListing"] = async (input, existingId) => {
    if (!userId) return { ok: false, error: "You’re signed out." };
    let photoUrl: string | null = input.photo || null;
    if (input.photo.startsWith("data:")) {
      const uploaded = await uploadPhoto(input.photo);
      if (!uploaded.ok) return uploaded;
      photoUrl = uploaded.value;
    }
    const row = {
      title: input.title.trim(),
      category: input.category,
      price: input.price,
      coverage: input.coverage,
      description: input.description.trim(),
      pickup: input.pickup.trim() || "UCI Student Center",
      photo_url: photoUrl,
    };
    const query = existingId
      ? supabase.from("listings").update(row).eq("id", existingId).select("id").single()
      : supabase.from("listings").insert(row).select("id").single();
    const { data, error } = await query;
    if (error) return fail(error);
    await refresh();
    return { ok: true, value: (data as { id: string }).id };
  };

  const removeListing: Store["removeListing"] = async (id) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return fail(error);
    setListings((current) => current.filter((row) => row.id !== id));
    await refresh();
    return { ok: true, value: undefined };
  };

  const ensureThread = async (itemId: string): Promise<Result<string>> => {
    const existing = conversations.find((row) => row.listing_id === itemId && row.borrower_id === userId);
    if (existing) return { ok: true, value: existing.id };
    const inserted = await supabase.from("conversations").insert({ listing_id: itemId }).select("id").single();
    if (!inserted.error) return { ok: true, value: (inserted.data as { id: string }).id };
    // Already exists (e.g. created in another tab): look it up.
    const found = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", itemId)
      .eq("borrower_id", userId!)
      .maybeSingle();
    if (found.data) return { ok: true, value: (found.data as { id: string }).id };
    return fail(inserted.error);
  };

  const openThread: Store["openThread"] = async (itemId) => {
    if (!userId) return { ok: false, error: "You’re signed out." };
    const result = await ensureThread(itemId);
    if (result.ok) await refresh();
    return result;
  };

  const sendMessage: Store["sendMessage"] = async (threadId, text, kind = "text") => {
    const body = text.trim();
    if (!body) return { ok: false, error: "Write a message first." };
    const { error } = await supabase.from("messages").insert({ conversation_id: threadId, body, kind });
    if (error) return fail(error);
    await refresh();
    return { ok: true, value: undefined };
  };

  const createRequest: Store["createRequest"] = async (itemId, start, end) => {
    if (!userId) return { ok: false, error: "You’re signed out." };
    const { data, error } = await supabase
      .from("requests")
      .insert({ listing_id: itemId, start_date: start, end_date: end })
      .select("*")
      .single();
    if (error) return fail(error);
    const row = data as RequestRow;
    const item = derived.itemById.get(itemId);
    const thread = await ensureThread(itemId);
    if (thread.ok && item) {
      await supabase.from("messages").insert({
        conversation_id: thread.value,
        kind: "system",
        body: `Requested the ${item.title} for ${formatRange(row.start_date, row.end_date)} · $${row.total} total.`,
      });
    }
    await refresh();
    return { ok: true, value: row.id };
  };

  const setRequestStatus: Store["setRequestStatus"] = async (id, status) => {
    const { error } = await supabase.from("requests").update({ status }).eq("id", id);
    if (error) return fail(error);
    const request = requestRows.find((row) => row.id === id);
    const thread = request && conversations.find((row) => row.listing_id === request.listing_id && row.borrower_id === request.borrower_id);
    if (request && thread) {
      const range = formatRange(request.start_date, request.end_date);
      const note =
        status === "approved"
          ? `Approved the request for ${range}. Coordinate pickup here.`
          : status === "declined"
            ? `Declined the request for ${range}.`
            : `Cancelled the request for ${range}.`;
      await supabase.from("messages").insert({ conversation_id: thread.id, kind: "system", body: note });
    }
    await refresh();
    return { ok: true, value: undefined };
  };

  const me = userId ? profiles[userId] ?? null : null;

  const value: Store = {
    configured: supabaseConfigured,
    authReady,
    session,
    email: session?.user.email ?? "",
    me,
    loading,
    loadError,
    allItems: derived.allItems,
    myListings: derived.myListings,
    favorites,
    requests: derived.requests,
    incoming: derived.incoming,
    threads: derived.threads,
    activeRequestCount: derived.activeRequestCount,
    findItem: (id) => (id ? derived.itemById.get(id) : undefined),
    ownerOf: (item) => person(item.ownerId),
    person,
    isMine: (item) => !item.sample && item.ownerId === userId,
    threadFor: (itemId, borrowerId) =>
      derived.threads.find((thread) => thread.itemId === itemId && thread.borrowerId === borrowerId),
    signUp,
    signIn,
    signOut,
    updateProfile,
    toggleFavorite,
    saveListing,
    removeListing,
    createRequest,
    setRequestStatus,
    openThread,
    sendMessage,
    refresh,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
