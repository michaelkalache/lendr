import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SpotMap } from "../handoff";
import { Icon, type IconName } from "../Icon";
import { CAMPUS_MAP_URL, SPOT_GROUPS, SPOTS, spotMapUrl } from "../spots";

type Step = { title: string; body: string };

const BORROW: Step[] = [
  { title: "Find something", body: "Browse Discover or search. Sample listings are marked and can’t be borrowed; everything else is from a real Anteater." },
  { title: "Request your dates and spots", body: "Pick a start and return day (up to 14 days), and where you’ll pick it up and drop it back. The price is shown before you send." },
  { title: "Wait for a yes", body: "The lender has 24 hours to accept or decline. If they don’t answer, the request expires on its own so you can find another." },
  { title: "Pick it up", body: "The lender leaves the item at the pickup spot and marks it in Activity, with a note on exactly where. Grab it, check it, and tap “I picked it up”." },
  { title: "Pay the lender", body: "lendr doesn’t take payments yet. Pay the lender directly (Venmo, Zelle, or cash) once you have the item." },
  { title: "Return it", body: "By your return day, leave it at the return spot and tap “I returned it”, adding a note on where you left it." },
  { title: "Rate the item", body: "Once the lender confirms it’s back, you can leave a star rating and review of the item for the next borrower." },
];

const LEND: Step[] = [
  { title: "List it", body: "Tap “List an item”. Add a real photo of the item (required), pick a category, and say what’s included, the daily price, its replacement value, and the spot where you’ll usually leave it." },
  { title: "Approve requests", body: "Requests show up in Activity → Lending. Accept or decline within 24 hours. You’ll see the borrower’s dates, spots, and profile first." },
  { title: "Drop it off", body: "Leave the item at the pickup spot before the start day, then tap “I dropped it off”. Add a note like “front desk, bag with my name”." },
  { title: "Get it back", body: "When the borrower marks it returned, collect it from the return spot, check it over, and tap “I got it back”. That closes the borrow." },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Do I ever have to meet the other person?", a: "No. Every handoff happens through a campus drop-off spot. You can still message each other in the app to sort out timing." },
  { q: "Can I change the spot?", a: "Yes. Borrowers choose pickup and return spots when they request. When the lender drops it off, or the borrower returns it, they can pick a different spot and say exactly where they left it." },
  { q: "Can I cancel?", a: "Borrowers can cancel a pending request any time. After it’s approved, either person can cancel until the item is picked up. After that, it has to be returned." },
  { q: "What if it’s late?", a: "Activity marks it overdue after the return day, for both people. Message the borrower first; if it doesn’t come back, report their account." },
  { q: "What if the item isn’t at the spot, or comes back damaged?", a: "Message the other person right away with photos. If you can’t sort it out, report the account or listing. The borrower covers verified damage up to the listing’s replacement value." },
  { q: "Who can see my messages?", a: "Only you and the other person in that conversation." },
  { q: "I forgot my password.", a: "Use “Forgot password?” on the log-in page with the recovery code you saved when you signed up. You can make a new code in Account." },
];

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="help-steps">
      {steps.map((step, i) => (
        <li key={step.title}>
          <span>{i + 1}</span>
          <div>
            <b>{step.title}</b>
            <p>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const SECTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "borrowing", label: "Borrowing", icon: "search" },
  { id: "lending", label: "Lending", icon: "plus" },
  { id: "spots", label: "Drop-off spots", icon: "map" },
  { id: "faq", label: "Questions", icon: "help" },
];

export default function Help({ signedIn = true }: { signedIn?: boolean }) {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <div className="container narrow help-page">
      <h1 className="page-title">How lendr works</h1>
      <p className="page-lede">
        Borrow from other UCI students for a few dollars a day, or lend what you aren’t using. No meetups: items are left
        at campus drop-off spots and returned the same way.
      </p>

      <nav className="help-nav" aria-label="Help topics">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            <Icon name={section.icon} size={16} /> {section.label}
          </a>
        ))}
      </nav>

      <section className="help-section" id="borrowing">
        <h2>How to borrow</h2>
        <Steps steps={BORROW} />
        {signedIn && (
          <Link to="/explore" className="primary link-button help-cta">
            Browse items
          </Link>
        )}
      </section>

      <section className="help-section" id="lending">
        <h2>How to lend</h2>
        <Steps steps={LEND} />
        <p className="field-hint">
          Weekly borrows are capped at 4 days’ price. You approve every borrow, and you can edit or remove a listing any
          time from its page.
        </p>
        {signedIn && (
          <Link to="/list" className="secondary link-button help-cta">
            List an item
          </Link>
        )}
      </section>

      <section className="help-section" id="spots">
        <h2>Drop-off spots</h2>
        <p>
          Pick from these public campus spots. When you drop something off, add a short note on exactly where (for example,
          a desk or a shelf), and pick things up promptly so nothing sits unattended.
        </p>
        <SpotMap spotId="student-center" url={CAMPUS_MAP_URL} label="Show the UCI campus map" />
        <div className="spot-groups">
          {SPOT_GROUPS.map((group) => (
            <div key={group} className="spot-group">
              <h3>{group}</h3>
              <ul>
                {SPOTS.filter((spot) => spot.group === group).map((spot) => (
                  <li key={spot.id}>
                    <a href={spotMapUrl(spot.id)} target="_blank" rel="noreferrer">
                      {spot.name} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="field-hint">
          Locations open on the official <a href={CAMPUS_MAP_URL} target="_blank" rel="noreferrer">UCI campus map</a>.
        </p>
      </section>

      <section className="help-section" id="faq">
        <h2>Questions</h2>
        <div className="faq">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="help-foot">
        <Icon name="shield" />
        <p>
          Something wrong with a listing or a person? Use <b>Report</b> on their page.{" "}
          {signedIn ? <Link to="/safety">How we keep lendr safe</Link> : <Link to="/welcome">Create your account</Link>}
        </p>
      </div>
    </div>
  );
}
