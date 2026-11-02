import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { BottomNav, SiteHeader } from "./components";
import Account from "./pages/Account";
import Activity from "./pages/Activity";
import Confirmed from "./pages/Confirmed";
import Detail from "./pages/Detail";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import ListItem from "./pages/ListItem";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Person from "./pages/Person";
import RequestItem from "./pages/RequestItem";
import Safety from "./pages/Safety";
import Welcome from "./pages/Welcome";
import { RecoveryCodeModal } from "./trust";
import { useStore } from "./store";

const TITLES: [RegExp, string][] = [
  [/^\/explore/, "Explore"],
  [/^\/items\/[^/]+\/request/, "Request item"],
  [/^\/items\/[^/]+\/edit/, "Edit listing"],
  [/^\/list/, "List an item"],
  [/^\/items\//, "Item"],
  [/^\/requests\//, "Request sent"],
  [/^\/activity/, "Activity"],
  [/^\/messages/, "Messages"],
  [/^\/account/, "Account"],
  [/^\/people\//, "Profile"],
  [/^\/safety/, "Trust & safety"],
  [/^\/(welcome|login)/, "Join lendr"],
];

function usePageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const title = TITLES.find(([pattern]) => pattern.test(pathname))?.[1];
    document.title = title ? `${title} · lendr` : "lendr — Borrow on campus";
  }, [pathname]);
}

function Splash({ text = "Loading lendr…" }: { text?: string }) {
  return (
    <div className="splash" role="status">
      <span className="brand">
        lendr<span>.</span>
      </span>
      <p>{text}</p>
    </div>
  );
}

function Layout() {
  const { pathname } = useLocation();
  const { loading, loadError, refresh, me } = useStore();
  // Detail, request, and confirmation screens use their own sticky action bar on mobile.
  const focused = /^\/(items|requests)\//.test(pathname);
  const isForm = pathname === "/list" || /\/edit$/.test(pathname);

  return (
    <div className={`site ${focused ? "is-focused" : ""}`}>
      <SiteHeader />
      <main className="site-main">
        {loadError ? (
          <div className="container narrow">
            <div className="empty-state">
              <h3>We couldn’t load lendr</h3>
              <p>{loadError}</p>
              <button className="primary" onClick={() => void refresh()}>
                Try again
              </button>
            </div>
          </div>
        ) : loading || !me ? (
          <Splash text="Loading listings…" />
        ) : (
          <Outlet />
        )}
      </main>
      {!focused && !isForm && <BottomNav />}
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="splash">
      <span className="brand">
        lendr<span>.</span>
      </span>
      <p>The database isn’t connected yet. Add the Supabase URL and publishable key in src/supabase.ts.</p>
    </div>
  );
}

export default function App() {
  const { configured, authReady, session } = useStore();
  const location = useLocation();
  usePageTitle();

  if (!configured) return <NotConfigured />;
  if (!authReady) return <Splash />;

  if (!session) {
    return (
      <Routes>
        <Route path="welcome" element={<Welcome />} />
        <Route path="login" element={<Welcome initialMode="login" />} />
        <Route path="*" element={<Navigate to="/welcome" replace state={{ from: location.pathname + location.search }} />} />
      </Routes>
    );
  }

  const from = (location.state as { from?: string } | null)?.from;

  return (
    <>
    <RecoveryCodeModal />
    <Routes>
      <Route path="welcome" element={<Navigate to={from && from !== "/welcome" ? from : "/"} replace />} />
      <Route path="login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="items/:itemId" element={<Detail />} />
        <Route path="items/:itemId/request" element={<RequestItem />} />
        <Route path="items/:itemId/edit" element={<ListItem />} />
        <Route path="list" element={<ListItem />} />
        <Route path="requests/:requestId" element={<Confirmed />} />
        <Route path="activity" element={<Activity />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:threadId" element={<Messages />} />
        <Route path="account" element={<Account />} />
        <Route path="people/:personId" element={<Person />} />
        <Route path="safety" element={<Safety />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </>
  );
}
