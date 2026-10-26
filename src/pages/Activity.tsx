import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components";
import { firstName, initials, photoSrc, pickupOf, type Item } from "../data";
import { formatRange, formatTime, formatWhen } from "../dates";
import { Icon } from "../Icon";
import { REQUEST_TTL_MS, displayStatus, useStore, type BorrowRequest, type DisplayStatus } from "../store";

const STATUS_LABEL: Record<DisplayStatus, string> = {
  pending: "PENDING",
  approved: "APPROVED",
  declined: "DECLINED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
};

const expiresAt = (request: BorrowRequest) =>
  new Date(new Date(request.createdAt).getTime() + REQUEST_TTL_MS).toISOString();

function RequestCard({ request, item }: { request: BorrowRequest; item: Item }) {
  const navigate = useNavigate();
  const { ownerOf, threadFor, setRequestStatus } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ownerFirst = firstName(ownerOf(item).name);
  const status = displayStatus(request);
  const thread = threadFor(item.id, request.borrowerId);

  const cancel = async () => {
    setBusy(true);
    const result = await setRequestStatus(request.id, "cancelled");
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <article className={`activity-card status-${status}`}>
      <button className="activity-item" onClick={() => navigate(`/items/${item.id}`)}>
        <img src={photoSrc(item)} alt="" />
        <div>
          <span className="status-tag">{STATUS_LABEL[status]}</span>
          <h3>{item.title}</h3>
          <p>
            {formatRange(request.start, request.end)} · ${request.total} total
          </p>
        </div>
        <Icon name="chevron" />
      </button>

      {status === "pending" ? (
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
                  {ownerFirst} has until {formatTime(expiresAt(request))} to respond
                </p>
              </div>
            </div>
            <div>
              <span>3</span>
              <div>
                <b>Meet & pick up</b>
                <p>{pickupOf(item)}</p>
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
      ) : (
        <div className="closed-note">
          {status === "expired" && <p>{ownerFirst} didn’t respond within 2 hours, so this request expired.</p>}
          {status === "cancelled" && <p>You cancelled this request.</p>}
          {status === "declined" && <p>{ownerFirst} couldn’t lend it for these dates.</p>}
          {status === "approved" && (
            <p>
              {ownerFirst} approved it. Meet at {pickupOf(item)} and pay ${request.total} at pickup.
            </p>
          )}
          {status === "approved" && thread ? (
            <Link className="primary link-button" to={`/messages/${thread.id}`}>
              <Icon name="message" /> Plan pickup
            </Link>
          ) : (
            <button className="secondary" onClick={() => navigate(`/explore?q=${encodeURIComponent(item.category)}`)}>
              Find similar items
            </button>
          )}
        </div>
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
  const { person, threadFor, setRequestStatus } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const borrower = person(request.borrowerId);
  const borrowerFirst = firstName(borrower.name);
  const status = displayStatus(request);
  const thread = threadFor(item.id, request.borrowerId);

  const decide = async (next: "approved" | "declined") => {
    setBusy(true);
    setError("");
    const result = await setRequestStatus(request.id, next);
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <article className={`activity-card lender-card status-${status}`}>
      <div className="borrower">
        <div className="avatar violet">{initials(borrower.name)}</div>
        <div>
          <h3>
            <Link to={`/people/${borrower.id}`} className="person-link">
              {borrower.name}
            </Link>{" "}
            wants your {item.title}
          </h3>
          <p>
            {borrower.program ? `${borrower.program} · ` : ""}
            {formatWhen(request.createdAt)}
          </p>
        </div>
        <span className="status-tag">{STATUS_LABEL[status]}</span>
      </div>
      <div className="request-facts">
        <div>
          <span>DATES</span>
          <b>{formatRange(request.start, request.end)}</b>
        </div>
        <div>
          <span>PICKUP</span>
          <b>{pickupOf(item)}</b>
        </div>
        <div>
          <span>YOU EARN</span>
          <b>${request.total}</b>
        </div>
      </div>
      {status === "pending" && (
        <>
          <p className="decide-note">Respond by {formatTime(expiresAt(request))} or the request expires.</p>
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
      {status === "approved" && (
        <div className="approved-banner">
          <Icon name="check" />
          <div>
            <b>You accepted</b>
            <p>Coordinate pickup with {borrowerFirst} in Messages.</p>
          </div>
        </div>
      )}
      {status !== "pending" && status !== "approved" && (
        <div className="closed-note">
          <p>
            {status === "declined" && "You declined this request."}
            {status === "cancelled" && `${borrowerFirst} cancelled this request.`}
            {status === "expired" && "This request expired after 2 hours without a response."}
          </p>
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
    open: list.filter((request) => displayStatus(request) === "pending"),
    closed: list.filter((request) => displayStatus(request) !== "pending"),
  };
}

function Borrowing() {
  const { requests, findItem } = useStore();
  const { open, closed } = split(requests);

  if (!requests.length) {
    return (
      <EmptyState
        title="No requests yet"
        body="When you request an item, you’ll track approval and pickup here."
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
      {open.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>{open.length === 1 ? "Your request" : "Your requests"}</h2>
            <span>
              <i /> Waiting for a response
            </span>
          </div>
          <div className="activity-list">{render(open)}</div>
          <div className="certainty">
            <Icon name="shield" />
            <div>
              <b>No awkward follow-ups.</b>
              <p>If a lender doesn’t respond in 2 hours, the request expires and you can find another.</p>
            </div>
          </div>
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
    </>
  );
}

function Lending() {
  const { incoming, findItem, myListings } = useStore();
  const { open, closed } = split(incoming);

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
      {open.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>Needs your response</h2>
            <span>
              <i /> {open.length} waiting
            </span>
          </div>
          <div className="activity-list">{render(open)}</div>
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
    </>
  );
}

export default function Activity() {
  const { incoming } = useStore();
  const waiting = incoming.filter((request) => displayStatus(request) === "pending").length;
  const [tab, setTab] = useState<"borrowing" | "lending">(waiting ? "lending" : "borrowing");
  return (
    <div className="container narrow activity-page">
      <h1 className="page-title">Activity</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "borrowing"} className={tab === "borrowing" ? "active" : ""} onClick={() => setTab("borrowing")}>
          Borrowing
        </button>
        <button role="tab" aria-selected={tab === "lending"} className={tab === "lending" ? "active" : ""} onClick={() => setTab("lending")}>
          Lending {waiting > 0 && <span>{waiting}</span>}
        </button>
      </div>
      {tab === "borrowing" ? <Borrowing /> : <Lending />}
    </div>
  );
}
