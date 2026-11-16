import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { categoryInfo } from "./categories";
import { bundleSavings, initials, photoSrc, type Item } from "./data";
import { Icon } from "./Icon";
import { useStore } from "./store";

export function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const urlQuery = location.pathname === "/explore" ? params.get("q") ?? "" : "";
  const [query, setQuery] = useState(urlQuery);
  const { activeRequestCount, me } = useStore();

  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/explore${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand-lockup" aria-label="lendr home">
          <AnteaterMark className="brand-anteater" />
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
          <NavLink to="/help">Help</NavLink>
        </nav>

        <div className="header-actions">
          <Link to="/list" className="list-button" aria-label="List an item">
            <Icon name="plus" size={18} />
            <span>List an item</span>
          </Link>
          <Link to="/help" className="icon-button help-button" aria-label="Help: how lendr works">
            <Icon name="help" />
          </Link>
          <Link
            to="/activity"
            className={`icon-button ${activeRequestCount ? "has-dot" : ""}`}
            aria-label={activeRequestCount ? `${activeRequestCount} updates in Activity` : "Activity"}
          >
            <Icon name="bell" />
          </Link>
          <Link to="/account" className="header-avatar" aria-label="Your account">
            {initials(me?.name ?? "")}
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

/**
 * lendr's anteater mark: an original drawing (not UCI's logo or mascot artwork), navy with a gold shoulder band.
 */
export function AnteaterMark({
  className = "",
  color = "var(--navy)",
  accent = "var(--gold)",
  title,
}: {
  className?: string;
  color?: string;
  accent?: string;
  title?: string;
}) {
  return (
    <svg
      className={`anteater-mark ${className}`}
      viewBox="0 0 64 36"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g fill={color}>
        <path d="M19 15C13 9 6 9 1.5 12.5c4 .8 6.5 4 7.5 8.5.8 3.6 3.6 5.6 8.5 5Z" />
        <path d="M14 21c0-6.5 6.5-10 15-10 7.5 0 12.5 2.4 16.5 5.4L62 23.6c.9.5.7 1.4-.3 1.4L46 25.4C43 28.8 37.5 30 30 30c-10 0-16-2.6-16-9Z" />
        <rect x="17" y="25" width="5.2" height="9" rx="2.6" />
        <rect x="24" y="26" width="5" height="8" rx="2.5" />
        <rect x="32.5" y="26" width="5" height="8" rx="2.5" />
        <rect x="39" y="25" width="5.2" height="9" rx="2.6" />
      </g>
      <path d="M33 11.4c3.2 2.6 5.2 8 4.6 14.6" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="47.6" cy="19.6" r="1.25" fill={accent} />
    </svg>
  );
}

/** A category's line icon. */
export function CategoryIcon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg
      className="category-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: categoryInfo(name).icon }}
    />
  );
}

/* ───────── Grid density (remembered per browser) ───────── */
export type GridDensity = { wide: number; phone: number };
const GRID_KEY = "lendr.grid";
export const WIDE_COLUMNS = [2, 3, 4, 5];
export const PHONE_COLUMNS = [1, 2];
const DEFAULT_GRID: GridDensity = { wide: 3, phone: 2 };
let gridState: GridDensity = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(GRID_KEY) ?? "null");
    if (saved && WIDE_COLUMNS.includes(saved.wide) && PHONE_COLUMNS.includes(saved.phone)) return saved as GridDensity;
  } catch {
    /* storage unavailable: use the default */
  }
  return DEFAULT_GRID;
})();
const gridListeners = new Set<() => void>();
function setGrid(next: Partial<GridDensity>) {
  gridState = { ...gridState, ...next };
  try {
    localStorage.setItem(GRID_KEY, JSON.stringify(gridState));
  } catch {
    /* fine: it just won't be remembered */
  }
  gridListeners.forEach((listener) => listener());
}
export function useGridDensity() {
  return useSyncExternalStore(
    (listener) => {
      gridListeners.add(listener);
      return () => gridListeners.delete(listener);
    },
    () => gridState,
  );
}
/** Class names for an .item-grid that follows the chosen density. */
export function useGridClass() {
  const grid = useGridDensity();
  return `item-grid cols-${grid.wide} phone-cols-${grid.phone}`;
}

