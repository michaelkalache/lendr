import { Link } from "react-router-dom";
import { BackLink } from "../components";
import { Icon, type IconName } from "../Icon";

const GUARDRAILS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "UCI emails only",
    body: "Every account needs an @uci.edu address. The database itself rejects any other email, so the rule can’t be skipped.",
  },
  {
    icon: "flag",
    title: "Report listings and accounts",
    body: "Report a listing that’s prohibited, unsafe, or misleading, or an account that’s harassing people or isn’t a real student. Reports are private.",
  },
  {
    icon: "layers",
    title: "Automatic hiding",
    body: "When three different students report the same listing, it’s hidden from everyone right away until the lendr team reviews it. The owner can’t un-hide it.",
  },
  {
    icon: "star",
    title: "Reviews from real borrows only",
    body: "Only someone whose borrow was approved can review that item, once per borrow. Ratings can’t be padded by friends or by the lender.",
  },
  {
    icon: "check",
    title: "Lenders approve every borrow",
    body: "Nothing is lent automatically. Requests expire after 2 hours without an answer, and prices are calculated by the server, not the browser.",
  },
  {
    icon: "message",
    title: "Private, in-app coordination",
    body: "Only the two people in a conversation can read it. Keep pickup plans and condition photos in Messages so any issue can be settled fairly.",
  },
  {
    icon: "key",
    title: "Account recovery",
    body: "Each account gets a one-time recovery code for resetting a forgotten password. Codes are stored scrambled, and reset attempts are rate-limited.",
  },
];

export default function Safety() {
  return (
    <div className="container narrow safety-page">
      <BackLink to="/account" label="Back to account" />
      <h1 className="page-title">Trust & safety</h1>
      <p className="page-lede">
        lendr only works if students can trust each other. These guardrails are built into the site and the database, not
        just the rules.
      </p>

      <div className="guardrails">
        {GUARDRAILS.map((rule) => (
          <article key={rule.title} className="guardrail">
            <span>
              <Icon name={rule.icon} />
            </span>
            <div>
              <h2>{rule.title}</h2>
              <p>{rule.body}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="safety-section">
        <h2>Not allowed on lendr</h2>
        <p>
          Weapons, alcohol, drugs or vapes, prescription items, stolen or recalled goods, and anything that isn’t yours to
          lend. Listings like these get removed.
        </p>
      </section>

      <section className="safety-section">
        <h2>Meeting up</h2>
        <ul>
          <li>Meet in a public spot on campus, like the Student Center, in daylight when you can.</li>
          <li>Take a photo of the item at pickup and at return, and share it in the chat.</li>
          <li>Pay the lender at pickup. Never send money before you’ve seen the item.</li>
        </ul>
      </section>

      <div className="safety-emergency">
        <Icon name="shield" />
        <p>
          <b>In danger or need help right now?</b> Call 911, or the UCI Police 24-hour line at{" "}
          <a href="tel:9498245223">(949) 824-5223</a>.
        </p>
      </div>

      <p className="muted-line safety-foot">
        See something wrong? Use <b>Report listing</b> on any item page or <b>Report account</b> on any profile.{" "}
        <Link to="/explore">Back to browsing</Link>
      </p>
    </div>
  );
}
