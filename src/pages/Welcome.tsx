import { useState, type FormEvent } from "react";
import { HeroArt } from "../components";
import { Icon } from "../Icon";
import { useStore } from "../store";

type Mode = "signup" | "login" | "reset";

export default function Welcome({ initialMode = "signup" }: { initialMode?: Mode }) {
  const { signUp, signIn, resetPassword } = useStore();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [program, setProgram] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (mode === "signup") {
      if (name.trim().length < 2) return setError("Enter your name.");
      if (!/^[^\s@]+@uci\.edu$/.test(cleanEmail)) return setError("Use your @uci.edu email address.");
      if (password.length < 8) return setError("Use a password with at least 8 characters.");
    } else if (mode === "reset") {
      if (!cleanEmail) return setError("Enter the email you signed up with.");
      if (code.replace(/[^a-z0-9]/gi, "").length !== 16) return setError("Recovery codes look like ABCD-EFGH-JKLM-NPQR.");
      if (password.length < 8) return setError("Use a new password with at least 8 characters.");
    } else if (!cleanEmail || !password) {
      return setError("Enter your email and password.");
    }
    setBusy(true);
    const result =
      mode === "signup"
        ? await signUp({ name, email: cleanEmail, password, program })
        : mode === "reset"
          ? await resetPassword(cleanEmail, code, password)
          : await signIn(cleanEmail, password);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    if (mode === "signup" && result.value && "needsConfirmation" in result.value && result.value.needsConfirmation) {
      setCheckEmail(true);
    }
  };

  return (
    <div className="welcome">
      <header className="welcome-top">
        <span className="brand-lockup">
          <span className="brand">
            lendr<span>.</span>
          </span>
          <span className="uci-mark">UCI</span>
        </span>
      </header>

      <div className="welcome-grid">
        <section className="welcome-pitch">
          <div className="campus-pill">
            <Icon name="shield" size={15} /> UCI students only
          </div>
          <h1>
            Borrow on campus.
            <br />
            Keep creating.
          </h1>
          <p>
            Projectors, tools, and camping gear from fellow Anteaters, a few dollars a day. Or lend what you aren’t using.
          </p>
          <ul className="welcome-points">
            <li>
              <Icon name="check" size={16} /> Sign up with your @uci.edu email
            </li>
            <li>
              <Icon name="check" size={16} /> Lenders approve every borrow
            </li>
            <li>
              <Icon name="check" size={16} /> Meet on campus, chat in the app
            </li>
          </ul>
          <HeroArt />
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          {checkEmail ? (
            <div className="auth-done">
              <div className="success-mark">
                <Icon name="check" size={32} />
              </div>
              <h2 id="auth-title">Check your inbox</h2>
              <p>
                We sent a confirmation link to <b>{email.trim().toLowerCase()}</b>. Open it, then come back and log in.
              </p>
              <button
                className="secondary"
                onClick={() => {
                  setCheckEmail(false);
                  switchMode("login");
                }}
              >
                Back to log in
              </button>
            </div>
          ) : (
            <>
              <div className="auth-tabs" role="tablist">
                <button role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>
                  Create account
                </button>
                <button role="tab" aria-selected={mode !== "signup"} className={mode !== "signup" ? "active" : ""} onClick={() => switchMode("login")}>
                  Log in
                </button>
              </div>
              <h2 id="auth-title">{mode === "signup" ? "Join lendr" : mode === "reset" ? "Reset your password" : "Welcome back"}</h2>
              <p className="auth-sub">
                {mode === "signup"
                  ? "Takes 30 seconds. You’ll use this to log in on any device."
                  : mode === "reset"
                    ? "Use the recovery code you saved when you signed up. It works once, and you’ll get a new one after."
                    : "Log in with your UCI email."}
              </p>

              <form className="auth-form" onSubmit={submit} noValidate>
                {mode === "signup" && (
                  <label className="field">
                    <span>Full name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} placeholder="Peter Anteater" />
                  </label>
                )}
                <label className="field">
                  <span>UCI email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="panteater@uci.edu"
                  />
                </label>
                {mode === "reset" && (
                  <label className="field">
                    <span>Recovery code</span>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      autoComplete="one-time-code"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={24}
                      placeholder="ABCD-EFGH-JKLM-NPQR"
                      className="code-input"
                    />
                  </label>
                )}
                <div className="field">
                  <span className="field-label-row">
                    <label htmlFor="auth-password">{mode === "reset" ? "New password" : "Password"}</label>
                    {mode === "login" && (
                      <button type="button" className="text-link small" onClick={() => switchMode("reset")}>
                        Forgot password?
                      </button>
                    )}
                  </span>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder={mode === "login" ? "" : "At least 8 characters"}
                  />
                </div>
                {mode === "signup" && (
                  <label className="field">
                    <span>
                      Major & year <em>(optional)</em>
                    </span>
                    <input value={program} onChange={(e) => setProgram(e.target.value)} maxLength={60} placeholder="Informatics ’27" />
                  </label>
                )}
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="primary" type="submit" disabled={busy}>
                  {busy ? "One moment…" : mode === "signup" ? "Create account" : mode === "reset" ? "Set new password" : "Log in"}
                </button>
              </form>

              <p className="auth-switch">
                {mode === "reset" ? (
                  <>
                    Remembered it?{" "}
                    <button className="text-link" onClick={() => switchMode("login")}>
                      Back to log in
                    </button>
                    <span className="auth-help">
                      Lost your recovery code too? Ask the lendr team to reset your account.
                    </span>
                  </>
                ) : mode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button className="text-link" onClick={() => switchMode("login")}>
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    New to lendr?{" "}
                    <button className="text-link" onClick={() => switchMode("signup")}>
                      Create an account
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
