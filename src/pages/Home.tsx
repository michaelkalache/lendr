import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeroArt, ItemCard } from "../components";
import { categories, firstName, getOwner, photoSrc } from "../data";
import { formatRange } from "../dates";
import { Icon } from "../Icon";
import { displayStatus, useStore } from "../store";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { requests, allItems, findItem } = useStore();
  const pending = requests.find((request) => displayStatus(request) === "pending");
  const pendingItem = pending ? findItem(pending.itemId) : undefined;

  const explore = (value: string) =>
    navigate(`/explore${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`);

  return (
    <div className="container home-page">
      <section className="uci-hero">
        <div className="uci-hero-copy">
          <div className="campus-pill">
            <Icon name="shield" size={15} /> UCI students only
          </div>
          <div className="eyebrow">{greeting()}, MAYA</div>
          <h1>
            Borrow on campus.
            <br />
            Keep creating.
          </h1>
          <p>Verified Anteaters sharing with Anteaters.</p>
          <form
            className="search-row hero-search"
            onSubmit={(event) => {
              event.preventDefault();
              explore(query);
            }}
          >
            <label className="search-box" htmlFor="home-search">
              <Icon name="search" />
              <input
                id="home-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search items nearby"
              />
            </label>
            <button className="filter-button" type="submit" aria-label="Search items">
              <Icon name="search" />
            </button>
          </form>
        </div>
        <HeroArt />
      </section>

      {pending && pendingItem && (
        <Link to="/activity" className="pending-strip">
          <img src={photoSrc(pendingItem)} alt="" />
          <span>
            <small>REQUEST PENDING</small>
            <b>
              {pendingItem.title} · {formatRange(pending.start, pending.end)}
            </b>
            <em>Waiting for {firstName(getOwner(pendingItem.ownerId).name)} to respond</em>
          </span>
          <Icon name="chevron" />
        </Link>
      )}

      <section className="home-section">
        <div className="section-title">
          <h2>Popular on campus</h2>
        </div>
        <div className="categories">
          {categories.map((category) => (
            <button key={category.name} className="category" onClick={() => explore(category.name)}>
              <span>{category.symbol}</span>
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <Link to="/list" className="lend-cta">
        <span className="lend-cta-icon">
          <Icon name="plus" size={22} />
        </span>
        <span>
          <b>Have something sitting unused?</b>
          <em>List it in a minute and earn from fellow Anteaters.</em>
        </span>
        <Icon name="chevron" />
      </Link>

      <section className="home-section">
        <div className="section-title">
          <div>
            <h2>Available near you</h2>
            <p>Live listings within 2 miles</p>
          </div>
          <Link to="/explore" className="text-link">
            See all
          </Link>
        </div>
        <div className="item-grid">
          {allItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
