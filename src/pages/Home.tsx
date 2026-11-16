import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { categories } from "../categories";
import { CategoryIcon, GridPicker, HeroArt, ItemCard, useGridClass } from "../components";
import { firstName, photoSrc } from "../data";
import { formatRange } from "../dates";
import { Icon } from "../Icon";
import { spotName } from "../spots";
import { displayStatus, isOverdue, stageOf, turnOf, useStore, type BorrowRequest } from "../store";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { requests, incoming, allItems, findItem, ownerOf, person, me, myListings, hasRecoveryCode, makeRecoveryCode, reviewForRequest } =
    useStore();
  const gridClass = useGridClass();
  const bundles = allItems.filter((item) => item.bundle);
  const pending = requests.find((request) => displayStatus(request) === "pending");
  const pendingItem = pending ? findItem(pending.itemId) : undefined;

  // The most useful next step, if anything is waiting on me.
  const todo = (() => {
    const pick = (request: BorrowRequest | undefined, label: string, text: (title: string) => string) => {
      const item = request && findItem(request.itemId);
      return request && item ? { request, item, label, text: text(item.title) } : null;
    };
    const lend = incoming.find((request) => turnOf(request) === "lender");
    const borrow = requests.find((request) => turnOf(request) === "borrower");
    const rate = requests.find((request) => request.status === "completed" && !reviewForRequest(request.id));
    if (borrow) {
      const stage = stageOf(borrow);
      return stage === "ready"
        ? pick(borrow, "READY FOR PICKUP", (title) => `${title} · at ${spotName(borrow.pickupSpot)}`)
        : pick(borrow, isOverdue(borrow) ? "OVERDUE · RETURN IT" : "RETURN WHEN DONE", (title) => `${title} · to ${spotName(borrow.returnSpot)}`);
    }
    if (lend) {
      const stage = stageOf(lend);
      const who = firstName(person(lend.borrowerId).name);
      return stage === "pending"
        ? pick(lend, "NEW REQUEST", (title) => `${who} wants your ${title}`)
        : stage === "approved"
          ? pick(lend, "DROP IT OFF", (title) => `${title} · at ${spotName(lend.pickupSpot)}`)
          : pick(lend, "CONFIRM IT’S BACK", (title) => `${who} returned your ${title}`);
    }
    if (rate) return pick(rate, "HOW WAS IT?", (title) => `Rate the ${title}`);
    return null;
  })();

  const explore = (value: string) =>
    navigate(`/explore${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`);

  return (
    <div className="container home-page">
      <section className="uci-hero">
        <div className="uci-hero-copy">
          <div className="campus-pill">
            <Icon name="shield" size={15} /> UCI students only
          </div>
          <div className="eyebrow">
            {greeting()}, {firstName(me?.name ?? "").toUpperCase()}
          </div>
          <h1>
            Borrow on campus.
            <br />
            Keep creating.
          </h1>
          <p>Anteaters sharing with Anteaters.</p>
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

      {todo && (
        <Link to="/activity" className="pending-strip todo-strip">
          <img src={photoSrc(todo.item)} alt="" />
          <span>
            <small>{todo.label}</small>
            <b>{todo.text}</b>
            <em>Open Activity to take the next step</em>
          </span>
          <Icon name="chevron" />
        </Link>
      )}

      {!todo && pending && pendingItem && (
        <Link to="/activity" className="pending-strip">
          <img src={photoSrc(pendingItem)} alt="" />
          <span>
            <small>REQUEST PENDING</small>
            <b>
              {pendingItem.title} · {formatRange(pending.start, pending.end)}
            </b>
            <em>Waiting for {firstName(ownerOf(pendingItem).name)} to respond</em>
          </span>
          <Icon name="chevron" />
        </Link>
      )}

      {hasRecoveryCode === false && (
        <div className="recovery-warning home-recovery">
          <Icon name="key" />
          <span>
            <b>Set up password recovery.</b> Get a one-time code so you can reset your password if you forget it.
          </span>
          <button className="secondary" onClick={() => void makeRecoveryCode()}>
            Get my code
          </button>
        </div>
      )}

      <section className="home-section">
        <div className="section-title">
          <h2>Browse by category</h2>
          <Link to="/explore" className="text-link">
            See all
          </Link>
        </div>
        <div className="categories">
          {categories.map((category) => (
            <button key={category.name} className="category" onClick={() => explore(category.name)}>
              <span>
                <CategoryIcon name={category.name} size={26} />
              </span>
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
          <b>{myListings.length ? "Lend something else?" : "Have something sitting unused?"}</b>
          <em>List it in a minute and earn from fellow Anteaters.</em>
        </span>
        <Icon name="chevron" />
      </Link>

      {bundles.length > 0 && (
        <section className="home-section">
          <div className="section-title">
            <div>
              <h2>Bundles</h2>
              <p>Borrow a set together for less · samples for now</p>
            </div>
          </div>
          <div className={gridClass}>
            {bundles.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <div className="section-title">
          <div>
            <h2>Available near you</h2>
            <p>Newest first · samples are marked</p>
          </div>
          <div className="section-tools">
            <GridPicker />
            <Link to="/explore" className="text-link">
              See all
            </Link>
          </div>
        </div>
        <div className={gridClass}>
          {allItems.filter((item) => !item.bundle).map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
