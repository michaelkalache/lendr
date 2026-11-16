import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Anteater, HeroArt, UciLogo } from "../components";
import { Icon } from "../Icon";
import { useStore } from "../store";

type Mode = "signup" | "login" | "reset";

export default function Welcome({ initialMode = "signup" }: { initialMode?: Mode }) {
  const { signUp, signIn, resetPassword, verifyEmail, resendConfirmation } = useStore();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [program, setProgram] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [otp, setOtp] = useState("");
  const [resent, setResent] = useState("");

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
    if (result.value && typeof result.value === "object" && "needsConfirmation" in result.value && result.value.needsConfirmation) {
      setOtp("");
      setResent(mode === "login" ? "Your email isn’t confirmed yet. Enter the code we sent, or send a new one." : "");
      setCheckEmail(true);
    }
  };

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await verifyEmail(email, otp);
    setBusy(false);
    if (!result.ok) setError(result.error);
    // On success the session starts and the app opens on its own.
  };

  const resend = async () => {
    setError("");
    setResent("");
    setBusy(true);
    const result = await resendConfirmation(email);
    setBusy(false);
    if (result.ok) setResent("Sent. Check your inbox (and spam) for the newest email.");
    else setError(result.error);
  };

  return (
    <div className="welcome">
      <header className="welcome-top">
        <span className="brand-lockup">
          <UciLogo className="brand-logo" alt="UCI" />
          <span className="brand">
            lendr<span>.</span>
          </span>
        </span>
        <Anteater className="phone-anteater" />
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
            Cameras, speakers, bikes, camping gear, and more from fellow Anteaters, a few dollars a day. Or lend what you aren’t using.
          </p>
          <ul className="welcome-points">
            <li>
              <Icon name="check" size={16} /> Sign up with your @uci.edu email
            </li>
            <li>
              <Icon name="check" size={16} /> Lenders approve every borrow
            </li>
            <li>
              <Icon name="check" size={16} /> No meetups: drop off and pick up at campus spots
            </li>
          </ul>
          <Link to="/help" className="text-link welcome-help">
            How lendr works →
          </Link>
          <HeroArt />
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          {checkEmail ? (
            <div className="auth-done confirm-email">
              <div className="success-mark">
                <Icon name="inbox" size={30} />
              </div>
              <h2 id="auth-title">Confirm your UCI email</h2>
              <p>
                We sent a 6-digit code to <b>{email.trim().toLowerCase()}</b>. Enter it here, or tap the link in the email.
              </p>
              {resent && (
                <p className="form-note" role="status">
                  {resent}
                </p>
              )}
              <form className="auth-form" onSubmit={confirm} noValidate>
                <label className="field">
                  <span>Confirmation code</span>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className="code-input otp-input"
                    aria-label="6-digit confirmation code"
                    autoFocus
                  />
                </label>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="primary" type="submit" disabled={busy || otp.length !== 6}>
                  {busy ? "One moment…" : "Confirm email"}
                </button>
              </form>
              <p className="auth-switch">
                No email after a minute?{" "}
                <button className="text-link" onClick={() => void resend()} disabled={busy}>
                  Send a new code
                </button>
                <span className="auth-help">
                  Wrong address?{" "}
                  <button
                    className="text-link"
                    onClick={() => {
                      setCheckEmail(false);
                      setError("");
                      switchMode("signup");
                    }}
                  >
                    Start over
                  </button>
                </span>
              </p>
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
