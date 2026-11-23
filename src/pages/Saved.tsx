import { useState } from "react";
import { EmptyState, GridPicker, ItemCard, useGridClass } from "../components";
import type { Item } from "../data";
import { useStore } from "../store";

type Sort = "recent" | "price";

/** Every item you've hearted, newest first. */
export default function Saved() {
  const { favorites, findItem } = useStore();
  const gridClass = useGridClass();
  const [sort, setSort] = useState<Sort>("recent");

  // favorites is newest-first; keep that order unless sorting by price.
  const saved = favorites.map((id) => findItem(id)).filter((item): item is Item => Boolean(item));
  const gone = favorites.length - saved.length;
  const shown = sort === "price" ? [...saved].sort((a, b) => a.price - b.price) : saved;

  return (
    <div className="container saved-page">
      <div className="saved-heading">
        <div>
          <h1 className="page-title">Saved</h1>
          <p className="saved-sub">
            {saved.length
              ? `${saved.length} ${saved.length === 1 ? "item" : "items"} · tap the heart again to remove one`
              : "Tap the heart on any listing to keep it here."}
          </p>
        </div>
        {saved.length > 0 && (
          <div className="section-tools">
            {saved.length > 1 && (
              <div className="sort-toggle" role="radiogroup" aria-label="Sort saved items">
                {(
                  [
                    ["recent", "Recently saved"],
                    ["price", "Lowest price"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={sort === value}
                    className={sort === value ? "active" : ""}
                    onClick={() => setSort(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <GridPicker />
          </div>
        )}
      </div>

      {gone > 0 && (
        <p className="muted-line saved-gone">
          {gone === 1 ? "1 item you saved is" : `${gone} items you saved are`} no longer listed.
        </p>
      )}

      {saved.length ? (
        <div className={gridClass}>
          {shown.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing saved yet"
          body="See something you might borrow later? Tap the heart on its card or item page and it’ll show up here."
          action={{ to: "/explore", label: "Browse listings" }}
        />
      )}
    </div>
  );
}
