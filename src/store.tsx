import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { firstName, getOwner, items, type Item } from "./data";
import { formatRange } from "./dates";

export const REQUEST_TTL_MS = 2 * 60 * 60 * 1000;

export type RequestStatus = "pending" | "approved" | "declined" | "cancelled";

export type BorrowRequest = {
  id: string;
  itemId: string;
  start: string;
  end: string;
  days: number;
  total: number;
  status: RequestStatus;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  from: "me" | "them" | "system";
  text: string;
  at: string;
};

export type Thread = {
  ownerId: string;
  itemId: string;
  messages: ChatMessage[];
  updatedAt: string;
};

export type IncomingStatus = "pending" | "accepted" | "declined";

type State = {
  version: 1;
  favorites: string[];
  requests: BorrowRequest[];
  threads: Record<string, Thread>;
  incoming: IncomingStatus;
  /** Listings created by the current user, newest first. */
  listings: Item[];
};

type Action =
  | { type: "toggleFavorite"; itemId: string }
  | { type: "createRequest"; request: BorrowRequest }
  | { type: "cancelRequest"; id: string }
  | { type: "openThread"; ownerId: string; itemId: string }
  | { type: "sendMessage"; ownerId: string; text: string }
  | { type: "setIncoming"; status: IncomingStatus }
  | { type: "saveListing"; listing: Item }
  | { type: "removeListing"; id: string }
  | { type: "reset" };

const STORAGE_KEY = "lendr:v1";

export const makeId = () => Math.random().toString(36).slice(2, 10);

function seedState(): State {
  const now = Date.now();
  const at = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  const projector = items[0];
  return {
    version: 1,
    favorites: [],
    requests: [],
    incoming: "pending",
    listings: [],
    threads: {
      [projector.ownerId]: {
        ownerId: projector.ownerId,
        itemId: projector.id,
        updatedAt: at(4),
        messages: [
          { id: makeId(), from: "them", at: at(12), text: "Hi Maya! It’s available this weekend. What are you planning to use it for?" },
          { id: makeId(), from: "me", at: at(8), text: "It’s for a student club activity. Is everything shown included?" },
          { id: makeId(), from: "them", at: at(4), text: "Yes, everything listed is included. I can meet at the Student Center after 2 PM." },
        ],
      },
    },
  };
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed && parsed.version === 1) return { ...parsed, listings: parsed.listings ?? [] };
    }
  } catch {
    // Storage unavailable or corrupted: fall back to a fresh demo state.
  }
  return seedState();
}

function ensureThread(state: State, ownerId: string, itemId: string): Thread {
  return (
    state.threads[ownerId] ?? {
      ownerId,
      itemId,
      messages: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "toggleFavorite": {
      const has = state.favorites.includes(action.itemId);
      return {
        ...state,
        favorites: has ? state.favorites.filter((id) => id !== action.itemId) : [...state.favorites, action.itemId],
      };
    }
    case "createRequest": {
      const { request } = action;
      const item = [...state.listings, ...items].find((entry) => entry.id === request.itemId)!;
      const owner = getOwner(item.ownerId);
      const thread = ensureThread(state, owner.id, item.id);
      const note: ChatMessage = {
        id: makeId(),
        from: "system",
        at: request.createdAt,
        text: `You requested the ${item.title} for ${formatRange(request.start, request.end)} · $${request.total} total. ${firstName(owner.name)} has been notified.`,
      };
      return {
        ...state,
        requests: [request, ...state.requests],
        threads: {
          ...state.threads,
          [owner.id]: { ...thread, itemId: item.id, messages: [...thread.messages, note], updatedAt: request.createdAt },
        },
      };
    }
    case "cancelRequest":
      return {
        ...state,
        requests: state.requests.map((request) =>
          request.id === action.id ? { ...request, status: "cancelled" } : request,
        ),
      };
    case "openThread": {
      if (state.threads[action.ownerId]) {
        return {
          ...state,
          threads: { ...state.threads, [action.ownerId]: { ...state.threads[action.ownerId], itemId: action.itemId } },
        };
      }
      return {
        ...state,
        threads: { ...state.threads, [action.ownerId]: ensureThread(state, action.ownerId, action.itemId) },
      };
    }
    case "sendMessage": {
      const thread = state.threads[action.ownerId];
      if (!thread) return state;
      const at = new Date().toISOString();
      const message: ChatMessage = { id: makeId(), from: "me", text: action.text, at };
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.ownerId]: { ...thread, messages: [...thread.messages, message], updatedAt: at },
        },
      };
    }
    case "setIncoming":
      return { ...state, incoming: action.status };
    case "saveListing": {
      const exists = state.listings.some((listing) => listing.id === action.listing.id);
      return {
        ...state,
        listings: exists
          ? state.listings.map((listing) => (listing.id === action.listing.id ? action.listing : listing))
          : [action.listing, ...state.listings],
      };
    }
    case "removeListing":
      return {
        ...state,
        listings: state.listings.filter((listing) => listing.id !== action.id),
        favorites: state.favorites.filter((id) => id !== action.id),
      };
    case "reset":
      return seedState();
  }
}

/** A pending request that hasn't been answered within 2 hours is treated as expired. */
export type DisplayStatus = RequestStatus | "expired";

export function displayStatus(request: BorrowRequest, now = Date.now()): DisplayStatus {
  if (request.status === "pending" && now - new Date(request.createdAt).getTime() > REQUEST_TTL_MS) return "expired";
  return request.status;
}

type Store = State & {
  dispatch: (action: Action) => void;
  activeRequestCount: number;
  /** Your listings followed by the built-in campus listings. */
  allItems: Item[];
  findItem: (id: string | undefined) => Item | undefined;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures (private mode, quota): the app still works for this visit.
    }
  }, [state]);

  const value = useMemo<Store>(() => {
    const allItems = [...state.listings, ...items];
    return {
      ...state,
      dispatch,
      allItems,
      findItem: (id: string | undefined) => allItems.find((item) => item.id === id),
      activeRequestCount:
        state.requests.filter((request) => displayStatus(request) === "pending").length +
        (state.incoming === "pending" ? 1 : 0),
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
