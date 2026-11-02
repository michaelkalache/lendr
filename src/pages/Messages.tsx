import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BackLink, EmptyState } from "../components";
import { firstName, initials, photoSrc, pickupOf } from "../data";
import { formatTime, formatWhen } from "../dates";
import { Icon } from "../Icon";
import { useStore, type ChatMessage, type Thread } from "../store";
import { ReportButton } from "../trust";

function describeSystem(message: ChatMessage, actor: string) {
  const text = message.text.charAt(0).toLowerCase() + message.text.slice(1);
  return `${actor} ${text}`;
}

function ThreadView({ thread }: { thread: Thread }) {
  const { findItem, person, me, sendMessage } = useStore();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(thread.messages.length);
  const other = person(thread.otherId);
  const otherFirst = firstName(other.name);
  const item = findItem(thread.itemId)!;
  const iAmLender = thread.ownerId === me?.id;

  useEffect(() => {
    // Desktop: the thread pane scrolls on its own, so keep it pinned to the newest message.
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    // Mobile: the page scrolls, so follow along when a new message arrives.
    if (thread.messages.length > lastCount.current) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
    lastCount.current = thread.messages.length;
  }, [thread.messages.length]);

  const send = async (text = draft) => {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setError("");
    if (text === draft) setDraft("");
    const result = await sendMessage(thread.id, message);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      if (text === draft) setDraft(message);
    }
  };

  const quickReplies = iAmLender
    ? [
        ["Confirm availability", `Yes, the ${item.title} is available for those dates.`],
        ["Plan pickup", `Can we meet at ${pickupOf(item)}? What time works for you?`],
        ["Ask for return photo", "Please share a photo of the item when you return it."],
      ]
    : [
        ["Confirm availability", `Is the ${item.title} still available for my dates?`],
        ["Plan pickup", `Can we meet at ${pickupOf(item)}?`],
        ["Share condition", "I’ll share a pickup condition photo here."],
      ];

  return (
    <section className="thread" aria-label={`Conversation with ${other.name}`}>
      <div className="mobile-only thread-back">
        <BackLink to="/messages" label="All messages" />
      </div>
      <div className="conversation-head">
        <Link to={`/people/${other.id}`} className="conversation-person">
          <span className="avatar">{initials(other.name)}</span>
          <span>
            <b>{other.name}</b>
            <small>
              <i /> {iAmLender ? "Borrower" : "Lender"} · {other.program || "UCI student"} · View profile
            </small>
          </span>
        </Link>
        <Link className="chat-item" to={`/items/${item.id}`}>
          <img src={photoSrc(item)} alt="" />
          <span>
            <small>{iAmLender ? "YOUR ITEM" : "ABOUT THIS ITEM"}</small>
            <b>{item.title}</b>
            <em>${item.price}/day</em>
          </span>
          <Icon name="chevron" />
        </Link>
      </div>

      {!other.sample && (
        <div className="thread-report">
          <ReportButton target={{ userId: other.id }} name={other.name} />
        </div>
      )}
      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-thread" aria-live="polite">
          {thread.messages.length === 0 && (
            <p className="chat-empty">Say hi to {otherFirst} — ask about the item, dates, or pickup.</p>
          )}
          {thread.messages.map((message, index) => {
            const prev = thread.messages[index - 1];
            const showDay = !prev || new Date(prev.at).toDateString() !== new Date(message.at).toDateString();
            const mine = message.senderId === me?.id;
            return (
              <div key={message.id} className="chat-row">
                {showDay && <div className="chat-date">{formatWhen(message.at).split(" at ")[0].toUpperCase()}</div>}
                {message.kind === "system" ? (
                  <div className="system-message">
                    <Icon name="check" size={14} />
                    <span>{describeSystem(message, mine ? "You" : firstName(person(message.senderId).name))}</span>
                  </div>
                ) : (
                  <div className={`bubble ${mine ? "mine" : "theirs"}`}>
                    {message.text}
                    <time dateTime={message.at}>{formatTime(message.at)}</time>
                  </div>
                )}
              </div>
            );
          })}
          <div className="safety-message">
            <Icon name="shield" size={16} />
            <span>Keep coordination and condition photos here so any issue can be settled fairly.</span>
          </div>
        </div>
      </div>

      <div className="composer-wrap">
        <div className="quick-replies">
          {quickReplies.map(([label, text]) => (
            <button key={label} onClick={() => void send(text)} disabled={sending}>
              {label}
            </button>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label htmlFor="message-input" className="sr-only">
            Message {otherFirst}
          </label>
          <input
            id="message-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message ${otherFirst}…`}
            autoComplete="off"
            maxLength={1000}
          />
          <button type="submit" aria-label="Send message" disabled={!draft.trim() || sending}>
            <Icon name="send" />
          </button>
        </form>
      </div>
    </section>
  );
}

export default function Messages() {
  const { threadId } = useParams();
  const { threads, findItem, person, me } = useStore();
  const selected = threadId ? threads.find((thread) => thread.id === threadId) : threads[0];

  if (!threads.length) {
    return (
      <div className="container narrow">
        <h1 className="page-title">Messages</h1>
        <EmptyState
          title="No conversations yet"
          body="Message a lender from any listing, or wait for a borrower to reach out about yours."
          action={{ to: "/explore", label: "Browse items" }}
        />
      </div>
    );
  }

  return (
    <div className={`container messages-page ${threadId ? "has-thread" : ""}`}>
      <h1 className="page-title messages-title">Messages</h1>
      <div className="messages-layout">
        <aside className="thread-list" aria-label="Conversations">
          {threads.map((thread) => {
            const other = person(thread.otherId);
            const item = findItem(thread.itemId);
            const last = thread.messages[thread.messages.length - 1];
            const preview = !last
              ? "No messages yet"
              : last.kind === "system"
                ? describeSystem(last, last.senderId === me?.id ? "You" : firstName(other.name))
                : last.senderId === me?.id
                  ? `You: ${last.text}`
                  : last.text;
            return (
              <Link
                key={thread.id}
                to={`/messages/${thread.id}`}
                className={`thread-link ${selected?.id === thread.id ? "active" : ""}`}
              >
                <span className="avatar">{initials(other.name)}</span>
                <span className="thread-text">
                  <b>{other.name}</b>
                  <small>
                    {thread.ownerId === me?.id ? "Your " : ""}
                    {item?.title}
                  </small>
                  <em>{preview}</em>
                </span>
                <time>{last ? formatTime(last.at) : ""}</time>
              </Link>
            );
          })}
        </aside>
        {selected ? (
          <ThreadView key={selected.id} thread={selected} />
        ) : (
          <EmptyState title="Conversation not found" body="Pick a conversation from the list." />
        )}
      </div>
    </div>
  );
}
