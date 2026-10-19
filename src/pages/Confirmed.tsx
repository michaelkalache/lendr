import { Link, useNavigate, useParams } from "react-router-dom";
import { firstName, getOwner, photoSrc } from "../data";
import { formatRange } from "../dates";
import { Icon } from "../Icon";
import { useStore } from "../store";
import NotFound from "./NotFound";

export default function Confirmed() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { requests, dispatch, findItem } = useStore();
  const request = requests.find((entry) => entry.id === requestId);
  const item = request ? findItem(request.itemId) : undefined;
  if (!request || !item) return <NotFound />;
  const owner = getOwner(item.ownerId);
  const ownerFirst = firstName(owner.name);

  return (
    <div className="success-page">
      <div className="success-inner">
        <div className="success-mark">
          <Icon name="check" size={38} />
        </div>
        <div className="eyebrow">REQUEST SENT</div>
        <h1>You’re one step closer.</h1>
        <p className="success-lede">
          {ownerFirst} has been notified. We’ll give you a clear yes or no—usually within {owner.responseMins} minutes.
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
          <button
            className="secondary"
            onClick={() => {
              dispatch({ type: "openThread", ownerId: owner.id, itemId: item.id });
              navigate(`/messages/${owner.id}`);
            }}
          >
            <Icon name="message" /> Message {ownerFirst}
          </button>
        </div>
        <div className="alert-note">
          <Icon name="bell" />
          <span>We’ll notify you the moment {ownerFirst} responds.</span>
        </div>
        <Link to="/" className="text-link success-home">
          Keep browsing
        </Link>
      </div>
    </div>
  );
}
