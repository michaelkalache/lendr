import { EmptyState } from "../components";

export default function NotFound() {
  return (
    <div className="container narrow">
      <EmptyState
        title="We couldn’t find that page"
        body="The listing or request may have been removed, or the link is mistyped."
        action={{ to: "/", label: "Back to Discover" }}
      />
    </div>
  );
}
