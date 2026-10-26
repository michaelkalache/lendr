import { Link, useParams } from "react-router-dom";
import { firstName, photoSrc } from "../data";
import { formatRange } from "../dates";
import { Icon } from "../Icon";
import { useStore } from "../store";
import NotFound from "./NotFound";

export default function Confirmed() {
  const { requestId } = useParams();
  const { requests, findItem, ownerOf, threadFor, me } = useStore();
  const request = requests.find((entry) => entry.id === requestId);
  const item = request ? findItem(request.itemId) : undefined;
  if (!request || !item || !me) return <NotFound />;
  const ownerFirst = firstName(ownerOf(item).name);
  const thread = threadFor(item.id, me.id);

  return (
    <div className="success-page">
      <div className="success-inner">
        <div className="success-mark">
          <Icon name="check" size={38} />
        </div>
        <div className="eyebrow">REQUEST SENT</div>
        <h1>You’re one step closer.</h1>
        <p className="success-lede">
          {ownerFirst} can see your request now. You’ll get a clear yes or no within 2 hours, or the request expires on
          its own.
        </p>

        <div className="request-ticket">
          <div className="ticket-item">
            <img src={photoSrc(item)} alt="" />
            <div>
              <span>PENDING APPROVAL</span>
              <h3>{item.title}</h3>
              <p>
                {formatRange(request.start, request.end)} · ${request.total} total
              </p>
            </div>
          </div>
          <hr />
          <div className="timeline-mini">
            <span className="done">
              <Icon name="check" size={12} />
            </span>
            <i />
            <span>2</span>
            <i />
            <span>3</span>
          </div>
          <div className="timeline-labels">
            <b>Requested</b>
            <span>Approved</span>
            <span>Pickup</span>
          </div>
        </div>

        <div className="success-actions">
          <Link className="primary link-button" to="/activity">
            View request status
          </Link>
          {thread && (
            <Link className="secondary link-button" to={`/messages/${thread.id}`}>
              <Icon name="message" /> Message {ownerFirst}
            </Link>
          )}
        </div>
        <div className="alert-note">
          <Icon name="bell" />
          <span>Activity updates the moment {ownerFirst} responds.</span>
        </div>
        <Link to="/" className="text-link success-home">
          Keep browsing
        </Link>
      </div>
    </div>
  );
}
