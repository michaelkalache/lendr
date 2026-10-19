import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { BackLink, FavoriteButton } from "../components";
import { ME, firstName, getOwner, initials, photoSrc, pickupOf } from "../data";
import { Icon } from "../Icon";
import { useStore } from "../store";
import NotFound from "./NotFound";

export default function Detail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch, findItem } = useStore();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const item = findItem(itemId);
  if (!item) return <NotFound />;
  const owner = getOwner(item.ownerId);
  const ownerFirst = firstName(owner.name);
  const isMine = item.ownerId === ME;
  const justPublished = (location.state as { published?: "new" | "updated" } | null)?.published;

  const messageOwner = () => {
    dispatch({ type: "openThread", ownerId: owner.id, itemId: item.id });
    navigate(`/messages/${owner.id}`);
  };

  const remove = () => {
    dispatch({ type: "removeListing", id: item.id });
    navigate("/account", { replace: true });
  };

  return (
    <div className="container detail-page">
      <div className="desktop-only">
        <BackLink to={isMine ? "/account" : "/explore"} label={isMine ? "Back to your listings" : "Back to listings"} />
      </div>

      {justPublished && (
        <div className="publish-banner" role="status">
          <Icon name="check" />
          <span>
            <b>{justPublished === "new" ? "Your listing is live." : "Listing updated."}</b> Anteaters can now find it in
            Discover and Explore.
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
            {!isMine && <FavoriteButton itemId={item.id} className="floating save" />}
          </div>

          <div className="detail-body">
            <div className="status-row">
              <span className="availability">
                <i /> {isMine ? "Your listing · live" : "Available now"}
              </span>
              <span>
                <Icon name="map" size={16} /> {item.distance}
                {isMine ? "" : " away"}
              </span>
            </div>
            <h1>{item.title}</h1>
            <div className="price">
              <strong>${item.price}</strong> / day <span>${item.price * 4} max per week</span>
            </div>

            <div className="owner-card">
              <div className="avatar">{initials(owner.name)}</div>
              <div>
                <h3>
                  {isMine ? `${owner.name} (you)` : owner.name}{" "}
                  <span>
                    <Icon name="shield" size={15} /> UCI verified
                  </span>
                </h3>
                <p>
                  <Icon name="star" size={14} filled /> <b>{owner.rating}</b> · {owner.lends} completed lends
                </p>
              </div>
            </div>

            {!isMine && (
              <button className="message-owner" onClick={messageOwner}>
                <Icon name="message" />
                <span>
                  <b>Message {ownerFirst}</b>
                  <small>Ask about availability or the item</small>
                </span>
                <Icon name="chevron" />
              </button>
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
                  <p>Exact meetup spot shared after approval</p>
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
                  replacement value. Payment is paused during a dispute.
                </li>
              </ol>
              <p className="policy-limit">
                Coverage limit for this item: <b>${item.coverage}</b>
              </p>
            </section>
          </div>
        </div>

        <aside className="split-aside">
          {isMine ? (
            <div className="action-card">
              <div className="desktop-only action-card-head">
                <div className="price">
                  <strong>${item.price}</strong> / day
                </div>
                <p>This is your listing. Borrowers can request it now.</p>
              </div>
              {confirmRemove ? (
                <div className="remove-confirm">
                  <p>Remove this listing? It disappears from Discover right away.</p>
                  <div>
                    <button className="secondary" onClick={() => setConfirmRemove(false)}>
                      Keep it
                    </button>
                    <button className="primary danger" onClick={remove}>
                      Remove
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
          ) : (
            <div className="action-card">
              <div className="desktop-only action-card-head">
                <div className="price">
                  <strong>${item.price}</strong> / day
                </div>
                <p>
                  {ownerFirst} usually responds within {owner.responseMins} minutes
                </p>
              </div>
              <Link className="primary link-button" to={`/items/${item.id}/request`}>
                Check dates & request
              </Link>
              <p className="action-note">You won’t be charged until {ownerFirst} accepts.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
