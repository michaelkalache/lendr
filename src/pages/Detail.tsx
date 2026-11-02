import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { BackLink, FavoriteButton } from "../components";
import { bundleSavings, bundlesContaining, firstName, initials, photoSrc, pickupOf } from "../data";
import { Icon } from "../Icon";
import { displayStatus, useStore } from "../store";
import { RatingBadge, ReportButton, ReviewForm, ReviewList } from "../trust";
import NotFound from "./NotFound";

export default function Detail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    findItem,
    ownerOf,
    isMine,
    openThread,
    removeListing,
    allItems,
    reviewsFor,
    itemRating,
    lenderRating,
    requests,
    reviewForRequest,
  } = useStore();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const item = findItem(itemId);
  if (!item) return <NotFound />;
  const owner = ownerOf(item);
  const ownerFirst = firstName(owner.name);
  const mine = isMine(item);
  const justPublished = (location.state as { published?: "new" | "updated" } | null)?.published;
  const reviews = reviewsFor(item.id);
  const rating = itemRating(item.id);
  const ownerRating = owner.sample ? null : lenderRating(owner.id);
  const parts = (item.bundle ?? []).map((id) => findItem(id)).filter((part): part is NonNullable<typeof part> => Boolean(part));
  const savings = item.bundle ? bundleSavings(item, allItems) : null;
  const inBundles = bundlesContaining(item.id, allItems);
  const today = new Date().toISOString().slice(0, 10);
  // A borrow of mine for this item that's approved, has started, and isn't reviewed yet.
  const reviewable = requests.find(
    (request) =>
      request.itemId === item.id &&
      displayStatus(request) === "approved" &&
      request.start <= today &&
      !reviewForRequest(request.id),
  );

  const messageOwner = async () => {
    setBusy(true);
    setError("");
    const result = await openThread(item.id);
    setBusy(false);
    if (result.ok) navigate(`/messages/${result.value}`);
    else setError(result.error);
  };

  const remove = async () => {
    setBusy(true);
    const result = await removeListing(item.id);
    setBusy(false);
    if (result.ok) navigate("/account", { replace: true });
    else setError(result.error);
  };

  const ownerLine = owner.rating
    ? `${owner.rating} · ${owner.lends} completed lends`
    : ownerRating
      ? `${ownerRating.average.toFixed(1)} lender rating from ${ownerRating.count} item ${ownerRating.count === 1 ? "review" : "reviews"}`
      : owner.program
        ? owner.program
        : "UCI student";

  return (
    <div className="container detail-page">
      <div className="desktop-only">
        <BackLink to={mine ? "/account" : "/explore"} label={mine ? "Back to your listings" : "Back to listings"} />
      </div>

      {justPublished && (
        <div className="publish-banner" role="status">
          <Icon name="check" />
          <span>
            <b>{justPublished === "new" ? "Your listing is live." : "Listing updated."}</b> Everyone on lendr can now
            find it in Discover and Explore.
          </span>
        </div>
      )}
      {mine && item.hiddenAt && (
        <div className="hidden-banner" role="status">
          <Icon name="flag" />
          <span>
            <b>This listing is hidden while we review reports.</b> Other students can’t see or request it right now. If
            you think this is a mistake, message the lendr team.
          </span>
        </div>
      )}
      {item.sample && (
        <div className="sample-banner" role="note">
          <Icon name="shield" />
          <span>
            <b>Sample listing.</b> This shows how lendr works. There’s no real lender behind it, so it can’t be
            requested. <Link to="/explore">See real listings</Link>
          </span>
        </div>
      )}

      <div className="split">
        <div className="split-main">
          <div className="detail-photo">
            <img src={photoSrc(item)} alt={item.alt} />
            <button
              className="floating back mobile-only"
              onClick={() => (location.key === "default" ? navigate("/") : navigate(-1))}
              aria-label="Go back"
            >
              <Icon name="arrow" />
            </button>
            {!mine && <FavoriteButton itemId={item.id} className="floating save" />}
          </div>

          <div className="detail-body">
            <div className="status-row">
              <span className="availability">
                <i /> {mine ? (item.hiddenAt ? "Your listing · hidden for review" : "Your listing · live") : item.sample ? "Sample" : "Available"}
              </span>
              <span>
                <Icon name="map" size={16} /> {item.distance}
              </span>
            </div>
            {item.bundle && (
              <span className="bundle-tag">
                <Icon name="layers" size={14} /> Bundle · {parts.length} items
              </span>
            )}
            <h1>{item.title}</h1>
            <div className="price">
              <strong>${item.price}</strong> / day <span>${item.price * 4} max per week</span>
            </div>
            {rating && (
              <a href="#reviews" className="detail-rating">
                <RatingBadge rating={rating} /> {rating.sample ? "sample reviews" : rating.count === 1 ? "review" : "reviews"}
              </a>
            )}

            <Link to={`/people/${owner.id}`} className="owner-card owner-link">
              <div className="avatar">{initials(owner.name)}</div>
              <div>
                <h3>
                  {mine ? `${owner.name} (you)` : owner.name}{" "}
                  {owner.sample ? (
                    <span className="sample-pill">Sample lender</span>
                  ) : (
                    <span>
                      <Icon name="shield" size={15} /> UCI email
                    </span>
                  )}
                </h3>
                <p>
                  {(owner.rating || ownerRating) && <Icon name="star" size={14} filled />} {ownerLine}
                  {owner.sample ? " (sample stats)" : ""}
                </p>
              </div>
              <span className="owner-link-cta">
                {mine ? "Your profile" : "View profile"} <Icon name="chevron" size={16} />
              </span>
            </Link>

            {!mine && !item.sample && (
              <button className="message-owner" onClick={messageOwner} disabled={busy}>
                <Icon name="message" />
                <span>
                  <b>Message {ownerFirst}</b>
                  <small>Ask about availability or the item</small>
                </span>
                <Icon name="chevron" />
              </button>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <section className="details-block">
              <h2>About this {item.bundle ? "bundle" : "item"}</h2>
              <p>{item.description}</p>
            </section>

            {item.bundle && (
              <section className="details-block bundle-block">
                <h2>What’s in this bundle</h2>
                <ul className="bundle-parts">
                  {parts.map((part) => (
                    <li key={part.id}>
                      <Link to={`/items/${part.id}`}>
                        <img src={photoSrc(part)} alt="" />
                        <span>
                          <b>{part.title}</b>
                          <em>${part.price}/day on its own</em>
                        </span>
                        <Icon name="chevron" size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
                {savings && savings.saves > 0 && (
                  <p className="bundle-savings">
                    <Icon name="check" size={16} /> ${item.price}/day together instead of ${savings.separate}/day separately — save $
                    {savings.saves} a day.
                  </p>
                )}
              </section>
            )}

            {inBundles.length > 0 && (
              <div className="in-bundle">
                <Icon name="layers" size={16} />
                <span>
                  Also part of{" "}
                  {inBundles.map((bundle, i) => (
                    <span key={bundle.id}>
                      {i > 0 && ", "}
                      <Link to={`/items/${bundle.id}`}>{bundle.title}</Link>
                    </span>
                  ))}
                  {inBundles.some((bundle) => bundle.sample) && <span className="sample-pill">Sample</span>}
                </span>
              </div>
            )}

            <section className="details-block">
              <h2>Pickup</h2>
              <div className="pickup">
                <span>
                  <Icon name="map" />
                </span>
                <div>
                  <b>{pickupOf(item)}</b>
                  <p>Confirm the exact time and spot in Messages</p>
                </div>
              </div>
            </section>

            <section className="details-block reviews-block" id="reviews">
              <div className="reviews-head">
                <h2>Reviews of this {item.bundle ? "bundle" : "item"}</h2>
                {rating && (
                  <span>
                    <RatingBadge rating={rating} />
                    {rating.sample && <span className="sample-pill">Sample</span>}
                  </span>
                )}
              </div>
              {reviewable && (
                <div className="review-prompt">
                  <ReviewForm requestId={reviewable.id} itemTitle={item.title} />
                </div>
              )}
              {reviews.length ? (
                <>
                  {rating?.sample && (
                    <p className="field-hint">These are example reviews that show how item reviews look. They aren’t from real borrowers.</p>
                  )}
                  <ReviewList reviews={reviews} />
                </>
              ) : (
                <p className="muted-line">
                  No reviews yet. Students who borrow this {item.bundle ? "bundle" : "item"} can rate it after their borrow
                  starts.
                </p>
              )}
            </section>

            <section className="damage-policy">
              <div className="policy-title">
                <span>
                  <Icon name="shield" />
                </span>
                <div>
                  <h2>If something gets damaged</h2>
                  <p>Clear responsibility, with a fair review.</p>
                </div>
              </div>
              <ol>
                <li>
                  <b>Document it.</b> Both students share pickup and return photos in the chat.
                </li>
                <li>
                  <b>Lendr reviews.</b> Report within 24 hours; we compare photos and messages.
                </li>
                <li>
                  <b>Borrower is responsible</b> for verified damage beyond normal wear, up to the agreed repair or
                  replacement value.
                </li>
              </ol>
              <p className="policy-limit">
                Coverage limit for this {item.bundle ? "bundle" : "item"}: <b>${item.coverage}</b>
              </p>
            </section>

            {!mine && !item.sample && (
              <div className="report-row">
                <ReportButton target={{ listingId: item.id }} name={item.title} />
                <Link to="/safety" className="text-link small">
                  How we keep lendr safe
                </Link>
              </div>
            )}
          </div>
        </div>

        <aside className="split-aside">
          {mine ? (
            <div className="action-card">
              <div className="desktop-only action-card-head">
                <div className="price">
                  <strong>${item.price}</strong> / day
                </div>
                <p>This is your listing. Requests show up in Activity → Lending.</p>
              </div>
              {confirmRemove ? (
                <div className="remove-confirm">
                  <p>Remove this listing? Any open requests for it are closed too.</p>
                  <div>
                    <button className="secondary" onClick={() => setConfirmRemove(false)}>
                      Keep it
                    </button>
                    <button className="primary danger" onClick={remove} disabled={busy}>
                      {busy ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="owner-actions">
                  <button className="secondary" onClick={() => setConfirmRemove(true)}>
                    Remove
                  </button>
                  <Link className="primary link-button" to={`/items/${item.id}/edit`}>
                    Edit listing
                  </Link>
                </div>
              )}
            </div>
          ) : item.sample ? (
            <div className="action-card">
              <div className="desktop-only action-card-head">
                <div className="price">
                  <strong>${item.price}</strong> / day
                </div>
                <p>Sample listings can’t be borrowed.</p>
              </div>
              <Link className="primary link-button" to="/list">
                List a real item like this
              </Link>
              <p className="action-note">Real listings from Anteaters appear first in Discover.</p>
            </div>
          ) : (
            <div className="action-card">
              <div className="desktop-only action-card-head">
                <div className="price">
                  <strong>${item.price}</strong> / day
                </div>
                <p>{ownerFirst} has 2 hours to approve or decline your request.</p>
              </div>
              <Link className="primary link-button" to={`/items/${item.id}/request`}>
                Check dates & request
              </Link>
              <p className="action-note">Pay {ownerFirst} at pickup. Nothing is charged online.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
