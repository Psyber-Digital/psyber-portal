"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Contact, ContactStatus } from "@/lib/types";
import {
  CORRESPONDENCES,
  LIST_TARGET,
  MEDIUMS,
  RELEVANCES,
  STATUSES,
} from "@/lib/contacts";
import {
  addContact,
  addNames,
  deleteContact,
  importContacts,
  updateContact,
} from "./actions";

type Panel = "none" | "one" | "paste" | "import";

// The server renders in UTC and the browser in local time, so a date derived
// from `new Date()` during hydration can disagree with what the server sent —
// which would make the "follow-up due" highlight flicker for anyone whose local
// date differs from UTC. Start from the server's date, adopt the browser's on
// mount.
function useToday(serverToday: string) {
  const [today, setToday] = useState(serverToday);
  useEffect(() => {
    const local = () => {
      const d = new Date();
      setToday(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate(),
        ).padStart(2, "0")}`,
      );
    };
    local();
    const id = setInterval(local, 3_600_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

export function OutreachView({
  contacts,
  serverToday,
  weekCutoff,
}: {
  contacts: Contact[];
  serverToday: string;
  // ISO timestamp for "7 days ago", computed on the server and passed in so the
  // "added this week" figure is identical in the server render and the hydration.
  weekCutoff: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const today = useToday(serverToday);
  const [panel, setPanel] = useState<Panel>("none");
  const [guideOpen, setGuideOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);

  const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
  const [search, setSearch] = useState("");

  const flash = (kind: "ok" | "warn", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 7000);
  };

  const stats = useMemo(() => {
    const by = (fn: (c: Contact) => boolean) => contacts.filter(fn).length;
    return {
      total: contacts.length,
      thisWeek: by((c) => c.created_at >= weekCutoff),
      relevant: by((c) => c.relevance === "relevant"),
      connectors: by((c) => c.relevance === "irrelevant"),
      uncategorised: by((c) => c.relevance === "unsure"),
      contacted: by((c) => c.status !== "not_contacted"),
      replied: by((c) =>
        ["replied", "interested", "converted", "follow_up_required"].includes(c.status),
      ),
      converted: by((c) => c.status === "converted"),
      dueToday: by(
        (c) =>
          !!c.next_followup_date &&
          c.next_followup_date <= today &&
          !["converted", "not_interested"].includes(c.status),
      ),
    };
  }, [contacts, today, weekCutoff]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (q && !`${c.name} ${c.email} ${c.phone} ${c.notes}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [contacts, statusFilter, search]);

  return (
    <>
      {guideOpen && <GuideDialog onClose={() => setGuideOpen(false)} />}

      {notice && (
        <div
          className={`mb-4 rounded-[10px] border px-3.5 py-2.5 text-[13px] ${
            notice.kind === "ok"
              ? "border-good/40 bg-good/[0.1] text-good"
              : "border-orange/40 bg-orange/[0.1] text-orange"
          }`}
        >
          {notice.text}
        </div>
      )}

      <section className="psy-card mb-4 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <TargetRing count={stats.total} target={LIST_TARGET} thisWeek={stats.thisWeek} />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
              <h2 className="font-disp text-[15px] font-semibold text-off">
                {stats.total >= LIST_TARGET
                  ? "Target hit. That's a list worth working."
                  : `${LIST_TARGET - stats.total} to go`}
              </h2>
              <button
                onClick={() => setGuideOpen(true)}
                className="inline-flex h-[19px] w-[19px] items-center justify-center rounded-full border border-orange/50 bg-orange/[0.12] font-disp text-[11px] font-bold text-orange transition hover:bg-orange/[0.22]"
                aria-label="How the contact database works"
                title="How this works"
              >
                ?
              </button>
            </div>
            <p className="mx-auto mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-mut sm:mx-0">
              Compile contacts from email, social media and mobile — everyone you
              can think of. More contacts is better than fewer, and the list keeps
              growing right through the program. Everyone on it is either a lead or
              access to another network.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              <Stat label="Relevant" value={stats.relevant} />
              <Stat label="Connectors" value={stats.connectors} />
              <Stat
                label="Uncategorised"
                value={stats.uncategorised}
                tone={stats.uncategorised ? "orange" : undefined}
              />
              <Stat label="Contacted" value={stats.contacted} />
              <Stat
                label="Converted"
                value={stats.converted}
                tone={stats.converted ? "good" : undefined}
              />
            </div>
            {stats.dueToday > 0 && (
              <p className="mt-3.5 text-[12.5px] font-medium text-orange">
                {stats.dueToday} follow-up{stats.dueToday === 1 ? " is" : "s are"} due.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Ways in. Pasting names is the realistic first pass; CSV is for the
          spreadsheet they already keep. */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setPanel(panel === "paste" ? "none" : "paste")}
          className={`psy-btn-ghost !px-4 !py-2.5 !text-[13px] ${panel === "paste" ? "!border-orange/50 !text-orange" : ""}`}
        >
          Paste a list of names
        </button>
        <button
          onClick={() => setPanel(panel === "one" ? "none" : "one")}
          className={`psy-btn-ghost !px-4 !py-2.5 !text-[13px] ${panel === "one" ? "!border-orange/50 !text-orange" : ""}`}
        >
          Add one contact
        </button>
        <button
          onClick={() => setPanel(panel === "import" ? "none" : "import")}
          className={`psy-btn-ghost !px-4 !py-2.5 !text-[13px] ${panel === "import" ? "!border-orange/50 !text-orange" : ""}`}
        >
          Import a CSV
        </button>
        <a href="/api/outreach/export" className="psy-btn-ghost !px-4 !py-2.5 !text-[13px]">
          Export CSV
        </a>
      </div>

      {panel === "paste" && (
        <PastePanel
          pending={pending}
          onSubmit={(fd) =>
            start(async () => {
              const res = await addNames(fd);
              router.refresh();
              if (res?.error) flash("warn", res.error);
              else {
                flash("ok", `${res.added} name${res.added === 1 ? "" : "s"} added.`);
                setPanel("none");
              }
            })
          }
        />
      )}

      {panel === "one" && (
        <OneContactPanel
          pending={pending}
          onSubmit={(fd) =>
            start(async () => {
              const res = await addContact(fd);
              router.refresh();
              if (res?.error) flash("warn", res.error);
              else {
                flash("ok", "Contact added.");
                setPanel("none");
              }
            })
          }
        />
      )}

      {panel === "import" && (
        <ImportPanel
          pending={pending}
          onSubmit={(fd) =>
            start(async () => {
              const res = await importContacts(fd);
              router.refresh();
              if (res?.error) flash("warn", res.error);
              else {
                flash(
                  "ok",
                  `${res.added} contact${res.added === 1 ? "" : "s"} imported.${res.warning ? ` ${res.warning}` : ""}`,
                );
                setPanel("none");
              }
            })
          }
        />
      )}

      {contacts.length > 0 && (
        <div className="mb-3.5 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search names, emails, notes…"
            className="psy-input !mt-0 max-w-[260px] !py-2 !text-[13px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContactStatus | "all")}
            className="psy-input !mt-0 max-w-[210px] !py-2 !text-[13px]"
          >
            <option value="all">Any status</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="text-[12.5px] text-mut">{visible.length} shown</span>
        </div>
      )}

      {!contacts.length ? (
        <div className="rounded-[12px] border border-dashed border-line px-5 py-12 text-center">
          <p className="mx-auto max-w-[52ch] text-[13.5px] leading-relaxed text-mut">
            Your contact database is empty. Start it the easy way: open your email,
            your phone and your social accounts, and paste in everyone you can
            think of. Names first, categorise later — and keep coming back as more
            people occur to you.
          </p>
        </div>
      ) : (
        <ContactTable
          contacts={visible}
          today={today}
          pending={pending}
          onPatch={(id, patch) =>
            start(async () => {
              const res = await updateContact(id, patch);
              router.refresh();
              if (res?.error) flash("warn", res.error);
            })
          }
          onDelete={(id) =>
            start(async () => {
              const res = await deleteContact(id);
              router.refresh();
              if (res?.error) flash("warn", res.error);
            })
          }
        />
      )}
    </>
  );
}

// The target, as a ring. Deliberately the largest single element on the page —
// this number is the one that decides whether the rest of the outreach work has
// anything to act on. The "this week" pill sits under it because the list is
// built continuously: what matters day to day is that it keeps moving, not the
// total on its own.
function TargetRing({
  count,
  target,
  thisWeek,
}: {
  count: number;
  target: number;
  thisWeek: number;
}) {
  const pct = Math.min(1, count / target);
  const R = 52;
  const C = 2 * Math.PI * R;
  const hit = count >= target;

  return (
    <div className="flex shrink-0 flex-col items-center gap-2.5">
      <div className="relative" style={{ width: 132, height: 132 }}>
        <svg width={132} height={132} viewBox="0 0 132 132" className="-rotate-90">
          <circle cx={66} cy={66} r={R} fill="none" stroke="#0a111f" strokeWidth={11} />
          <circle
            cx={66}
            cy={66}
            r={R}
            fill="none"
            stroke={hit ? "#3fbf8f" : "#FF8D1E"}
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset .6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={`font-disp text-[30px] font-bold leading-none ${hit ? "text-good" : "text-off"}`}
          >
            {count}
          </div>
          <div className="mt-1 font-disp text-[11px] uppercase tracking-[1.5px] text-mut">
            of {target}
          </div>
        </div>
      </div>
      <span
        className={`rounded-full border px-3 py-1 font-disp text-[11.5px] font-semibold ${
          thisWeek > 0
            ? "border-orange/45 bg-orange/[0.12] text-orange"
            : "border-line bg-[#0a111f] text-mut"
        }`}
      >
        {thisWeek > 0 ? `+${thisWeek} this week` : "None added this week"}
      </span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-[#0a111f] px-3 py-2.5">
      <div
        className={`font-disp text-[17px] font-bold leading-none ${
          tone === "orange" ? "text-orange" : tone === "good" ? "text-good" : "text-off"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-mut">{label}</div>
    </div>
  );
}

// The session's own explanation of the database, on demand. Kept short — it is a
// reminder for someone mid-task, not the session content itself.
function GuideDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        onClick={(e) => e.stopPropagation()}
        className="psy-card my-auto w-full max-w-[600px] p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="psy-eyebrow text-orange">From the session</div>
            <h2 id="guide-title" className="mt-1.5 font-disp text-[19px] font-semibold text-off">
              Your contact database
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-[9px] border border-line px-2.5 py-1 font-disp text-[15px] leading-none text-mut transition hover:text-off"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4 text-[13.5px] leading-relaxed text-sec">
          <p>
            Compile contacts from email, social media and mobile. Be as thorough
            and extensive as possible — more contacts is better than fewer.
            <b className="text-off">
              {" "}
              Everyone is either a lead or access to another network.
            </b>
          </p>

          <div>
            <div className="psy-eyebrow mb-2.5 text-blue">The three steps</div>
            <ol className="space-y-2.5">
              {[
                [
                  "Build the list — and keep building it",
                  "Work through your email, your phone and your social accounts, and put down everyone you can think of. This one starts now and runs alongside everything else to the end of the program: names keep occurring to you, and each one belongs on the list. No judgement calls yet.",
                ],
                [
                  "Categorise",
                  "For each person, decide whether the program could be relevant to them, or not. Nobody is a dead end: if it isn't for them, the objective becomes a referral.",
                ],
                [
                  "Communicate",
                  "This part begins when you reach the outreach sessions. Relevant contacts get a short, personal message with your proposition. Everyone else gets asked who they know. Warmest channel first — face-to-face beats video, beats voice, beats a message, beats email.",
                ],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border border-orange/45 bg-orange/[0.12] font-disp text-[11px] font-bold text-orange">
                    {i + 1}
                  </span>
                  <span>
                    <b className="text-off">{title}.</b> {body}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <div className="psy-eyebrow mb-2.5 text-blue">The columns</div>
            <dl className="space-y-1.5 text-[12.5px] text-mut">
              {[
                ["Relevance", "Could the program be for them, or are they a connector?"],
                ["Correspondence", "Which message they're on — first message, or follow-up one or two."],
                ["Medium", "How you reached them. Warmer channels get better replies."],
                ["Status", "Where they've got to, from not contacted through to converted."],
                ["Dates", "When you first made contact, when you last did, and when to chase."],
              ].map(([term, def]) => (
                <div key={term} className="flex flex-wrap gap-x-2">
                  <dt className="font-disp font-semibold text-sec">{term}</dt>
                  <dd className="flex-1">{def}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="rounded-[10px] border border-line bg-[#0a111f] px-4 py-3 text-[12.5px] text-mut">
            A small number of genuinely personal messages beats high-volume
            templating. Ten a day for four weeks works through a list of this size,
            and fits in twenty minutes.
          </p>
        </div>

        <button onClick={onClose} className="psy-btn mt-6 !w-auto">
          Got it
        </button>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 rounded-[12px] border border-line bg-panel p-5">{children}</div>;
}

function PastePanel({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (fd: FormData) => void;
}) {
  return (
    <Panel>
      <h4 className="font-disp text-sm font-semibold text-off">Paste a list of names</h4>
      <p className="mb-1 mt-1.5 text-[12.5px] leading-relaxed text-mut">
        One name per line. The fastest way to add people in batches — get the names
        down, fill in details and categories afterwards. Use it again any time a
        new set of names comes to mind.
      </p>
      <form action={onSubmit}>
        <label className="psy-label">Names</label>
        <textarea
          name="names"
          required
          rows={8}
          className="psy-input font-body"
          placeholder={"Jane Okafor\nDr Michael Reid\nSam Whitfield"}
        />
        <button type="submit" disabled={pending} className="psy-btn mt-4 !w-auto">
          {pending ? "Adding…" : "Add names"}
        </button>
      </form>
    </Panel>
  );
}

function OneContactPanel({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (fd: FormData) => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <Panel>
      <h4 className="mb-1 font-disp text-sm font-semibold text-off">Add one contact</h4>
      <form
        ref={ref}
        action={(fd) => {
          onSubmit(fd);
          ref.current?.reset();
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="psy-label">Name</label>
            <input name="name" required className="psy-input" placeholder="Full name" />
          </div>
          <div>
            <label className="psy-label">Email address</label>
            <input name="email" type="email" className="psy-input" />
          </div>
          <div>
            <label className="psy-label">Phone number</label>
            <input name="phone" className="psy-input" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="psy-label">Relevance</label>
            <select name="relevance" className="psy-input" defaultValue="unsure">
              {RELEVANCES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.hint}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="psy-label">Medium</label>
            <select name="medium" className="psy-input">
              {MEDIUMS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="psy-label">Status</label>
            <select name="status" className="psy-input" defaultValue="not_contacted">
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="psy-label">Notes</label>
        <input
          name="notes"
          className="psy-input"
          placeholder="How you know them, what they're working on…"
        />
        <button type="submit" disabled={pending} className="psy-btn mt-4 !w-auto">
          {pending ? "Adding…" : "Add contact"}
        </button>
      </form>
    </Panel>
  );
}

function ImportPanel({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (fd: FormData) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Panel>
      <h4 className="font-disp text-sm font-semibold text-off">Import a CSV</h4>
      <p className="mb-1 mt-1.5 max-w-[70ch] text-[12.5px] leading-relaxed text-mut">
        Already have the Contact Database spreadsheet? Export it as CSV and drop it
        in — the columns match. It needs a header row with at least{" "}
        <b className="text-sec">Name</b>; Email Address, Phone Number,
        Correspondence, Medium, Status, Notes and the date columns are picked up
        if they're there. Dates are read day-first (26/07/2026).
      </p>
      <form action={onSubmit}>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="psy-btn-ghost relative inline-flex cursor-pointer overflow-hidden !px-4 !py-2.5 !text-[13px]">
            Choose a CSV
            <input
              type="file"
              name="file"
              required
              accept=".csv,text/csv"
              onChange={(e) => setName(e.currentTarget.files?.[0]?.name ?? "")}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-mut">
            {name || "No file chosen"}
          </span>
        </div>
        <button type="submit" disabled={pending} className="psy-btn mt-4 !w-auto">
          {pending ? "Importing…" : "Import"}
        </button>
      </form>
    </Panel>
  );
}

// The spreadsheet, as a table — same columns, same order, editable in place.
// Scrolls horizontally on a narrow screen rather than reflowing, so the shape
// stays recognisable.
const CELL = "border-b border-line px-2.5 py-2 align-middle";
const INPUT =
  "w-full rounded-[7px] border border-transparent bg-transparent px-2 py-1.5 text-[12.5px] text-off outline-none transition focus:border-line focus:bg-[#0a111f] hover:border-line/70";
const SELECT =
  "w-full rounded-[7px] border border-line/60 bg-[#0a111f] px-1.5 py-1.5 font-disp text-[12px] text-sec outline-none focus:border-blue";

function ContactTable({
  contacts,
  today,
  pending,
  onPatch,
  onDelete,
}: {
  contacts: Contact[];
  today: string;
  pending: boolean;
  onPatch: (id: string, patch: Record<string, string | null>) => void;
  onDelete: (id: string) => void;
}) {
  if (!contacts.length)
    return (
      <div className="rounded-[12px] border border-dashed border-line px-5 py-8 text-center text-[13px] text-mut">
        Nothing matches those filters.
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-[12px] border border-line bg-panel">
      <table className="w-full min-w-[1180px] border-collapse text-left">
        <thead>
          <tr className="bg-[#0a111f]">
            {[
              ["Name", "min-w-[150px]"],
              ["Email Address", "min-w-[180px]"],
              ["Phone Number", "min-w-[130px]"],
              ["Relevance", "min-w-[110px]"],
              ["First Contact", "min-w-[125px]"],
              ["Correspondence", "min-w-[125px]"],
              ["Medium", "min-w-[130px]"],
              ["Last Contact", "min-w-[125px]"],
              ["Follow-up", "min-w-[125px]"],
              ["Status", "min-w-[150px]"],
              ["Notes", "min-w-[200px]"],
              ["", "w-[44px]"],
            ].map(([label, cls]) => (
              <th
                key={label || "actions"}
                className={`border-b border-line px-2.5 py-2.5 font-disp text-[10.5px] uppercase tracking-[1.2px] text-slate ${cls}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => {
            const overdue =
              !!c.next_followup_date &&
              c.next_followup_date <= today &&
              !["converted", "not_interested"].includes(c.status);
            return (
              <tr key={c.id} className="transition hover:bg-[#0a111f]/60">
                <td className={CELL}>
                  <TextCell
                    value={c.name}
                    bold
                    onSave={(v) => v && onPatch(c.id, { name: v })}
                  />
                </td>
                <td className={CELL}>
                  <TextCell value={c.email} onSave={(v) => onPatch(c.id, { email: v })} />
                </td>
                <td className={CELL}>
                  <TextCell value={c.phone} onSave={(v) => onPatch(c.id, { phone: v })} />
                </td>
                <td className={CELL}>
                  <select
                    value={c.relevance}
                    disabled={pending}
                    onChange={(e) => onPatch(c.id, { relevance: e.target.value })}
                    className={SELECT}
                    aria-label={`Relevance for ${c.name}`}
                  >
                    {RELEVANCES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={CELL}>
                  <DateCell
                    value={c.first_contact_date}
                    onSave={(v) => onPatch(c.id, { first_contact_date: v })}
                  />
                </td>
                <td className={CELL}>
                  <select
                    value={c.correspondence}
                    disabled={pending}
                    onChange={(e) => onPatch(c.id, { correspondence: e.target.value })}
                    className={SELECT}
                    aria-label={`Correspondence for ${c.name}`}
                  >
                    {CORRESPONDENCES.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={CELL}>
                  <select
                    value={c.medium}
                    disabled={pending}
                    onChange={(e) => onPatch(c.id, { medium: e.target.value })}
                    className={SELECT}
                    aria-label={`Medium for ${c.name}`}
                  >
                    {MEDIUMS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={CELL}>
                  <DateCell
                    value={c.last_contact_date}
                    onSave={(v) => onPatch(c.id, { last_contact_date: v })}
                  />
                </td>
                <td className={CELL}>
                  <DateCell
                    value={c.next_followup_date}
                    highlight={overdue}
                    onSave={(v) => onPatch(c.id, { next_followup_date: v })}
                  />
                </td>
                <td className={CELL}>
                  <select
                    value={c.status}
                    disabled={pending}
                    onChange={(e) => onPatch(c.id, { status: e.target.value })}
                    className={SELECT}
                    aria-label={`Status for ${c.name}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={CELL}>
                  <TextCell value={c.notes} onSave={(v) => onPatch(c.id, { notes: v })} />
                </td>
                <td className={CELL}>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${c.name} from your list?`)) onDelete(c.id);
                    }}
                    disabled={pending}
                    className="rounded-[7px] px-2 py-1 text-[15px] leading-none text-bad/70 transition hover:bg-bad/10 hover:text-bad disabled:opacity-40"
                    aria-label={`Remove ${c.name}`}
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Saves on blur rather than on every keystroke — one round trip per edit.
function TextCell({
  value,
  onSave,
  bold,
}: {
  value: string;
  onSave: (v: string) => void;
  bold?: boolean;
}) {
  const [v, setV] = useState(value);
  // Resync when the row is refreshed from the server, or the box would keep
  // showing what was typed before the last save.
  useEffect(() => setV(value), [value]);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onSave(v.trim())}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={`${INPUT} ${bold ? "font-disp font-semibold" : ""}`}
    />
  );
}

function DateCell({
  value,
  onSave,
  highlight,
}: {
  value: string | null;
  onSave: (v: string | null) => void;
  highlight?: boolean;
}) {
  return (
    <input
      type="date"
      value={value ?? ""}
      onChange={(e) => onSave(e.target.value || null)}
      className={`${INPUT} ${highlight ? "!border-orange/50 !text-orange" : ""}`}
    />
  );
}
