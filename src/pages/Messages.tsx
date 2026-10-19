import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BackLink, EmptyState } from "../components";
import { firstName, getOwner, initials, photoSrc, pickupOf } from "../data";
import { formatTime, formatWhen } from "../dates";
import { Icon } from "../Icon";
import { useStore, type Thread } from "../store";

function ThreadView({ thread }: { thread: Thread }) {
  const { dispatch, findItem } = useStore();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(thread.messages.length);
  const owner = getOwner(thread.ownerId);
  const item = findItem(thread.itemId)!;
  const ownerFirst = firstName(owner.name);

  useEffect(() => {
    // Desktop: the thread pane scrolls on its own, so keep it pinned to the newest message.
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    // Mobile: the page scrolls, so follow along when a new message is added.
    if (thread.messages.length > lastCount.current) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
    lastCount.current = thread.messages.length;
  }, [thread.messages.length]);

  const send = (text = draft) => {
    const message = text.trim();
    if (!message) return;
    dispatch({ type: "sendMessage", ownerId: owner.id, text: message });
    setDraft("");
  };

  return (
    <section className="thread" aria-label={`Conversation with ${owner.name}`}>
      <div className="mobile-only thread-back">
        <BackLink to="/messages" label="All messages" />
      </div>
      <div className="conversation-head">
        <div className="conversation-person">
          <span className="avatar">{initials(owner.name)}</span>
          <span>
            <b>{owner.name}</b>
            <small>
              <i /> Usually replies in {owner.responseMins} min · UCI verified
            </small>
          </span>
        </div>
        <Link className="chat-item" to={`/items/${item.id}`}>
          <img src={photoSrc(item)} alt="" />
          <span>
            <small>ABOUT THIS ITEM</small>
            <b>{item.title}</b>
            <em>${item.price}/day · Available</em>
          </span>
          <Icon name="chevron" />
        </Link>
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-thread" aria-live="polite">
          {thread.messages.length === 0 && (
            <p className="chat-empty">Say hi to {ownerFirst} — ask about the item, dates, or pickup.</p>
          )}
          {thread.messages.map((message, index) => {
            const prev = thread.messages[index - 1];
            const showDay = !prev || new Date(prev.at).toDateString() !== new Date(message.at).toDateString();
            return (
              <div key={message.id} className="chat-row">
                {showDay && <div className="chat-date">{formatWhen(message.at).split(" at ")[0].toUpperCase()}</div>}
                {message.from === "system" ? (
                  <div className="system-message">
                    <Icon name="check" size={14} />
                    <span>{message.text}</span>
                  </div>
                ) : (
                  <div className={`bubble ${message.from === "me" ? "mine" : "theirs"}`}>
                    {message.text}
                    <time dateTime={message.at}>{formatTime(message.at)}</time>
                  </div>
                )}
              </div>
            );
          })}
          <div className="safety-message">
            <Icon name="shield" size={16} />
            <span>Keep coordination and condition photos here so Lendr can help resolve issues.</span>
          </div>
        </div>
      </div>

      <div className="composer-wrap">
        <div className="quick-replies">
          <button onClick={() => send(`Is the ${item.title} still available for my dates?`)}>Confirm availability</button>
          <button onClick={() => send(`Can we meet at the ${pickupOf(item)}?`)}>Plan pickup</button>
          <button onClick={() => send("I’ll share a pickup condition photo here.")}>Share condition</button>
        </div>
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor="message-input" className="sr-only">
            Message {ownerFirst}
          </label>
          <input
            id="message-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about the item or meetup…"
            autoComplete="off"
          />
          <button type="submit" aria-label="Send message" disabled={!draft.trim()}>
            <Icon name="send" />
          </button>
        </form>
      </div>
    </section>
  );
}

export default function Messages() {
  const { ownerId } = useParams();
  const { threads, findItem } = useStore();
  const list = Object.values(threads).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const selected = (ownerId && threads[ownerId]) || (!ownerId ? list[0] : undefined);

  if (!list.length) {
    return (
      <div className="container narrow">
        <h1 className="page-title">Messages</h1>
        <EmptyState
          title="No conversations yet"
          body="Message a lender from any listing to ask about availability or pickup."
          action={{ to: "/explore", label: "Browse items" }}
        />
      </div>
    );
  }

  return (
    <div className={`container messages-page ${ownerId ? "has-thread" : ""}`}>
      <h1 className="page-title messages-title">Messages</h1>
      <div className="messages-layout">
        <aside className="thread-list" aria-label="Conversations">
          {list.map((thread) => {
            const owner = getOwner(thread.ownerId);
            const item = findItem(thread.itemId);
            const last = thread.messages[thread.messages.length - 1];
            const active = selected?.ownerId === thread.ownerId;
            return (
              <Link key={thread.ownerId} to={`/messages/${thread.ownerId}`} className={`thread-link ${active ? "active" : ""}`}>
                <span className="avatar">{initials(owner.name)}</span>
                <span className="thread-text">
                  <b>{owner.name}</b>
                  <small>{item?.title}</small>
                  <em>{last ? (last.from === "me" ? `You: ${last.text}` : last.text) : "No messages yet"}</em>
                </span>
                <time>{last ? formatTime(last.at) : ""}</time>
              </Link>
            );
          })}
        </aside>
        {selected ? (
          <ThreadView key={selected.ownerId} thread={selected} />
        ) : (
          <EmptyState title="Conversation not found" body="Pick a conversation from the list." />
        )}
      </div>
    </div>
  );
}
