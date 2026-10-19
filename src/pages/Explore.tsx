import { useSearchParams } from "react-router-dom";
import { EmptyState, HeroArt, ItemCard } from "../components";
import { categories, searchItems } from "../data";
import { Icon } from "../Icon";
import { useStore } from "../store";

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const { allItems } = useStore();
  const { matchedCategory, normalized, results } = searchItems(query, allItems);

  const setQuery = (value: string) => setParams(value ? { q: value } : {}, { replace: true });

  return (
    <div className="container explore-page">
      <section className="explore-banner">
        <div>
          <span>UCI CAMPUS MARKETPLACE</span>
          <h1>Find it from an Anteater.</h1>
          <p>Verified listings near Ring Road.</p>
        </div>
        <HeroArt compact />
      </section>

      <form className="search-row explore-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="search-box" htmlFor="explore-search">
          <Icon name="search" />
          <input
            id="explore-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projectors, tools, tents…"
          />
        </label>
        <button className="filter-button" type="submit" aria-label="Search items">
          <Icon name="search" />
        </button>
      </form>

      <div className="filter-chips" aria-label="Item categories">
        <button className={!matchedCategory && !normalized ? "active" : ""} onClick={() => setQuery("")}>
          All
        </button>
        {categories.map((category) => (
          <button
            className={matchedCategory === category.name ? "active" : ""}
            key={category.name}
            onClick={() => setQuery(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="explore-heading">
        <div>
          <span>{matchedCategory ?? (normalized ? `Results for “${query.trim()}”` : "All campus items")}</span>
          <h2>
            {results.length} {results.length === 1 ? "item" : "items"} available
          </h2>
        </div>
        <span>
          <i /> Live near UCI
        </span>
      </div>

      {results.length ? (
        <div className="item-grid">
          {results.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing matches yet"
          body="Try a broader search, like “projector”, “tools”, or “camping”."
          action={{ to: "/explore", label: "Show all items" }}
        />
      )}
    </div>
  );
}