function GridGlyph({ columns }: { columns: number }) {
  const gap = 1.5;
  const width = (16 - gap * (columns - 1)) / columns;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {Array.from({ length: columns }, (_, i) => (
        <g key={i}>
          <rect x={i * (width + gap)} y="0" width={width} height="7" rx="1.2" fill="currentColor" />
          <rect x={i * (width + gap)} y="9" width={width} height="7" rx="1.2" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/** "Grid: 2 3 4 5" picker. Phones get 1 or 2 across; bigger screens 2–5. */
export function GridPicker() {
  const grid = useGridDensity();
  const group = (key: keyof GridDensity, options: number[], className: string) => (
    <div className={`grid-picker ${className}`} role="radiogroup" aria-label="Items per row">
      {options.map((columns) => (
        <button
          key={columns}
          type="button"
          role="radio"
          aria-checked={grid[key] === columns}
          aria-label={`${columns} per row`}
          title={`${columns} per row`}
          className={grid[key] === columns ? "active" : ""}
          onClick={() => setGrid({ [key]: columns })}
        >
          <GridGlyph columns={columns} />
          <span>{columns}</span>
        </button>
      ))}
    </div>
  );
  return (
    <>
      {group("phone", PHONE_COLUMNS, "phone-only")}
      {group("wide", WIDE_COLUMNS, "wide-only")}
    </>
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
        <span>
          <CategoryIcon name="Projectors" size={28} />
        </span>
        <b>$8</b>
        <small>/ day</small>
      </div>
      <div className="hero-tile tile-b">
        <span>
          <CategoryIcon name="Outdoors" size={28} />
        </span>
        <b>$6</b>
        <small>/ day</small>
      </div>
      <div className="hero-tile tile-c">
        <span>
          <CategoryIcon name="Tools" size={28} />
        </span>
        <b>$5</b>
        <small>/ day</small>
      </div>
      <AnteaterMark className="hero-anteater" color="#fff" />
    </div>
  );
}

export function FavoriteButton({ itemId, className = "favorite" }: { itemId: string; className?: string }) {
  const { favorites, toggleFavorite } = useStore();
  const saved = favorites.includes(itemId);
  return (
    <button
      type="button"
      className={`${className} ${saved ? "saved" : ""}`}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save item"}
      onClick={() => void toggleFavorite(itemId)}
    >
      <Icon name="heart" size={17} filled={saved} />
    </button>
  );
}

export function ItemCard({ item }: { item: Item }) {
  const { ownerOf, isMine, itemRating, allItems } = useStore();
  const owner = ownerOf(item);
  const mine = isMine(item);
  const rating = itemRating(item.id);
  const savings = item.bundle ? bundleSavings(item, allItems) : null;
  return (
    <article className="item-card">
      <Link to={`/items/${item.id}`} className="item-link">
        <div className="item-image">
          <img src={photoSrc(item)} alt={item.alt} loading="lazy" />
          <span className="distance">{item.distance}</span>
          {item.sample && <span className="sample-tag">Sample</span>}
          {mine && <span className="sample-tag mine-tag">{item.hiddenAt ? "Hidden" : "Yours"}</span>}
          {item.bundle && (
            <span className="bundle-chip">
              <Icon name="layers" size={12} /> Bundle · {item.bundle.length}
            </span>
          )}
          {savings && savings.percent > 0 && <span className="save-chip">Save {savings.percent}%</span>}
        </div>
        <div className="item-info">
          <span className="availability">
            <i /> Available
          </span>
          <h3>{item.title}</h3>
          <p className="item-price-row">
            <span>
              <strong>${item.price}</strong> / day
              {savings && savings.saves > 0 && (
                <s className="was-price" aria-label={`$${savings.separate} a day separately`}>
                  ${savings.separate}
                </s>
              )}
            </span>
            {rating && (
              <span
                className="item-rating"
                aria-label={`Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} ${rating.count === 1 ? "review" : "reviews"}`}
              >
                <Icon name="star" size={12} filled /> {rating.average.toFixed(1)}
                <small>/5.0</small> <em>({rating.count})</em>
              </span>
            )}
          </p>
          <div className="item-owner">
            <span>{initials(owner.name)}</span>
            <p>{mine ? "You" : owner.name}</p>
          </div>
        </div>
      </Link>
      {!mine && <FavoriteButton itemId={item.id} />}
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
