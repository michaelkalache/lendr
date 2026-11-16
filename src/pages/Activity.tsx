import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components";
import { firstName, initials, photoSrc, type Item } from "../data";
import { formatDeadline, formatRange, formatWhen } from "../dates";
import { Handoff } from "../handoff";
import { Icon } from "../Icon";
import { spotName } from "../spots";
import {
  REQUEST_TTL_MS,
  isActiveBorrow,
  isOpen,
  isOverdue,
  stageOf,
  turnOf,
  useStore,
  type BorrowRequest,
  type Stage,
} from "../store";
import { ReviewForm, Stars } from "../trust";

function stageLabel(request: BorrowRequest, role: "lender" | "borrower") {
  const stage = stageOf(request);
  if (isOverdue(request)) return "OVERDUE";
  const labels: Record<Stage, string> = {
    pending: "PENDING",
    expired: "EXPIRED",
    declined: "DECLINED",
    cancelled: "CANCELLED",
    approved: role === "lender" ? "APPROVED · DROP IT OFF" : "APPROVED · AWAITING DROP-OFF",
    ready: "READY FOR PICKUP",
    out: role === "lender" ? "LENT OUT" : "BORROWING",
    returned: role === "lender" ? "RETURNED · CONFIRM IT’S BACK" : "RETURNED",
    completed: "COMPLETE",
  };
  return labels[stage];
}

const stageClass = (request: BorrowRequest) => `status-${stageOf(request)}${isOverdue(request) ? " is-overdue" : ""}`;

const expiresAt = (request: BorrowRequest) =>
  new Date(new Date(request.createdAt).getTime() + REQUEST_TTL_MS).toISOString();

