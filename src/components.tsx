import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { currentUser, getOwner, initials, type Item } from "./data";
import { Icon } from "./Icon";
import { useStore } from "./store";

export function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const urlQuery = location.pathname === "/explore" ? params.get("q") ?? "" : "";
  const [query, setQuery] = useState(urlQuery);
  const { activeRequestCount } = useStore();

  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/explore${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand-lockup" aria-label="lendr home">
          <span className="brand">
            lendr<span>.</span>
          </span>
          <span className="uci-mark">UCI</span>
        </Link>

        <form className="search-box header-search" role="search" onSubmit={submit}>
          <Icon name="search" />
          <input
            aria-label="Search items"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projectors, tools, tents…"
          />
        </form>

        <nav className="header-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => (isActive || location.pathname === "/explore" ? "active" : "")}>
            Discover
          </NavLink>
          <NavLink to="/activity">Activity</NavLink>
          <NavLink to="/messages">Messages</NavLink>
        </nav>

        <div className="header-actions">
          <Link
            to="/activity"
            className={`icon-button ${activeRequestCount ? "has-dot" : ""}`}
            aria-label={activeRequestCount ? `${activeRequestCount} updates in Activity` : "Activity"}
          >
            <Icon name="bell" />
          </Link>
          <Link to="/account" className="header-avatar" aria-label="Your account">
            {currentUser.initials}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const location = useLocation();
  const discover = location.pathname === "/" || location.pathname.startsWith("/explore");
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <NavLink to="/" className={discover ? "active" : ""}>
        <Icon name="home" filled={discover} />
        <span>Discover</span>
      </NavLink>
      <NavLink to="/activity">
        {({ isActive }) => (
          <>
            <Icon name="inbox" filled={isActive} />
            <span>Activity</span>
          </>
        )}
      </NavLink>
      <NavLink to="/messages">
        {({ isActive }) => (
          <>
            <Icon name="message" filled={isActive} />
            <span>Messages</span>
          </>
        )}
      </NavLink>
      <NavLink to="/account">
        {({ isActive }) => (
          <>
            <Icon name="profile" filled={isActive} />
            <span>Account</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="back-link">
      <Icon name="arrow" size={18} />
      {label}
    </Link>
  );
}

/** Decorative hero illustration: three listing tiles stacked like cards on a table. */
export function HeroArt({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`hero-art ${compact ? "compact" : ""}`} aria-hidden="true">
      <div className="hero-tile tile-a">
        <span>▱</span>
        <b>$8</b>
        <small>/ day</small>
      </div>
      <div className="hero-tile tile-b">
        <span>△</span>
        <b>$6</b>
        <small>/ day</small>
      </div>
      <div className="hero-tile tile-c">
        <span>⌁</span>
        <b>$5</b>
        <small>/ day</small>
      </div>
    </div>
  );
}

export function FavoriteButton({ itemId, className = "favorite" }: { itemId: string; className?: string }) {
  const { favorites, dispatch } = useStore();
  const saved = favorites.includes(itemId);
  return (
    <button
      type="button"
      className={`${className} ${saved ? "saved" : ""}`}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save item"}
      onClick={() => dispatch({ type: "toggleFavorite", itemId })}
    >
      <Icon name="heart" size={17} filled={saved} />
    </button>
  );
}

export function ItemCard({ item }: { item: Item }) {
  const owner = getOwner(item.ownerId);
  return (
    <article className="item-card">
      <Link to={`/items/${item.id}`} className="item-link">
        <div className="item-image">
          <img src={item.photo} alt={item.alt} loading="lazy" />
          <span className="distance">{item.distance}</span>
        </div>
        <div className="item-info">
          <span className="availability">
            <i /> Available
          </span>
          <h3>{item.title}</h3>
          <p>
            <strong>${item.price}</strong> / day
          </p>
          <div className="item-owner">
            <span>{initials(owner.name)}</span>
            <p>
              {owner.name}
              <b>
                <Icon name="star" size={12} filled /> {owner.rating}
              </b>
            </p>
          </div>
        </div>
      </Link>
      <FavoriteButton itemId={item.id} />
    </article>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: { to: string; label: string } }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {action && (
        <Link className="primary link-button" to={action.to}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
