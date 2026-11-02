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

function ChangePassword({ onDone }: { onDone: () => void }) {
  const { changePassword } = useStore();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don’t match.");
    setBusy(true);
    const result = await changePassword(password);
    setBusy(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  };

  if (done) {
    return (
      <div className="profile-form">
        <p className="form-success">
          <Icon name="check" size={16} /> Password changed. Use it next time you log in.
        </p>
        <button className="secondary" onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label className="field">
        <span>New password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus placeholder="At least 8 characters" />
      </label>
      <label className="field">
        <span>Confirm new password</span>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
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
          {busy ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

export default function Account() {
  const { me, email, favorites, requests, incoming, myListings, allItems, signOut } = useStore();
  const navigate = useNavigate();
  const { hasRecoveryCode, makeRecoveryCode } = useStore();
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmNewCode, setConfirmNewCode] = useState(false);
  const [codeError, setCodeError] = useState("");
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
                  <b>
                    {item.title} {item.hiddenAt && <span className="hidden-pill">Hidden for review</span>}
                  </b>
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
            <Link to={`/people/${me.id}`}>
              <span>
                <Icon name="profile" />
              </span>
              <div>
                <b>View your public profile</b>
                <p>What other students see when they tap your name</p>
              </div>
              <Icon name="chevron" />
            </Link>
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

      <section className="account-section">
        <div className="section-title">
          <div>
            <h2>Security</h2>
            <p>Your password and how to get back in if you forget it</p>
          </div>
        </div>
        {!hasRecoveryCode && hasRecoveryCode !== null && (
          <div className="recovery-warning">
            <Icon name="key" />
            <span>
              <b>Set up password recovery.</b> Without a recovery code, a forgotten password can’t be reset from the
              log-in page.
            </span>
          </div>
        )}
        {changingPassword ? (
          <ChangePassword onDone={() => setChangingPassword(false)} />
        ) : (
          <div className="account-menu">
            <button onClick={() => setChangingPassword(true)}>
              <span>
                <Icon name="key" />
              </span>
              <div>
                <b>Change password</b>
                <p>Pick a new password for {email}</p>
              </div>
              <Icon name="chevron" />
            </button>
            <button onClick={() => (hasRecoveryCode ? setConfirmNewCode(true) : void makeRecoveryCode())}>
              <span>
                <Icon name="shield" />
              </span>
              <div>
                <b>{hasRecoveryCode ? "Make a new recovery code" : "Create a recovery code"}</b>
                <p>
                  {hasRecoveryCode
                    ? "You have one saved. A new code replaces it."
                    : "Lets you reset your password from the log-in page"}
                </p>
              </div>
              <Icon name="chevron" />
            </button>
            <Link to="/safety">
              <span>
                <Icon name="flag" />
              </span>
              <div>
                <b>Trust & safety</b>
                <p>How lendr keeps borrowing safe, and how to report a problem</p>
              </div>
              <Icon name="chevron" />
            </Link>
          </div>
        )}
        {confirmNewCode && (
          <div className="reset-confirm">
            <p>Make a new recovery code? Your old code will stop working.</p>
            <div>
              <button className="secondary" onClick={() => setConfirmNewCode(false)}>
                Keep old code
              </button>
              <button
                className="primary"
                onClick={async () => {
                  setConfirmNewCode(false);
                  const result = await makeRecoveryCode();
                  if (!result.ok) setCodeError(result.error);
                }}
              >
                Make new code
              </button>
            </div>
          </div>
        )}
        {codeError && (
          <p className="form-error" role="alert">
            {codeError}
          </p>
        )}
      </section>
    </div>
  );
}