function RequestCard({ request, item }: { request: BorrowRequest; item: Item }) {
  const navigate = useNavigate();
  const { ownerOf, threadFor, setRequestStatus, reviewForRequest } = useStore();
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ownerFirst = firstName(ownerOf(item).name);
  const stage = stageOf(request);
  const thread = threadFor(item.id, request.borrowerId);
  const review = reviewForRequest(request.id);

  const cancel = async () => {
    setBusy(true);
    const result = await setRequestStatus(request.id, "cancelled");
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <article className={`activity-card ${stageClass(request)}`} data-request={request.id}>
      <button className="activity-item" onClick={() => navigate(`/items/${item.id}`)}>
        <img src={photoSrc(item)} alt="" />
        <div>
          <span className="status-tag">{stageLabel(request, "borrower")}</span>
          <h3>{item.title}</h3>
          <p>
            {formatRange(request.start, request.end)} · ${request.total} total
          </p>
        </div>
        <Icon name="chevron" />
      </button>

      {stage === "pending" && (
        <>
          <div className="progress-list">
            <div className="complete">
              <span>
                <Icon name="check" size={13} />
              </span>
              <div>
                <b>Request sent</b>
                <p>{formatWhen(request.createdAt)}</p>
              </div>
            </div>
            <div className="current">
              <span>
                <Icon name="clock" size={15} />
              </span>
              <div>
                <b>Waiting for approval</b>
                <p>
                  {ownerFirst} has until {formatDeadline(expiresAt(request))} to respond
                </p>
              </div>
            </div>
            <div>
              <span>3</span>
              <div>
                <b>Drop-off & pickup</b>
                <p>
                  {ownerFirst} leaves it at {spotName(request.pickupSpot)}, you return it to {spotName(request.returnSpot)}
                </p>
              </div>
            </div>
          </div>
          <div className="card-actions">
            <button className="secondary" onClick={cancel} disabled={busy}>
              Cancel request
            </button>
            {thread && (
              <Link className="primary link-button" to={`/messages/${thread.id}`}>
                <Icon name="message" /> Message {ownerFirst}
              </Link>
            )}
          </div>
        </>
      )}

      {isActiveBorrow(stage) && <Handoff request={request} item={item} role="borrower" />}

      {stage === "completed" && (
        <div className="closed-note complete-note">
          <p>
            <b>Borrow complete.</b> {ownerFirst} confirmed the {item.title} is back
            {request.receivedAt ? ` (${formatWhen(request.receivedAt).replace(/^./, (c) => c.toLowerCase())})` : ""}.
          </p>
          {!review && !reviewing && (
            <button className="primary" onClick={() => setReviewing(true)}>
              <Icon name="star" size={16} /> Rate this item
            </button>
          )}
        </div>
      )}

      {(stage === "expired" || stage === "cancelled" || stage === "declined") && (
        <div className="closed-note">
          {stage === "expired" && <p>{ownerFirst} didn’t respond within 24 hours, so this request expired.</p>}
          {stage === "cancelled" && <p>This borrow was cancelled.</p>}
          {stage === "declined" && <p>{ownerFirst} couldn’t lend it for these dates.</p>}
          <button className="secondary" onClick={() => navigate(`/explore?q=${encodeURIComponent(item.category)}`)}>
            Find similar items
          </button>
        </div>
      )}

      {stage === "completed" && reviewing && !review && (
        <div className="card-review">
          <ReviewForm requestId={request.id} itemTitle={item.title} onDone={() => setReviewing(false)} />
        </div>
      )}
      {review && (
        <div className="card-reviewed">
          <Stars value={review.rating} showScore /> <span>You reviewed this item{review.body ? `: “${review.body}”` : "."}</span>
        </div>
      )}
      {isActiveBorrow(stage) && thread && (
        <Link className="activity-message borrower-message" to={`/messages/${thread.id}`}>
          <Icon name="message" />
          <span>
            <b>Message {ownerFirst}</b>
            <small>Questions about the drop-off or return</small>
          </span>
          <Icon name="chevron" />
        </Link>
      )}
      {error && (
        <p className="form-error card-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

function IncomingCard({ request, item }: { request: BorrowRequest; item: Item }) {
  const { person, threadFor, setRequestStatus, reviewForRequest } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const borrower = person(request.borrowerId);
  const borrowerFirst = firstName(borrower.name);
  const stage = stageOf(request);
  const thread = threadFor(item.id, request.borrowerId);
  const review = reviewForRequest(request.id);

  const decide = async (next: "approved" | "declined") => {
    setBusy(true);
    setError("");
    const result = await setRequestStatus(request.id, next);
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <article className={`activity-card lender-card ${stageClass(request)}`} data-request={request.id}>
      <div className="borrower">
        <div className="avatar violet">{initials(borrower.name)}</div>
        <div>
          <h3>
            <Link to={`/people/${borrower.id}`} className="person-link">
              {borrower.name}
            </Link>{" "}
            {stage === "pending" ? "wants" : "is borrowing"} your {item.title}
          </h3>
          <p>
            {borrower.program ? `${borrower.program} · ` : ""}
            {formatWhen(request.createdAt)}
          </p>
        </div>
        <span className="status-tag">{stageLabel(request, "lender")}</span>
      </div>
      <div className="request-facts">
        <div>
          <span>DATES</span>
          <b>{formatRange(request.start, request.end)}</b>
        </div>
        <div>
          <span>DROP-OFF</span>
          <b>{spotName(request.pickupSpot)}</b>
        </div>
        <div>
          <span>YOU EARN</span>
          <b>${request.total}</b>
        </div>
      </div>
      {stage === "pending" && (
        <>
          {request.returnSpot !== request.pickupSpot && (
            <p className="decide-note">
              {borrowerFirst} would return it to <b>{spotName(request.returnSpot)}</b>.
            </p>
          )}
          <p className="decide-note">Respond by {formatDeadline(expiresAt(request))} or the request expires.</p>
          <div className="decision">
            <button className="secondary" onClick={() => decide("declined")} disabled={busy}>
              Decline
            </button>
            <button className="primary" onClick={() => decide("approved")} disabled={busy}>
              Accept request
            </button>
          </div>
        </>
      )}
      {isActiveBorrow(stage) && <Handoff request={request} item={item} role="lender" />}
      {stage === "completed" && (
        <div className="approved-banner">
          <Icon name="check" />
          <div>
            <b>Borrow complete</b>
            <p>
              You confirmed the {item.title} is back. {review ? "" : `${borrowerFirst} can now rate it.`}
            </p>
          </div>
        </div>
      )}
      {(stage === "declined" || stage === "cancelled" || stage === "expired") && (
        <div className="closed-note">
          <p>
            {stage === "declined" && "You declined this request."}
            {stage === "cancelled" && "This borrow was cancelled."}
            {stage === "expired" && "This request expired after 24 hours without a response."}
          </p>
        </div>
      )}
      {review && (
        <div className="card-reviewed in-lender">
          <Stars value={review.rating} showScore />{" "}
          <span>
            {borrowerFirst} reviewed your {item.title}
            {review.body ? `: “${review.body}”` : "."}
          </span>
        </div>
      )}
      {thread && (
        <Link className="activity-message" to={`/messages/${thread.id}`}>
          <Icon name="message" />
          <span>
            <b>Message {borrowerFirst}</b>
            <small>{thread.messages.length} messages</small>
          </span>
          <Icon name="chevron" />
        </Link>
      )}
      {error && (
        <p className="form-error card-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

function split(list: BorrowRequest[]) {
  return {
    pending: list.filter((request) => stageOf(request) === "pending"),
    active: list.filter((request) => isActiveBorrow(stageOf(request))),
    closed: list.filter((request) => !isOpen(request)),
  };
}

function Borrowing() {
  const { requests, findItem, reviewForRequest } = useStore();
  const { pending, active, closed } = split(requests);
  const toReview = closed.filter((request) => request.status === "completed" && !reviewForRequest(request.id));
  const past = closed.filter((request) => !toReview.includes(request));

  if (!requests.length) {
    return (
      <EmptyState
        title="No requests yet"
        body="When you request an item, you’ll track approval, pickup, and return here."
        action={{ to: "/explore", label: "Browse items" }}
      />
    );
  }

  const render = (list: BorrowRequest[]) =>
    list.map((request) => {
      const item = findItem(request.itemId);
      return item ? <RequestCard key={request.id} request={request} item={item} /> : null;
    });

  return (
    <>
      {active.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>Borrowing now</h2>
            <span>
              <i /> Drop-off, pickup & return
            </span>
          </div>
          <div className="activity-list">{render(active)}</div>
        </>
      )}
      {toReview.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>Rate what you borrowed</h2>
          </div>
          <div className="activity-list">{render(toReview)}</div>
        </>
      )}
      {pending.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>{pending.length === 1 ? "Your request" : "Your requests"}</h2>
            <span>
              <i /> Waiting for a response
            </span>
          </div>
          <div className="activity-list">{render(pending)}</div>
          <div className="certainty">
            <Icon name="shield" />
            <div>
              <b>No awkward follow-ups.</b>
              <p>If a lender doesn’t respond within 24 hours, the request expires and you can find another.</p>
            </div>
          </div>
        </>
      )}
      {past.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>Past borrows & requests</h2>
          </div>
          <div className="activity-list">{render(past)}</div>
        </>
      )}
      <HelpNote />
    </>
  );
}

function HelpNote() {
  return (
    <p className="activity-help">
      <Icon name="shield" size={15} /> New to drop-offs and returns? <Link to="/help#borrowing">See how it works</Link>
    </p>
  );
}

function Lending() {
  const { incoming, findItem, myListings } = useStore();
  const { pending, active, closed } = split(incoming);

  if (!incoming.length) {
    return myListings.length ? (
      <EmptyState
        title="No requests yet"
        body={`You have ${myListings.length} ${myListings.length === 1 ? "listing" : "listings"} live. Requests from other Anteaters will show up here.`}
        action={{ to: "/account", label: "View your listings" }}
      />
    ) : (
      <EmptyState
        title="You’re not lending anything yet"
        body="List something you aren’t using and requests will show up here."
        action={{ to: "/list", label: "List an item" }}
      />
    );
  }

  const render = (list: BorrowRequest[]) =>
    list.map((request) => {
      const item = findItem(request.itemId);
      return item ? <IncomingCard key={request.id} request={request} item={item} /> : null;
    });

  return (
    <>
      {pending.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>Needs your response</h2>
            <span>
              <i /> {pending.length} waiting
            </span>
          </div>
          <div className="activity-list">{render(pending)}</div>
        </>
      )}
      {active.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>Lent out</h2>
            <span>
              <i /> Drop-off, pickup & return
            </span>
          </div>
          <div className="activity-list">{render(active)}</div>
        </>
      )}
      {closed.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>Past requests</h2>
          </div>
          <div className="activity-list">{render(closed)}</div>
        </>
      )}
      <HelpNote />
    </>
  );
}

export default function Activity() {
  const { incoming, requests } = useStore();
  const waiting = incoming.filter((request) => turnOf(request) === "lender").length;
  const myTurn = requests.filter((request) => turnOf(request) === "borrower").length;
  const [tab, setTab] = useState<"borrowing" | "lending">(waiting && !myTurn ? "lending" : "borrowing");
  return (
    <div className="container narrow activity-page">
      <h1 className="page-title">Activity</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "borrowing"} className={tab === "borrowing" ? "active" : ""} onClick={() => setTab("borrowing")}>
          Borrowing {myTurn > 0 && <span>{myTurn}</span>}
        </button>
        <button role="tab" aria-selected={tab === "lending"} className={tab === "lending" ? "active" : ""} onClick={() => setTab("lending")}>
          Lending {waiting > 0 && <span>{waiting}</span>}
        </button>
      </div>
      {tab === "borrowing" ? <Borrowing /> : <Lending />}
    </div>
  );
}
