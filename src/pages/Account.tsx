import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ItemCard } from "../components";
import { initials, photoSrc } from "../data";
import { Icon } from "../Icon";
import { useStore } from "../store";

function EditProfile({ onDone }: { onDone: () => void }) {
  const { me, updateProfile } = useStore();
  const [name, setName] = useState(me?.name ?? "");
  const [program, setProgram] = useState(me?.program ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return setError("Enter your name.");
    setBusy(true);
    const result = await updateProfile({ name, program });
    setBusy(false);
    if (result.ok) onDone();
    else setError(result.error);
  };

  return (
    <form className="profile-form" onSubmit={submit}>
      <label className="field">
        <span>Full name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
      </label>
      <label className="field">
        <span>Major & year</span>
        <input value={program} onChange={(e) => setProgram(e.target.value)} maxLength={60} placeholder="Informatics ’27" />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="profile-form-actions">
        <button type="button" className="secondary" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function Account() {
  const { me, email, favorites, requests, incoming, myListings, allItems, signOut } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const saved = allItems.filter((item) => favorites.includes(item.id));
  if (!me) return null;
  const lends = incoming.filter((request) => request.status === "approved").length;
  const borrows = requests.filter((request) => request.status === "approved").length;

  return (
    <div className="container narrow account-page">
      <section className="account-hero">
        <div className="account-avatar">{initials(me.name)}</div>
        <div>
          <span>UCI EMAIL</span>
          <h1>{me.name}</h1>
          <p>
            {me.program ? `${me.program} · ` : ""}
            {email}
          </p>
        </div>
      </section>

      <div className="account-stats">
        <div>
          <strong>{myListings.length}</strong>
          <span>Listings</span>
        </div>
        <div>
          <strong>{lends}</strong>
          <span>Lends</span>
        </div>
        <div>
          <strong>{borrows}</strong>
          <span>Borrows</span>
        </div>
      </div>

      <section className="account-section">
        <div className="section-title">
          <div>
            <h2>Your listings</h2>
            <p>Everyone on lendr can see and request these</p>
          </div>
          <Link to="/list" className="text-link">
            + New listing
          </Link>
        </div>
        {myListings.length ? (
          <div className="my-listings">
            {myListings.map((item) => (
              <Link key={item.id} to={`/items/${item.id}`} className="my-listing">
                <img src={photoSrc(item)} alt="" />
                <span>
                  <b>{item.title}</b>
                  <em>
                    ${item.price}/day · {item.category}
                  </em>
                </span>
                <Icon name="chevron" />
              </Link>
            ))}
          </div>
        ) : (
          <Link to="/list" className="lend-cta compact">
            <span className="lend-cta-icon">
              <Icon name="plus" size={22} />
            </span>
            <span>
              <b>List your first item</b>
              <em>Projectors, tools, camping gear — anything you can lend.</em>
            </span>
            <Icon name="chevron" />
          </Link>
        )}
      </section>

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
          <h2>Profile</h2>
        </div>
        {editing ? (
          <EditProfile onDone={() => setEditing(false)} />
        ) : (
          <div className="account-menu">
            <button onClick={() => setEditing(true)}>
              <span>
                <Icon name="profile" />
              </span>
              <div>
                <b>Edit profile</b>
                <p>Name and major shown to other students</p>
              </div>
              <Icon name="chevron" />
            </button>
            <Link to="/activity">
              <span>
                <Icon name="inbox" />
              </span>
              <div>
                <b>Borrowing & lending history</b>
                <p>Requests, approvals, and past borrows</p>
              </div>
              <Icon name="chevron" />
            </Link>
            <button onClick={() => setConfirmLogout(true)}>
              <span>
                <Icon name="arrow" />
              </span>
              <div>
                <b>Log out</b>
                <p>Signed in as {email}</p>
              </div>
              <Icon name="chevron" />
            </button>
          </div>
        )}
        {confirmLogout && (
          <div className="reset-confirm">
            <p>Log out of lendr on this device?</p>
            <div>
              <button className="secondary" onClick={() => setConfirmLogout(false)}>
                Stay
              </button>
              <button
                className="primary"
                onClick={() => {
                  // Leave the account page first so logging back in lands on Discover.
                  navigate("/", { replace: true });
                  void signOut();
                }}
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
