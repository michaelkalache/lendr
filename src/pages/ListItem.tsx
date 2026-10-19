import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { BackLink, ItemCard } from "../components";
import { ME, PICKUP_SPOT, categories, slugify, type Category, type Item } from "../data";
import { Icon } from "../Icon";
import { useStore } from "../store";
import NotFound from "./NotFound";

type Draft = {
  title: string;
  category: Category | "";
  price: string;
  coverage: string;
  description: string;
  pickup: string;
  photo: string;
};

type Errors = Partial<Record<keyof Draft, string>>;

const MAX_PHOTO_EDGE = 1000;

/** Downscale an uploaded photo to a JPEG data URL so it fits comfortably in browser storage. */
function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });
}

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  const price = Number(draft.price);
  const coverage = Number(draft.coverage);
  if (draft.title.trim().length < 3) errors.title = "Give your item a name (at least 3 characters).";
  if (!draft.category) errors.category = "Pick a category.";
  if (!draft.price || !Number.isInteger(price) || price < 1 || price > 100)
    errors.price = "Enter a whole-dollar price from $1 to $100 per day.";
  if (!draft.coverage || !Number.isInteger(coverage) || coverage < 10 || coverage > 5000)
    errors.coverage = "Enter the replacement value, from $10 to $5,000.";
  if (draft.description.trim().length < 15) errors.description = "Describe what’s included (at least 15 characters).";
  return errors;
}

function toItem(draft: Draft, existing?: Item): Item {
  const title = draft.title.trim();
  return {
    id: existing?.id ?? slugify(title),
    title,
    category: (draft.category || "Tools") as Category,
    price: Number(draft.price) || 0,
    coverage: Number(draft.coverage) || 0,
    description: draft.description.trim(),
    pickup: draft.pickup.trim() || PICKUP_SPOT,
    photo: draft.photo,
    alt: title,
    ownerId: ME,
    distance: "On campus",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

export default function ListItem() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { dispatch, findItem } = useStore();
  const existing = itemId ? findItem(itemId) : undefined;
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft>(() => ({
    title: existing?.title ?? "",
    category: existing?.category ?? "",
    price: existing ? String(existing.price) : "",
    coverage: existing ? String(existing.coverage) : "",
    description: existing?.description ?? "",
    pickup: existing?.pickup ?? PICKUP_SPOT,
    photo: existing?.photo ?? "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);

  if (itemId && !existing) return <NotFound />;
  if (existing && existing.ownerId !== ME) return <Navigate to={`/items/${existing.id}`} replace />;

  const set = (key: keyof Draft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDraft((current) => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("That file isn’t an image. Try a JPG or PNG.");
      return;
    }
    setPhotoError("");
    setPhotoBusy(true);
    try {
      const photo = await resizePhoto(file);
      setDraft((current) => ({ ...current, photo }));
    } catch {
      setPhotoError("We couldn’t read that photo. Try a different one.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    const listing = toItem(draft, existing);
    dispatch({ type: "saveListing", listing });
    navigate(`/items/${listing.id}`, { replace: true, state: { published: existing ? "updated" : "new" } });
  };

  const preview = toItem(draft, existing);
  if (!preview.title) preview.title = "Your item";
  if (!draft.category) preview.category = "Tools";

  const field = (key: keyof Draft) => ({
    id: `field-${key}`,
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `error-${key}` : undefined,
  });
  const error = (key: keyof Draft) =>
    errors[key] ? (
      <p className="field-error" id={`error-${key}`}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="container list-page">
      <BackLink to={existing ? `/items/${existing.id}` : "/"} label={existing ? "Back to listing" : "Back to Discover"} />
      <h1 className="page-title">{existing ? "Edit your listing" : "List an item"}</h1>
      <p className="page-lede">
        Lend something you aren’t using. Verified Anteaters request it, and you approve every borrow.
      </p>

      <div className="split">
        <form className="split-main listing-form" onSubmit={submit} noValidate>
          <section className="form-section">
            <h2>Photo</h2>
            <div className={`photo-drop ${draft.photo ? "has-photo" : ""}`}>
              {draft.photo ? (
                <img src={draft.photo} alt="Your item" />
              ) : (
                <div className="photo-empty">
                  <Icon name="camera" size={28} />
                  <b>Add a photo</b>
                  <span>Listings with photos get requested more. JPG or PNG.</span>
                </div>
              )}
              <div className="photo-actions">
                <button type="button" className="secondary" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
                  {photoBusy ? "Processing…" : draft.photo ? "Change photo" : "Upload photo"}
                </button>
                {draft.photo && (
                  <button type="button" className="text-link" onClick={() => setDraft((c) => ({ ...c, photo: "" }))}>
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
            </div>
            {photoError && <p className="field-error">{photoError}</p>}
          </section>

          <section className="form-section">
            <h2>Details</h2>
            <label className="field">
              <span>Item name</span>
              <input {...field("title")} value={draft.title} onChange={set("title")} maxLength={60} placeholder="e.g. Ring light with tripod" />
              {error("title")}
            </label>

            <div className="field">
              <span id="category-label">Category</span>
              <div className="segmented" role="radiogroup" aria-labelledby="category-label" id="field-category" tabIndex={-1}>
                {categories.map((category) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={draft.category === category.name}
                    key={category.name}
                    className={draft.category === category.name ? "active" : ""}
                    onClick={() => {
                      setDraft((c) => ({ ...c, category: category.name }));
                      setErrors((c) => ({ ...c, category: undefined }));
                    }}
                  >
                    <span>{category.symbol}</span>
                    {category.name}
                  </button>
                ))}
              </div>
              {error("category")}
            </div>

            <label className="field">
              <span>What’s included</span>
              <textarea
                {...field("description")}
                value={draft.description}
                onChange={set("description")}
                maxLength={400}
                rows={4}
                placeholder="Condition, accessories, anything a borrower should know."
              />
              <small className="char-count">{draft.description.length}/400</small>
              {error("description")}
            </label>
          </section>

          <section className="form-section">
            <h2>Pricing & protection</h2>
            <div className="field-row">
              <label className="field">
                <span>Price per day</span>
                <div className="money">
                  <b>$</b>
                  <input {...field("price")} inputMode="numeric" value={draft.price} onChange={set("price")} placeholder="6" />
                </div>
                {error("price")}
              </label>
              <label className="field">
                <span>Replacement value</span>
                <div className="money">
                  <b>$</b>
                  <input {...field("coverage")} inputMode="numeric" value={draft.coverage} onChange={set("coverage")} placeholder="200" />
                </div>
                {error("coverage")}
              </label>
            </div>
            <p className="field-hint">
              Weekly borrows are capped at 4 days’ price. Borrowers agree to cover verified damage up to the replacement value.
            </p>
          </section>

          <section className="form-section">
            <h2>Pickup</h2>
            <label className="field">
              <span>Meetup spot</span>
              <input {...field("pickup")} value={draft.pickup} onChange={set("pickup")} maxLength={60} />
            </label>
            <p className="field-hint">Pick a public spot on campus. The exact place is only shared after you approve a request.</p>
          </section>

          <div className="form-submit">
            <button type="submit" className="primary">
              {existing ? "Save changes" : "Publish listing"}
            </button>
          </div>
        </form>

        <aside className="split-aside desktop-only">
          <div className="preview-card">
            <span className="preview-label">PREVIEW</span>
            <div className="preview-inert" inert>
              <ItemCard item={preview} />
            </div>
            <p>This is how your listing appears in Discover.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
