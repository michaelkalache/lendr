import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon";
import { useStore, type Rating, type ReportReason, type Review } from "./store";

/* ───────── Stars ───────── */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? "on" : ""}>
          <Icon name="star" size={size} filled />
        </span>
      ))}
    </span>
  );
}

export function RatingBadge({ rating, compact = false }: { rating: Rating | null; compact?: boolean }) {
  if (!rating) return null;
  return (
    <span className="rating-badge" title={rating.sample ? "Sample reviews" : undefined}>
      <Icon name="star" size={compact ? 12 : 14} filled />
      <b>{rating.average.toFixed(1)}</b>
      <span>({rating.count})</span>
    </span>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          key={n}
          className={n <= value ? "on" : ""}
          onClick={() => onChange(n)}
        >
          <Icon name="star" size={26} filled />
        </button>
      ))}
      <span className="star-label">{labels[value] || "Tap to rate"}</span>
    </div>
  );
}

/* ───────── Review form + list ───────── */
export function ReviewForm({ requestId, itemTitle, onDone }: { requestId: string; itemTitle: string; onDone?: () => void }) {
  const { submitReview } = useStore();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rating) return setError("Pick a star rating first.");
    setBusy(true);
    setError("");
    const result = await submitReview(requestId, rating, body);
    setBusy(false);
    if (result.ok) onDone?.();
    else setError(result.error);
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <b>How was the {itemTitle}?</b>
      <StarInput value={rating} onChange={setRating} />
      <label className="field">
        <span className="sr-only">Your review</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Condition, what was included, anything the next borrower should know (optional)"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary" type="submit" disabled={busy}>
        {busy ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const { me, deleteReview } = useStore();
  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <li key={review.id} className={review.sample ? "is-sample" : ""}>
          <div className="review-head">
            <Stars value={review.rating} />
            {review.sample ? (
              <span className="sample-pill">Sample review</span>
            ) : review.authorId ? (
              <Link to={`/people/${review.authorId}`} className="person-link">
                {review.authorName}
              </Link>
            ) : null}
            {review.sample && <span className="review-author">{review.authorName}</span>}
            <time dateTime={review.at}>
              {new Date(review.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </time>
          </div>
          {review.body && <p>{review.body}</p>}
          {review.authorId && review.authorId === me?.id && (
            <button className="text-link small" onClick={() => void deleteReview(review.id)}>
              Delete my review
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ───────── Modal shell ───────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}>
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ───────── Reporting ───────── */
const REASONS: { value: ReportReason; label: string; hint: string; for: ("listing" | "user")[] }[] = [
  { value: "prohibited", label: "Prohibited item", hint: "Weapons, alcohol, drugs, stolen goods, anything not allowed on campus", for: ["listing"] },
  { value: "unsafe", label: "Unsafe or broken", hint: "Damaged, recalled, or dangerous to use", for: ["listing"] },
  { value: "scam", label: "Scam or misleading", hint: "Fake listing, asks for payment outside the meetup, bait-and-switch", for: ["listing", "user"] },
  { value: "harassment", label: "Harassment or inappropriate behavior", hint: "Rude, threatening, or unwanted messages", for: ["user"] },
  { value: "fake_account", label: "Not a real UCI student", hint: "Impersonation or a fake account", for: ["user"] },
  { value: "other", label: "Something else", hint: "Tell us what happened", for: ["listing", "user"] },
];

export function ReportButton({ target, name }: { target: { listingId?: string; userId?: string }; name: string }) {
  const { reportFor } = useStore();
  const [open, setOpen] = useState(false);
  const existing = reportFor(target);
  const kind = target.listingId ? "listing" : "account";

  return (
    <>
      {existing ? (
        <p className="report-done">
          <Icon name="shield" size={14} /> You reported this {kind} on{" "}
          {new Date(existing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. Thanks for
          keeping lendr safe.
        </p>
      ) : (
        <button className="report-link" onClick={() => setOpen(true)}>
          <Icon name="flag" size={14} /> Report {kind}
        </button>
      )}
      {/* Stay mounted after the report saves so the confirmation can show. */}
      {open && <ReportDialog target={target} name={name} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReportDialog({ target, name, onClose }: { target: { listingId?: string; userId?: string }; name: string; onClose: () => void }) {
  const { report } = useStore();
  const kind = target.listingId ? "listing" : "user";
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!reason) return setError("Choose a reason.");
    if (reason === "other" && details.trim().length < 10) return setError("Tell us a bit about what happened.");
    setBusy(true);
    setError("");
    const result = await report(target, reason, details);
    setBusy(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  };

  return (
    <Modal title={sent ? "Report sent" : kind === "listing" ? "Report this listing" : `Report ${name}`} onClose={onClose}>
      {sent ? (
        <div className="report-sent">
          <div className="success-mark small">
            <Icon name="check" size={26} />
          </div>
          <p>
            Thanks. The lendr team reviews every report. {kind === "listing"
              ? "Listings reported by several students are hidden automatically while we take a look."
              : "We’ll look at their listings and messages."}{" "}
            {name.split(" ")[0]} isn’t told who reported them.
          </p>
          <button className="primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="report-form">
          <p className="modal-sub">
            {kind === "listing" ? `What’s wrong with “${name}”?` : `What’s going on with ${name}?`} Reports are private.
          </p>
          <div className="reason-list" role="radiogroup" aria-label="Reason">
            {REASONS.filter((option) => option.for.includes(kind)).map((option) => (
              <label key={option.value} className={`reason ${reason === option.value ? "active" : ""}`}>
                <input
                  type="radio"
                  name="reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => {
                    setReason(option.value);
                    setError("");
                  }}
                />
                <span>
                  <b>{option.label}</b>
                  <small>{option.hint}</small>
                </span>
              </label>
            ))}
          </div>
          <label className="field">
            <span>
              Details <em>{reason === "other" ? "(required)" : "(optional)"}</em>
            </span>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000} />
          </label>
          <p className="field-hint">
            In danger or need help right now? Call UCI Police at <a href="tel:9498245223">(949) 824-5223</a> or 911.{" "}
            <Link to="/safety" onClick={onClose}>
              How we keep lendr safe
            </Link>
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary danger" disabled={busy}>
              {busy ? "Sending…" : "Send report"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ───────── Recovery code ───────── */
export function RecoveryCodeModal() {
  const { recoveryCodeToShow, dismissRecoveryCode, email } = useStore();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  if (!recoveryCodeToShow) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodeToShow);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal recovery-modal" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
        <div className="modal-head">
          <h2 id="recovery-title">Save your recovery code</h2>
        </div>
        <p className="modal-sub">
          If you forget your password, this code lets you set a new one from the log-in page. It works once, and we can’t
          show it again. Keep it somewhere safe, like your notes app or password manager.
        </p>
        <div className="recovery-code" aria-label="Recovery code">
          {recoveryCodeToShow}
        </div>
        <p className="recovery-for">For {email}</p>
        <button className="secondary" onClick={copy}>
          <Icon name={copied ? "check" : "copy"} size={16} /> {copied ? "Copied" : "Copy code"}
        </button>
        <label className="check-row">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          <span>I saved my recovery code</span>
        </label>
        <button className="primary" disabled={!saved} onClick={dismissRecoveryCode}>
          Continue
        </button>
      </div>
    </div>
  );
}
