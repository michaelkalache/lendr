import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components";
import { PICKUP_SPOT, firstName, getOwner, photoSrc, photos, pickupOf, type Item } from "../data";
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

function RequestCard({ request, item }: { request: BorrowRequest; item: Item }) {
  const navigate = useNavigate();
  const { dispatch } = useStore();
  const owner = getOwner(item.ownerId);
  const ownerFirst = firstName(owner.name);
  const status = displayStatus(request);
  const expiresAt = new Date(new Date(request.createdAt).getTime() + REQUEST_TTL_MS).toISOString();

  const message = () => {
    dispatch({ type: "openThread", ownerId: owner.id, itemId: item.id });
    navigate(`/messages/${owner.id}`);
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
                  {ownerFirst} usually replies within {owner.responseMins} min · expires {formatTime(expiresAt)}
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
            <button className="secondary" onClick={() => dispatch({ type: "cancelRequest", id: request.id })}>
              Cancel request
            </button>
            <button className="primary" onClick={message}>
              <Icon name="message" /> Message {ownerFirst}
            </button>
          </div>
        </>
      ) : (
        <div className="closed-note">
          {status === "expired" && (
            <p>
              {ownerFirst} didn’t respond within 2 hours, so this request expired. You weren’t charged.
            </p>
          )}
          {status === "cancelled" && <p>You cancelled this request. You weren’t charged.</p>}
          {status === "declined" && <p>{ownerFirst} couldn’t lend it for these dates. You weren’t charged.</p>}
          {status === "approved" && <p>{ownerFirst} approved your request. Coordinate pickup in Messages.</p>}
          <button className="secondary" onClick={() => navigate(`/explore?q=${encodeURIComponent(item.category)}`)}>
            Find similar items
          </button>
        </div>
      )}
    </article>
  );
}

function Borrowing() {
  const { requests, findItem } = useStore();
  const active = requests.filter((request) => displayStatus(request) === "pending");
  const past = requests.filter((request) => displayStatus(request) !== "pending");

  if (!requests.length) {
    return (
      <EmptyState
        title="No requests yet"
        body="When you request an item, you’ll track approval, pickup, and return here."
        action={{ to: "/explore", label: "Browse items" }}
      />
    );
  }

  return (
    <>
      {active.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>{active.length === 1 ? "Your request" : "Your requests"}</h2>
            <span>
              <i /> Waiting for a response
            </span>
          </div>
          <div className="activity-list">
            {active.map((request) => {
              const item = findItem(request.itemId);
              return item ? <RequestCard key={request.id} request={request} item={item} /> : null;
            })}
          </div>
          <div className="certainty">
            <Icon name="shield" />
            <div>
              <b>No awkward follow-ups.</b>
              <p>If a lender doesn’t respond in 2 hours, the request expires and we’ll help you find another.</p>
            </div>
          </div>
        </>
      )}
      {past.length > 0 && (
        <>
          <div className="activity-heading">
            <h2>Past requests</h2>
          </div>
          <div className="activity-list">
            {past.map((request) => {
              const item = findItem(request.itemId);
              return item ? <RequestCard key={request.id} request={request} item={item} /> : null;
            })}
          </div>
        </>
      )}
    </>
  );
}

function Lending() {
  const { incoming, dispatch } = useStore();
  const borrower = "Taylor N.";
  return (
    <>
      <div className="activity-heading">
        <h2>Incoming request</h2>
        <span className={incoming === "accepted" ? "approved" : incoming === "declined" ? "muted" : ""}>
          <i /> {incoming === "accepted" ? "Approved" : incoming === "declined" ? "Declined" : "Needs response"}
        </span>
      </div>
      <article className="activity-card lender-card">
        <div className="borrower">
          <div className="avatar violet">TN</div>
          <div>
            <h3>{borrower} wants your tent</h3>
            <p>
              <Icon name="star" size={13} filled /> 5.0 · UCI verified
            </p>
          </div>
        </div>
        <img className="lender-image" src={photos.tent} alt="Orange two-person tent" />
        <div className="request-facts">
          <div>
            <span>DATES</span>
            <b>3 days</b>
          </div>
          <div>
            <span>PICKUP</span>
            <b>Student Center</b>
          </div>
          <div>
            <span>YOU EARN</span>
            <b>$18</b>
          </div>
        </div>
        {incoming === "pending" && (
          <div className="decision">
            <button className="secondary" onClick={() => dispatch({ type: "setIncoming", status: "declined" })}>
              Decline
            </button>
            <button className="primary" onClick={() => dispatch({ type: "setIncoming", status: "accepted" })}>
              Accept request
            </button>
          </div>
        )}
        {incoming === "accepted" && (
          <div className="approved-banner">
            <Icon name="check" />
            <div>
              <b>Request accepted</b>
              <p>{firstName(borrower)} will meet you at the {PICKUP_SPOT}.</p>
            </div>
          </div>
        )}
        {incoming === "declined" && (
          <div className="closed-note">
            <p>You declined this request. {firstName(borrower)} has been notified.</p>
            <button className="secondary" onClick={() => dispatch({ type: "setIncoming", status: "pending" })}>
              Undo
            </button>
          </div>
        )}
      </article>
    </>
  );
}

export default function Activity() {
  const [tab, setTab] = useState<"borrowing" | "lending">("borrowing");
  const { incoming } = useStore();
  return (
    <div className="container narrow activity-page">
      <h1 className="page-title">Activity</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "borrowing"} className={tab === "borrowing" ? "active" : ""} onClick={() => setTab("borrowing")}>
          Borrowing
        </button>
        <button role="tab" aria-selected={tab === "lending"} className={tab === "lending" ? "active" : ""} onClick={() => setTab("lending")}>
          Lending {incoming === "pending" && <span>1</span>}
        </button>
      </div>
      {tab === "borrowing" ? <Borrowing /> : <Lending />}
    </div>
  );
}
