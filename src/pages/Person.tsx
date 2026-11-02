import { Link, useParams } from "react-router-dom";
import { BackLink, EmptyState, ItemCard } from "../components";
import { firstName, initials } from "../data";
import { Icon } from "../Icon";
import { useStore } from "../store";
import { ReportButton } from "../trust";
import NotFound from "./NotFound";

const joinedLabel = (iso?: string) =>
  iso ? `Joined ${new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : "";

export default function Person() {
  const { personId } = useParams();
  const { person, personExists, allItems, me, lenderRating } = useStore();
  if (!personId || !personExists(personId)) return <NotFound />;
  const profile = person(personId);
  const first = firstName(profile.name);
  const listings = allItems.filter((item) => item.ownerId === personId);
  const isMe = personId === me?.id;
  const rating = profile.sample ? null : lenderRating(personId);

  return (
    <div className="container person-page">
      <BackLink to="/explore" label="Back to listings" />

      {profile.sample && (
        <div className="sample-banner" role="note">
          <Icon name="shield" />
          <span>
            <b>Sample profile.</b> {profile.name} is a made-up lender who shows how lendr works. Their listings, rating,
            and stats are examples, and they can’t be messaged or borrowed from.
          </span>
        </div>
      )}
      {isMe && (
        <div className="publish-banner" role="note">
          <Icon name="profile" />
          <span>
            <b>This is your public profile.</b> It’s what other students see when they tap your name.{" "}
            <Link to="/account">Edit it in Account</Link>
          </span>
        </div>
      )}

      <section className={`person-hero ${profile.sample ? "is-sample" : ""}`}>
        <div className="account-avatar">{initials(profile.name)}</div>
        <div>
          <span>{profile.sample ? "SAMPLE LENDER" : "UCI EMAIL"}</span>
          <h1>{profile.name}</h1>
          <p>{[profile.program, profile.sample ? "Example profile" : joinedLabel(profile.joined)].filter(Boolean).join(" · ") || "UCI student"}</p>
        </div>
      </section>

      <div className="account-stats person-stats">
        <div>
          <strong>{listings.length}</strong>
          <span>Active {listings.length === 1 ? "listing" : "listings"}</span>
        </div>
        {profile.sample ? (
          <>
            <div>
              <strong>{profile.rating}</strong>
              <span>
                <Icon name="star" size={13} filled /> Rating <em className="stat-sample">sample</em>
              </span>
            </div>
            <div>
              <strong>{profile.lends}</strong>
              <span>
                Lends <em className="stat-sample">sample</em>
              </span>
            </div>
          </>
        ) : (
          <>
            <div>
              <strong>{rating ? rating.average.toFixed(1) : "—"}</strong>
              <span>
                <Icon name="star" size={13} filled /> {rating ? `${rating.count} item ${rating.count === 1 ? "review" : "reviews"}` : "No reviews yet"}
              </span>
            </div>
            <div>
              <strong>
                {profile.joined ? new Date(profile.joined).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
              </strong>
              <span>Member since</span>
            </div>
          </>
        )}
      </div>

      <section className="account-section">
        <div className="section-title">
          <div>
            <h2>{isMe ? "Your listings" : `${first}’s listings`}</h2>
            <p>
              {profile.sample
                ? "Sample items — browse them to see how listings look"
                : isMe
                  ? "Everyone on lendr can see and request these"
                  : `Open any item to request it or message ${first}`}
            </p>
          </div>
        </div>
        {listings.length ? (
          <div className="item-grid">
            {listings.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={isMe ? "You haven’t listed anything yet" : `${first} isn’t lending anything right now`}
            body={isMe ? "List something you aren’t using and it shows up here." : "Check back later, or browse other listings."}
            action={isMe ? { to: "/list", label: "List an item" } : { to: "/explore", label: "Browse items" }}
          />
        )}
      </section>

      {!isMe && !profile.sample && (
        <div className="report-row">
          <ReportButton target={{ userId: personId }} name={profile.name} />
          <Link to="/safety" className="text-link small">
            How we keep lendr safe
          </Link>
        </div>
      )}
    </div>
  );
}
