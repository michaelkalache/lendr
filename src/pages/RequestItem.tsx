import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { BackLink } from "../components";
import { ME, firstName, getOwner, photoSrc, pickupOf, rentalCost } from "../data";
import { addDays, daysInclusive, formatDay, formatMonth, sameDay, startOfDay, toISODate } from "../dates";
import { Icon } from "../Icon";
import { makeId, useStore } from "../store";
import NotFound from "./NotFound";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_DAYS = 14;

function Calendar({
  start,
  end,
  onPick,
}: {
  start: Date | null;
  end: Date | null;
  onPick: (day: Date) => void;
}) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => new Date((start ?? today).getFullYear(), (start ?? today).getMonth(), 1));
  const atCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: month.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const shift = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)} disabled={atCurrentMonth}>
          ‹
        </button>
        <b>{formatMonth(month)}</b>
        <button type="button" aria-label="Next month" onClick={() => shift(1)}>
          ›
        </button>
      </div>
      <div className="weekdays">
        {WEEKDAYS.map((day, i) => (
          <span key={i}>{day}</span>
        ))}
      </div>
      <div className="days">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const isEdge = (start && sameDay(day, start)) || (end && sameDay(day, end));
          const inRange = start && end && day > start && day < end;
          const isPast = day < today;
          return (
            <button
              type="button"
              key={i}
              disabled={isPast}
              aria-pressed={Boolean(isEdge)}
              aria-label={formatDay(day)}
              className={[isEdge ? "selected" : "", inRange ? "range" : "", sameDay(day, today) ? "today" : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onPick(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RequestItem() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { dispatch, findItem } = useStore();
  const tomorrow = addDays(startOfDay(new Date()), 1);
  const [start, setStart] = useState<Date | null>(tomorrow);
  const [end, setEnd] = useState<Date | null>(addDays(tomorrow, 2));
  const [error, setError] = useState("");

  const item = findItem(itemId);
  if (!item) return <NotFound />;
  if (item.ownerId === ME) return <Navigate to={`/items/${item.id}`} replace />;
  const owner = getOwner(item.ownerId);
  const ownerFirst = firstName(owner.name);

  const pick = (day: Date) => {
    setError("");
    if (!start || end || day < start) {
      setStart(day);
      setEnd(null);
      return;
    }
    if (daysInclusive(start, day) > MAX_DAYS) {
      setError(`Borrows can be up to ${MAX_DAYS} days. Pick an earlier return date.`);
      return;
    }
    setEnd(day);
  };

  const returnDay = end ?? start;
  const days = start && returnDay ? daysInclusive(start, returnDay) : 0;
  const total = rentalCost(item.price, days);
  const ready = Boolean(start && end);

  const send = () => {
    if (!start || !end) {
      setError("Pick a return date to continue.");
      return;
    }
    const id = makeId();
    dispatch({
      type: "createRequest",
      request: {
        id,
        itemId: item.id,
        start: toISODate(start),
        end: toISODate(end),
        days,
        total,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    });
    navigate(`/requests/${id}`, { replace: true });
  };

  return (
    <div className="container request-page">
      <BackLink to={`/items/${item.id}`} label="Back to item" />
      <h1 className="page-title">Request item</h1>
      <div className="split">
        <div className="split-main">
          <div className="mini-item">
            <img src={photoSrc(item)} alt="" />
            <div>
              <b>{item.title}</b>
              <p>
                ${item.price} / day · {owner.name}
              </p>
            </div>
          </div>

          <section className="request-step">
            <div className="step-label">
              <span>1</span>
              <div>
                <h2>Choose your dates</h2>
                <p>
                  Tap a start day, then a return day · {ownerFirst} usually responds within {owner.responseMins} minutes
                </p>
              </div>
            </div>
            <Calendar start={start} end={end} onPick={pick} />
            <div className="date-summary">
              <div>
                <span>START</span>
                <b>{start ? formatDay(start) : "Pick a day"}</b>
                <p>After 2:00 PM</p>
              </div>
              <Icon name="send" />
              <div>
                <span>RETURN</span>
                <b>{end ? formatDay(end) : "Pick a day"}</b>
                <p>Before 6:00 PM</p>
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className="request-step">
            <div className="step-label">
              <span>2</span>
              <div>
                <h2>Pickup preference</h2>
              </div>
            </div>
            <div className="choice selected-choice">
              <span>
                <Icon name="map" />
              </span>
              <div>
                <b>{pickupOf(item)}</b>
                <p>On campus · suggested by {ownerFirst}</p>
              </div>
              <i>
                <Icon name="check" size={14} />
              </i>
            </div>
          </section>

          <div className="responsibility-note">
            <Icon name="shield" />
            <p>
              <b>Damage responsibility</b>
              <br />
              By requesting, you agree to cover verified damage beyond normal wear, up to ${item.coverage}. Lendr
              reviews pickup/return photos and pauses payment during disputes.
            </p>
          </div>
        </div>

        <aside className="split-aside">
          <div className="action-card">
            <div className="cost-row">
              <span>Estimated total</span>
              <b>${total}</b>
              <p>
                {days} {days === 1 ? "day" : "days"} × ${item.price}
                {total < days * item.price ? " · weekly cap applied" : ""} · No deposit
              </p>
            </div>
            <button className="primary" onClick={send} aria-disabled={!ready}>
              Send request to {ownerFirst}
            </button>
            <p className="action-note">You won’t be charged until {ownerFirst} accepts.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
