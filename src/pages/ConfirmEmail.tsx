import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { UciLogo } from "../components";
import { Icon } from "../Icon";
import { useStore } from "../store";

/**
 * Where the "Confirm my email" button in the sign-up email lands. Confirming takes a tap here
 * (not just opening the link), so email security scanners that open links can't use up the code.
 */
export default function ConfirmEmail() {
  const [params] = useSearchParams();
  const tokenHash = params.get("token_hash") ?? "";
  const { confirmEmailLink } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setError("");
    const result = await confirmEmailLink(tokenHash);
    setBusy(false);
    if (!result.ok) setError(result.error);
    // On success the session starts and the app opens on its own.
  };

  return (
    <div className="welcome confirm-page">
      <header className="welcome-top">
        <Link to="/welcome" className="brand-lockup" aria-label="lendr home">
          <UciLogo className="brand-logo" alt="UCI" />
          <span className="brand">
            lendr<span>.</span>
          </span>
        </Link>
      </header>
      <div className="confirm-page-body">
        <section className="auth-card auth-done" aria-labelledby="confirm-title">
          <div className="success-mark">
            <Icon name="shield" size={30} />
          </div>
          {tokenHash ? (
            <>
              <h2 id="confirm-title">Confirm your UCI email</h2>
              <p>One tap and your lendr account is ready.</p>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary" onClick={() => void confirm()} disabled={busy}>
                {busy ? "Confirming…" : "Confirm my email"}
              </button>
              {error && (
                <p className="auth-switch">
                  <Link to="/login" className="text-link">
                    Log in to get a new code
                  </Link>
                </p>
              )}
            </>
          ) : (
            <>
              <h2 id="confirm-title">This link is incomplete</h2>
              <p>Open the newest email from lendr and tap its button again, or log in to get a new code.</p>
              <Link to="/login" className="primary link-button">
                Log in
              </Link>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
