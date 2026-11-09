import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { firstName, type Item } from "./data";
import { formatDay, formatRange, formatWhen, fromISODate } from "./dates";
import { Icon } from "./Icon";
import { SPOT_GROUPS, SPOTS, spotMapUrl, spotName, type Spot } from "./spots";
import { isOverdue, stageOf, useStore, type BorrowRequest, type HandoffStep } from "./store";

/* ───────── Spot picker + UCI map ───────── */
export function SpotSelect({
  value,
  onChange,
  label,
  hint,
}: {
  value: string;
  onChange: (id: string) => void;
  label: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field spot-field">
      <label htmlFor={id}>{label}</label>
      <div className="select-wrap">
        <Icon name="map" size={18} />
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          {SPOT_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {SPOTS.filter((spot: Spot) => spot.group === group).map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/** The official UCI campus map, opened on a spot. Loads only when shown. */
export function SpotMap({
  spotId,
  startOpen = false,
  label,
  url,
}: {
  spotId: string;
  startOpen?: boolean;
  label?: string;
  /** Show this map view instead of the spot (e.g. the campus overview). */
  url?: string;
}) {
  const [open, setOpen] = useState(startOpen);
  const src = url ?? spotMapUrl(spotId);
  return (
    <div className="spot-map">
      <div className="spot-map-bar">
        <button type="button" className="text-link small" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <Icon name="map" size={15} /> {open ? "Hide map" : label ?? "Show on UCI map"}
        </button>
        <a className="text-link small" href={src} target="_blank" rel="noreferrer">
          Open in UCI Maps ↗
        </a>
      </div>
      {open && (
        <iframe
          key={src}
          className="spot-map-frame"
          src={src}
          title={url ? "UCI campus map" : `UCI campus map: ${spotName(spotId)}`}
          loading="lazy"
        />
      )}
    </div>
  );
}

/** A spot with an optional note, e.g. where exactly the item was left. */
export function SpotCard({ label, spotId, note, mapLabel }: { label: string; spotId: string; note?: string; mapLabel?: string }) {
  return (
    <div className="spot-card">
      <div className="spot-card-head">
        <span className="spot-icon">
          <Icon name="map" size={18} />
        </span>
        <div>
          <small>{label}</small>
          <b>{spotName(spotId)}</b>
          {note && <p className="spot-note">“{note}”</p>}
        </div>
      </div>
      <SpotMap spotId={spotId} label={mapLabel} />
    </div>
  );
}

/* ───────── Handoff timeline ───────── */
type Role = "lender" | "borrower";

function Timeline({ request, role, otherFirst }: { request: BorrowRequest; role: Role; otherFirst: string }) {
  const due = `due back by ${formatDay(fromISODate(request.end))}`;
  const steps: { key: string; done?: string; title: string; mine: string; theirs: string; who: Role }[] = [
    {
      key: "drop",
      done: request.droppedOffAt,
      title: `${request.droppedOffAt ? "Dropped off at" : "Drop off at"} ${spotName(request.pickupSpot)}`,
      mine: "leave it at the spot, then mark it here",
      theirs: "leaves it at the spot",
      who: "lender",
    },
    {
      key: "pick",
      done: request.pickedUpAt,
      title: request.pickedUpAt ? "Picked up" : "Pick up",
      mine: "grab it from the spot, then mark it here",
      theirs: "grabs it from the spot",
      who: "borrower",
    },
    {
      key: "return",
      done: request.returnedAt,
      title: `${request.returnedAt ? "Returned to" : "Return to"} ${spotName(request.returnSpot)}`,
      mine: due,
      theirs: due,
      who: "borrower",
    },
    {
      key: "confirm",
      done: request.receivedAt,
      title: request.receivedAt ? "Return confirmed" : "Confirm it’s back",
      mine: "check it over and close the borrow",
      theirs: "checks it over and closes the borrow",
      who: "lender",
    },
  ];
  const currentIndex = steps.findIndex((step) => !step.done);
  const cap = (text: string) => text[0].toUpperCase() + text.slice(1);

  return (
    <ol className="progress-list handoff-steps" aria-label="Handoff progress">
      {steps.map((step, i) => {
        const current = !step.done && i === currentIndex;
        const mine = step.who === role;
        return (
          <li key={step.key} className={step.done ? "complete" : current ? "current" : ""}>
            <span>{step.done ? <Icon name="check" size={13} /> : i + 1}</span>
            <div>
              <b>{step.title}</b>
              <p>
                {step.done
                  ? formatWhen(step.done)
                  : current
                    ? mine
                      ? `Your turn · ${step.mine}`
                      : `Waiting on ${otherFirst}${step.key === "return" ? ` · ${step.theirs}` : ""}`
                    : mine
                      ? cap(step.mine)
                      : step.key === "return"
                        ? cap(step.theirs)
                        : `${otherFirst} ${step.theirs}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ───────── Handoff actions ───────── */
function StepForm({
  spotLabel,
  defaultSpot,
  notePlaceholder,
  submitLabel,
  busy,
  onSubmit,
}: {
  spotLabel: string;
  defaultSpot: string;
  notePlaceholder: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (spot: string, note: string) => void;
}) {
  const [spot, setSpot] = useState(defaultSpot);
  const [note, setNote] = useState("");
  const noteId = useId();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(spot, note);
  };
  return (
    <form className="step-form" onSubmit={submit}>
      <SpotSelect value={spot} onChange={setSpot} label={spotLabel} />
      <SpotMap spotId={spot} />
      <div className="field">
        <label htmlFor={noteId}>
          Where exactly? <em>(optional)</em>
        </label>
        <input id={noteId} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder={notePlaceholder} />
      </div>
      <button className="primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

export function Handoff({ request, item, role }: { request: BorrowRequest; item: Item; role: Role }) {
  const { advanceRequest, setRequestStatus, ownerOf, person } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const stage = stageOf(request);
  const ownerFirst = firstName(ownerOf(item).name);
  const borrowerFirst = firstName(person(request.borrowerId).name);
  const otherFirst = role === "lender" ? borrowerFirst : ownerFirst;
  const overdue = isOverdue(request);

  const run = async (step: HandoffStep, details?: { spot?: string; note?: string }) => {
    setBusy(true);
    setError("");
    const result = await advanceRequest(request.id, step, details);
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  const cancel = async () => {
    setBusy(true);
    setError("");
    const result = await setRequestStatus(request.id, "cancelled");
    setBusy(false);
    setConfirmCancel(false);
    if (!result.ok) setError(result.error);
  };

  const canCancel = stage === "approved" || stage === "ready";
  const due = formatDay(fromISODate(request.end));

  let panel: ReactNode = null;
  if (stage === "approved") {
    panel =
      role === "lender" ? (
        <>
          <p className="handoff-lead">
            <b>Drop the {item.title} off</b> before {formatDay(fromISODate(request.start))}, then mark it here so{" "}
            {borrowerFirst} knows it’s ready.
          </p>
          <StepForm
            spotLabel="Where are you leaving it?"
            defaultSpot={request.pickupSpot}
            notePlaceholder="e.g. Front desk, in a bag labeled with my name"
            submitLabel="I dropped it off"
            busy={busy}
            onSubmit={(spot, note) => void run("dropped_off", { spot, note })}
          />
        </>
      ) : (
        <>
          <p className="handoff-lead">
            {ownerFirst} will leave it at <b>{spotName(request.pickupSpot)}</b> and mark it here. You’ll see exactly where
            it is.
          </p>
          <SpotCard label="PICKUP SPOT" spotId={request.pickupSpot} />
        </>
      );
  } else if (stage === "ready") {
    panel =
      role === "borrower" ? (
        <>
          <SpotCard label="READY FOR PICKUP AT" spotId={request.pickupSpot} note={request.pickupNote} />
          <p className="handoff-lead">
            Grab it, check that everything’s there, then tap below. Pay {ownerFirst} the ${request.total} directly (Venmo,
            Zelle, or cash).
          </p>
          <button className="primary handoff-button" onClick={() => void run("picked_up")} disabled={busy}>
            {busy ? "Saving…" : "I picked it up"}
          </button>
        </>
      ) : (
        <>
          <SpotCard label="YOU LEFT IT AT" spotId={request.pickupSpot} note={request.pickupNote} />
          <p className="handoff-lead">Waiting for {borrowerFirst} to pick it up.</p>
        </>
      );
  } else if (stage === "out") {
    panel =
      role === "borrower" ? (
        <>
          {overdue && (
            <p className="overdue-note" role="alert">
              <Icon name="clock" size={16} /> This was due back {due}. Please return it as soon as you can.
            </p>
          )}
          <p className="handoff-lead">
            <b>Return it by {due}.</b> Leave it at the agreed spot, or pick another if {ownerFirst} is OK with it.
          </p>
          <StepForm
            spotLabel="Where are you leaving it?"
            defaultSpot={request.returnSpot}
            notePlaceholder="e.g. Front desk, under my name"
            submitLabel="I returned it"
            busy={busy}
            onSubmit={(spot, note) => void run("returned", { spot, note })}
          />
        </>
      ) : (
        <>
          {overdue && (
            <p className="overdue-note" role="alert">
              <Icon name="clock" size={16} /> {borrowerFirst} was supposed to return it {due}. Send a reminder in
              Messages.
            </p>
          )}
          <SpotCard label="COMING BACK TO" spotId={request.returnSpot} />
          <p className="handoff-lead">
            {borrowerFirst} has it until {due}. You’ll be asked to confirm once it’s back.
          </p>
        </>
      );
  } else if (stage === "returned") {
    panel =
      role === "lender" ? (
        <>
          <SpotCard label="RETURNED TO" spotId={request.returnSpot} note={request.returnNote} />
          <p className="handoff-lead">
            <b>Pick it up and check it over.</b> Once you have it, confirm below to close the borrow.
          </p>
          <button className="primary handoff-button" onClick={() => void run("received")} disabled={busy}>
            {busy ? "Saving…" : "I got it back"}
          </button>
          <p className="field-hint">
            Not there, or damaged? Message {borrowerFirst} first, then{" "}
            <Link to={`/people/${request.borrowerId}`}>report it from their profile</Link> if you can’t sort it out.
          </p>
        </>
      ) : (
        <>
          <SpotCard label="YOU RETURNED IT TO" spotId={request.returnSpot} note={request.returnNote} />
          <p className="handoff-lead">Waiting for {ownerFirst} to confirm it’s back. Then you can rate the item.</p>
        </>
      );
  }

  return (
    <div className="handoff">
      <Timeline request={request} role={role} otherFirst={otherFirst} />
      {panel && <div className="handoff-panel">{panel}</div>}
      {canCancel &&
        (confirmCancel ? (
          <div className="cancel-confirm">
            <p>
              Cancel this borrow?{" "}
              {stage === "ready" && role === "lender"
                ? "Pick the item back up from the spot."
                : stage === "ready"
                  ? `${ownerFirst} will collect it from the spot.`
                  : ""}
            </p>
            <div>
              <button className="secondary" onClick={() => setConfirmCancel(false)}>
                Keep it
              </button>
              <button className="primary danger" onClick={() => void cancel()} disabled={busy}>
                Cancel borrow
              </button>
            </div>
          </div>
        ) : (
          <button className="text-link small cancel-link" onClick={() => setConfirmCancel(true)}>
            Cancel this borrow
          </button>
        ))}
      {error && (
        <p className="form-error card-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const borrowSummary = (request: BorrowRequest) =>
  `${formatRange(request.start, request.end)} · $${request.total} total`;
