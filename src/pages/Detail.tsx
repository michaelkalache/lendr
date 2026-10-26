import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { BackLink, FavoriteButton } from "../components";
import { firstName, initials, photoSrc, pickupOf } from "../data";
import { Icon } from "../Icon";
import { useStore } from "../store";
import NotFound from "./NotFound";

export default function Detail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { findItem, ownerOf, isMine, openThread, removeListing } = useStore();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const item = findItem(itemId);
  if (!item) return <NotFound />;
  const owner = ownerOf(item);
  const ownerFirst = firstName(owner.name);
  const mine = isMine(item);
  const justPublished = (location.state as { published?: "new" | "updated" } | null)?.published;

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
                <i /> {mine ? "Your listing · live" : item.sample ? "Sample" : "Available"}
              </span>
              <span>
                <Icon name="map" size={16} /> {item.distance}
              </span>
            </div>
            <h1>{item.title}</h1>
            <div className="price">
              <strong>${item.price}</strong> / day <span>${item.price * 4} max per week</span>
            </div>

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
                  {owner.rating && <Icon name="star" size={14} filled />} {ownerLine}
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
              <h2>About this item</h2>
              <p>{item.description}</p>
            </section>

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
                Coverage limit for this item: <b>${item.coverage}</b>
              </p>
            </section>
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
