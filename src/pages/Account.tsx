import { useState } from "react";
import { Link } from "react-router-dom";
import { ItemCard } from "../components";
import { currentUser, items } from "../data";
import { Icon } from "../Icon";
import { useStore } from "../store";

export default function Account() {
  const { favorites, requests, dispatch } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const saved = items.filter((item) => favorites.includes(item.id));

  return (
    <div className="container narrow account-page">
      <section className="account-hero">
        <div className="account-avatar">{currentUser.initials}</div>
        <div>
          <span>UCI VERIFIED</span>
          <h1>{currentUser.name}</h1>
          <p>{currentUser.program} · @uci.edu</p>
        </div>
      </section>

      <div className="account-stats">
        <div>
          <strong>5.0</strong>
          <span>
            <Icon name="star" size={13} filled /> Rating
          </span>
        </div>
        <div>
          <strong>{12 + requests.length}</strong>
          <span>Borrows</span>
        </div>
        <div>
          <strong>6</strong>
          <span>Lends</span>
        </div>
      </div>

      <section className="account-section">
        <div className="section-title">
          <div>
            <h2>Saved items</h2>
            <p>Tap the heart on any listing to save it here</p>
          </div>
        </div>
        {saved.length ? (
          <div className="item-grid two-up">
            {saved.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="muted-line">
            Nothing saved yet. <Link to="/explore">Browse listings</Link>
          </p>
        )}
      </section>

      <section className="account-section">
        <div className="section-title">
          <div>
            <h2>Your trust profile</h2>
            <p>Visible to other verified Anteaters</p>
          </div>
        </div>
        <div className="trust-profile">
          <div>
            <span>
              <Icon name="shield" />
            </span>
            <div>
              <b>UCI identity verified</b>
              <p>Verified with your campus email</p>
            </div>
            <Icon name="check" />
          </div>
          <div>
            <span>
              <Icon name="check" />
            </span>
            <div>
              <b>Reliable borrower</b>
              <p>100% on-time return rate</p>
            </div>
            <Icon name="check" />
          </div>
        </div>
      </section>

      <section className="account-section">
        <div className="section-title">
          <h2>Account</h2>
        </div>
        <div className="account-menu">
          <Link to="/activity">
            <span>
              <Icon name="inbox" />
            </span>
            <div>
              <b>Borrowing history</b>
              <p>Requests, returns, and ratings</p>
            </div>
            <Icon name="chevron" />
          </Link>
          <Link to="/messages">
            <span>
              <Icon name="message" />
            </span>
            <div>
              <b>Messages</b>
              <p>Conversations with lenders</p>
            </div>
            <Icon name="chevron" />
          </Link>
          <div className="menu-row">
            <span>
              <Icon name="profile" />
            </span>
            <div>
              <b>Edit profile</b>
              <p>Name, photo, and graduation year</p>
            </div>
            <em className="soon">Soon</em>
          </div>
        </div>
      </section>

      <section className="account-section demo-reset">
        {confirmReset ? (
          <div className="reset-confirm">
            <p>Clear your requests, messages, and saved items, and start the demo fresh?</p>
            <div>
              <button className="secondary" onClick={() => setConfirmReset(false)}>
                Keep my data
              </button>
              <button
                className="primary"
                onClick={() => {
                  dispatch({ type: "reset" });
                  setConfirmReset(false);
                }}
              >
                Reset demo
              </button>
            </div>
          </div>
        ) : (
          <button className="text-link" onClick={() => setConfirmReset(true)}>
            Reset demo data
          </button>
        )}
      </section>
    </div>
  );
}
