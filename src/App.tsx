import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { BottomNav, SiteHeader } from "./components";
import Account from "./pages/Account";
import Activity from "./pages/Activity";
import Confirmed from "./pages/Confirmed";
import Detail from "./pages/Detail";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import RequestItem from "./pages/RequestItem";

const TITLES: [RegExp, string][] = [
  [/^\/explore/, "Explore"],
  [/^\/items\/[^/]+\/request/, "Request item"],
  [/^\/items\//, "Item"],
  [/^\/requests\//, "Request sent"],
  [/^\/activity/, "Activity"],
  [/^\/messages/, "Messages"],
  [/^\/account/, "Account"],
];

function Layout() {
  const { pathname } = useLocation();
  // Detail, request, and confirmation screens use their own sticky action bar on mobile.
  const focused = /^\/(items|requests)\//.test(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    const title = TITLES.find(([pattern]) => pattern.test(pathname))?.[1];
    document.title = title ? `${title} · lendr` : "lendr — Borrow on campus";
  }, [pathname]);

  return (
    <div className={`site ${focused ? "is-focused" : ""}`}>
      <SiteHeader />
      <main className="site-main">
        <Outlet />
      </main>
      {!focused && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="items/:itemId" element={<Detail />} />
        <Route path="items/:itemId/request" element={<RequestItem />} />
        <Route path="requests/:requestId" element={<Confirmed />} />
        <Route path="activity" element={<Activity />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:ownerId" element={<Messages />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
