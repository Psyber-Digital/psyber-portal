"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FileRow, Profile, Settings, SharedFile, Week } from "@/lib/types";
import {
  DEFAULT_EXPIRY_HOURS,
  EXPIRY_WINDOWS,
  MAX_UPLOAD_BYTES,
  STALE_UPLOAD_DAYS,
  UPLOAD_ACCEPT,
  daysOld,
  formatBytes,
  timeLeft,
} from "@/lib/shared";
import {
  addClient,
  createWeek,
  deleteClient,
  deleteFile,
  deleteSharedFile,
  deleteWeek,
  saveSettings,
  sendToClient,
  setCurrentWeek,
  togglePublish,
  updateWeek,
  uploadFile,
} from "../actions";

const pad = (n: number) => String(n).padStart(2, "0");
type Tab = "clients" | "weeks" | "shared" | "booking";

export function AdminDashboard({
  clients,
  weeks,
  files,
  settings,
  shared,
  serverNow,
}: {
  clients: Profile[];
  weeks: Week[];
  files: FileRow[];
  settings: Settings;
  shared: SharedFile[];
  serverNow: number;
}) {
  const [tab, setTab] = useState<Tab>("clients");
  const publishedCount = weeks.filter((w) => w.published).length;
  const awaitingReview = shared.filter((s) => s.direction === "to_coach").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["clients", "Clients & Access"],
            ["weeks", "Weeks & Content"],
            ["shared", awaitingReview ? `Shared Files (${awaitingReview})` : "Shared Files"],
            ["booking", "Booking"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-[10px] border px-4 py-2.5 font-disp text-[13px] transition ${
              tab === key
                ? "border-blue bg-panel text-off"
                : "border-line bg-transparent text-slate"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "clients" && (
        <ClientsTab clients={clients} weeks={weeks} publishedCount={publishedCount} />
      )}
      {tab === "weeks" && <WeeksTab weeks={weeks} files={files} />}
      {tab === "shared" && (
        <SharedTab clients={clients} shared={shared} serverNow={serverNow} />
      )}
      {tab === "booking" && <BookingTab settings={settings} />}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-[10px] border border-blue/40 bg-blue/[0.07] px-3.5 py-3 text-[12.5px] leading-relaxed text-slate">
      {children}
    </div>
  );
}

function ClientsTab({
  clients,
  weeks,
  publishedCount,
}: {
  clients: Profile[];
  weeks: Week[];
  publishedCount: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const change = (id: string, week: number) =>
    start(async () => {
      setNotice(null);
      const res = await setCurrentWeek(id, week);
      router.refresh();
      if (res?.emailError)
        setNotice({
          kind: "warn",
          text: `Week ${pad(week)} set, but the unlock email didn’t send — ${res.emailError}`,
        });
      else if (res?.emailSkipped)
        setNotice({
          kind: "warn",
          text: `Week ${pad(week)} unlocked — no email is written for this week yet, so none was sent.`,
        });
      else if (res?.emailed)
        setNotice({ kind: "ok", text: `Week ${pad(week)} unlocked — client emailed.` });
      if (res?.emailed || res?.emailError || res?.emailSkipped)
        setTimeout(() => setNotice(null), 8000);
    });

  const remove = (id: string, label: string) => {
    if (
      !confirm(
        `Remove ${label}? This permanently deletes their account and all access, and cannot be undone.`,
      )
    )
      return;
    start(async () => {
      setNotice(null);
      const res = await deleteClient(id);
      router.refresh();
      setNotice(
        res?.error
          ? { kind: "warn", text: res.error }
          : { kind: "ok", text: `${label} removed.` },
      );
      setTimeout(() => setNotice(null), 8000);
    });
  };

  return (
    <>
      <Hint>
        A client’s access is a single position: set their current week and they
        see every week up to and including it. Bump it by one after each session
        — moving a client forward to a published week emails them that it’s open.
        Clients sign in with a password or a secure email link — you don’t manage
        their passwords; they set their own from their account page.
      </Hint>

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

      <AddClientForm />

      {!clients.length && (
        <div className="psy-card p-10 text-center text-sm text-dim">
          No clients yet — add your first above.
        </div>
      )}

      {clients.map((c) => (
        <div key={c.id} className="mb-4 rounded-xl border border-line bg-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-disp text-sm font-semibold">
                {c.full_name || "—"}
              </div>
              <div className="mt-0.5 text-[12px] text-dim">{c.email}</div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] text-dim">
                {Math.min(c.current_week, publishedCount)} of {publishedCount} weeks
              </span>
              <button
                onClick={() => change(c.id, c.current_week - 1)}
                disabled={pending || c.current_week <= 0}
                className="psy-btn-ghost !px-3 !py-1.5 !text-[13px] disabled:opacity-40"
                aria-label="Previous week"
              >
                −
              </button>
              <span className="min-w-[92px] text-center font-disp text-[13px]">
                Week {pad(c.current_week)}
              </span>
              <button
                onClick={() => change(c.id, c.current_week + 1)}
                disabled={pending}
                className="psy-btn-ghost !px-3 !py-1.5 !text-[13px]"
                aria-label="Next week"
              >
                +
              </button>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {weeks.map((w) => {
              const on = w.number <= c.current_week && w.published;
              return (
                <span
                  key={w.id}
                  className={`rounded-lg border px-2.5 py-1.5 font-disp text-[12px] ${
                    !w.published
                      ? "border-line bg-[#0a111f] text-slate opacity-40"
                      : on
                        ? "border-blue/40 bg-blue/[0.15] text-blue"
                        : "border-line bg-[#0a111f] text-slate"
                  }`}
                >
                  {on ? "✓ " : ""}Week {pad(w.number)}
                  {!w.published ? " · draft" : ""}
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => remove(c.id, c.full_name || c.email || "this client")}
              disabled={pending}
              className="font-disp text-[12px] font-medium text-bad/80 transition hover:text-bad disabled:opacity-40"
            >
              Remove client
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

function AddClientForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          setAdded(null);
          const res = await addClient(fd);
          if (res?.error) {
            setError(res.error);
            return;
          }
          setAdded(String(fd.get("email") ?? "").trim());
          formRef.current?.reset();
          router.refresh();
          setTimeout(() => setAdded(null), 4000);
        })
      }
      className="mb-5 rounded-xl border border-line bg-panel p-5"
    >
      <h4 className="mb-1 font-disp text-sm font-semibold">Add a client</h4>
      <p className="mb-3.5 text-[12px] leading-relaxed text-dim">
        Creates their account with <b>Week 01 already unlocked</b>. No email is
        sent — share the portal link and they sign in with a secure email link.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="psy-label">First name</label>
          <input name="first_name" className="psy-input" placeholder="First name" />
        </div>
        <div>
          <label className="psy-label">Surname</label>
          <input name="surname" className="psy-input" placeholder="Surname" />
        </div>
      </div>
      <div className="mt-1">
        <label className="psy-label">Email</label>
        <input
          name="email"
          type="email"
          className="psy-input"
          placeholder="client@email.com"
        />
      </div>
      <div className="mt-1 max-w-[200px]">
        <label className="psy-label">Starting week</label>
        <input
          name="current_week"
          type="number"
          min={0}
          defaultValue={1}
          className="psy-input"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-[9px] border border-bad/30 bg-bad/10 px-3 py-2.5 text-[13px] text-[#f0a99f]">
          {error}
        </p>
      )}
      {added && (
        <p className="mt-3 text-[12px] text-good">
          Added {added}. They can sign in now.
        </p>
      )}

      <button type="submit" disabled={pending} className="psy-btn mt-4 !w-auto">
        {pending ? "Adding…" : "Add client"}
      </button>
    </form>
  );
}

// One week's header: read-only until Edit is pressed, then the same fields the
// Add form uses. Kept separate so each row owns its own editing state.
function WeekHeader({
  week,
  pending,
  run,
}: {
  week: Week;
  pending: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <form
        action={async (fd) => {
          fd.set("week_id", week.id);
          const res = await updateWeek(fd);
          if (res?.error) {
            setError(res.error);
            return;
          }
          setError(null);
          setEditing(false);
          run(async () => {});
        }}
        className="rounded-xl border border-blue/40 bg-blue/[0.05] p-4"
      >
        <div className="grid gap-4 md:grid-cols-[120px_1fr]">
          <div>
            <label className="psy-label">Number</label>
            <input name="number" type="number" defaultValue={week.number} className="psy-input" />
          </div>
          <div>
            <label className="psy-label">Title</label>
            <input name="title" defaultValue={week.title} className="psy-input" />
          </div>
        </div>
        <label className="psy-label">Description</label>
        <textarea
          name="description"
          defaultValue={week.description ?? ""}
          className="psy-input min-h-[70px]"
        />
        <p className="mt-2 text-[12px] text-dim">
          Changing the <b>number</b> changes who can see this session — clients only see
          weeks up to the one they are on. Renaming is always safe.
        </p>
        {error && <p className="mt-2 text-[12.5px] text-bad">{error}</p>}
        <div className="mt-3 flex items-center gap-2.5">
          <button type="submit" disabled={pending} className="psy-btn !w-auto !px-4 !py-2 !text-[13px]">
            Save changes
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="psy-btn-ghost !px-3.5 !py-2 !text-[13px]"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="psy-eyebrow text-blue">Week {pad(week.number)}</div>
          <h3 className="mt-1 font-disp text-base font-semibold">{week.title}</h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-md px-2.5 py-1 font-disp text-[10px] uppercase tracking-[1px] ${
              week.published ? "bg-good/[0.14] text-good" : "bg-slate/[0.14] text-slate"
            }`}
          >
            {week.published ? "Published" : "Draft"}
          </span>
          <button
            onClick={() => setEditing(true)}
            disabled={pending}
            className="psy-btn-ghost !px-3.5 !py-2 !text-[13px]"
          >
            Edit
          </button>
          <button
            onClick={() => run(() => togglePublish(week.id, !week.published))}
            disabled={pending}
            className="psy-btn-ghost !px-3.5 !py-2 !text-[13px]"
          >
            {week.published ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this week and its files?")) run(() => deleteWeek(week.id));
            }}
            disabled={pending}
            className="rounded-[10px] border border-bad/40 bg-transparent px-3.5 py-2 font-disp text-[13px] text-bad"
          >
            Delete
          </button>
        </div>
      </div>
      {week.description && <p className="mt-2.5 text-[12px] text-dim">{week.description}</p>}
    </>
  );
}

function WeeksTab({ weeks, files }: { weeks: Week[]; files: FileRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const nextNum = weeks.length ? weeks[weeks.length - 1].number + 1 : 1;
  const run = (fn: () => Promise<void>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <>
      <Hint>
        Add a week, upload its worksheet and resources, then <b>Publish</b> when the
        session is delivered. Unpublished weeks are invisible to everyone — this is
        how future weeks stay locked. Use <b>Edit</b> to change a name, number or
        description; deleting a week also deletes its uploaded files.
      </Hint>

      <form
        action={async (fd) => run(() => createWeek(fd))}
        className="mb-5 rounded-xl border border-line bg-panel p-5"
      >
        <h4 className="mb-3.5 font-disp text-sm font-semibold">Add a new week</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="psy-label">Week number</label>
            <input name="number" type="number" defaultValue={nextNum} className="psy-input" />
          </div>
          <div>
            <label className="psy-label">Title</label>
            <input name="title" className="psy-input" placeholder="e.g. Integration — Making It Stick" />
          </div>
        </div>
        <label className="psy-label">Description</label>
        <textarea name="description" className="psy-input min-h-[70px]" />
        <button type="submit" disabled={pending} className="psy-btn mt-4 !w-auto">
          Add week
        </button>
      </form>

      {weeks.map((w) => {
        const worksheet = files.find((f) => f.week_id === w.id && f.kind === "worksheet");
        const resources = files.filter((f) => f.week_id === w.id && f.kind === "resource");
        return (
          <div key={w.id} className="psy-card mb-3.5 p-5">
            <WeekHeader week={w} pending={pending} run={run} />
            <div className="my-4 h-px bg-line" />
            <div className="grid gap-5 md:grid-cols-2">
              <FileColumn
                label="Worksheet"
                weekId={w.id}
                kind="worksheet"
                files={worksheet ? [worksheet] : []}
                onDelete={(id) => run(() => deleteFile(id))}
                onUpload={(fd) => run(() => uploadFile(fd))}
                single={!!worksheet}
                pending={pending}
              />
              <FileColumn
                label="Useful Resources"
                weekId={w.id}
                kind="resource"
                files={resources}
                onDelete={(id) => run(() => deleteFile(id))}
                onUpload={(fd) => run(() => uploadFile(fd))}
                pending={pending}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function FileColumn({
  label,
  weekId,
  kind,
  files,
  onDelete,
  onUpload,
  single,
  pending,
}: {
  label: string;
  weekId: string;
  kind: "worksheet" | "resource";
  files: FileRow[];
  onDelete: (id: string) => void;
  onUpload: (fd: FormData) => void;
  single?: boolean;
  pending: boolean;
}) {
  return (
    <div>
      <div className="mb-2.5 font-disp text-[11px] uppercase tracking-[2px] text-slate">
        {label}
      </div>
      <div className="flex flex-col gap-2">
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-[9px] border border-line bg-[#0a111f] px-3 py-2 text-[13px]"
          >
            <span className="truncate">⤓ {f.title}</span>
            <button
              onClick={() => onDelete(f.id)}
              disabled={pending}
              className="ml-2 text-base leading-none text-bad"
              aria-label="Delete file"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {!(single && files.length) && (
        <form
          action={(fd) => {
            fd.set("week_id", weekId);
            fd.set("kind", kind);
            onUpload(fd);
          }}
          className="mt-2.5"
        >
          <label className="psy-btn-ghost relative inline-flex cursor-pointer overflow-hidden !px-3.5 !py-2 !text-[13px]">
            {single ? "Upload worksheet" : "Add resource"}
            <input
              type="file"
              name="file"
              required
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </form>
      )}
    </div>
  );
}

function SharedTab({
  clients,
  shared,
  serverNow,
}: {
  clients: Profile[];
  shared: SharedFile[];
  serverNow: number;
}) {
  const router = useRouter();
  // Server's clock first, browser's after mount — see the note in
  // SharedFilesView. Rendering "3 hours left" from Date.now() on the client's
  // first pass would not match what the server sent.
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState("");

  const nameOf = (id: string) => {
    const c = clients.find((x) => x.id === id);
    return c?.full_name || c?.email || "Unknown client";
  };

  const flash = (kind: "ok" | "warn", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 8000);
  };

  const remove = (id: string, title: string) => {
    if (!confirm(`Delete ${title}? This removes the file permanently.`)) return;
    start(async () => {
      const res = await deleteSharedFile(id);
      router.refresh();
      if (res?.error) flash("warn", res.error);
      else flash("ok", `${title} deleted.`);
    });
  };

  const incoming = shared.filter((s) => s.direction === "to_coach");
  const outgoing = shared.filter((s) => s.direction === "to_client");

  return (
    <>
      <Hint>
        Files move both ways. What you <b>send down</b> expires on the window you
        choose and is deleted automatically — the client is emailed as soon as you
        send it, so they know to collect it. What a client <b>sends up</b> never
        expires; it sits here until you delete it.
      </Hint>

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

      <form
        ref={formRef}
        action={(fd) =>
          start(async () => {
            const res = await sendToClient(fd);
            if (res?.error) {
              flash("warn", res.error);
              return;
            }
            setFileName("");
            formRef.current?.reset();
            router.refresh();
            if (res?.emailError)
              flash("warn", `File sent, but the email didn’t go out — ${res.emailError}`);
            else flash("ok", "File sent and the client has been emailed.");
          })
        }
        className="mb-5 rounded-xl border border-line bg-panel p-5"
      >
        <h4 className="mb-1 font-disp text-sm font-semibold">Send a document to a client</h4>
        <p className="mb-3.5 text-[12px] leading-relaxed text-dim">
          They’re emailed straight away, and the file deletes itself when the
          window closes.
        </p>

        {!clients.length ? (
          <p className="text-[13px] text-dim">Add a client first.</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="psy-label">Client</label>
                <select name="client_id" className="psy-input" required>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || c.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="psy-label">Available for</label>
                <select
                  name="expiry_hours"
                  className="psy-input"
                  defaultValue={DEFAULT_EXPIRY_HOURS}
                >
                  {EXPIRY_WINDOWS.map((w) => (
                    <option key={w.hours} value={w.hours}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="psy-label">Note (optional — shown in the portal and the email)</label>
            <input
              name="note"
              maxLength={300}
              className="psy-input"
              placeholder="e.g. The revised pricing sheet we talked through."
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="psy-btn-ghost relative inline-flex cursor-pointer overflow-hidden !px-4 !py-2.5 !text-[13px]">
                Choose a file
                <input
                  type="file"
                  name="file"
                  required
                  accept={UPLOAD_ACCEPT}
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    setFileName(f ? `${f.name} (${formatBytes(f.size)})` : "");
                    if (f && f.size > MAX_UPLOAD_BYTES)
                      flash("warn", `That file is ${formatBytes(f.size)} — the limit is 25 MB.`);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <span className="min-w-0 flex-1 truncate text-[12px] text-dim">
                {fileName || "PDF, Word, spreadsheet or image · up to 25 MB"}
              </span>
            </div>

            <button type="submit" disabled={pending} className="psy-btn mt-4 !w-auto">
              {pending ? "Sending…" : "Send"}
            </button>
          </>
        )}
      </form>

      <div className="mb-2.5 font-disp text-[11px] uppercase tracking-[2px] text-slate">
        From clients {incoming.length ? `(${incoming.length})` : ""}
      </div>
      {!incoming.length ? (
        <div className="psy-card mb-5 p-8 text-center text-[13px] text-dim">
          Nothing sent up yet.
        </div>
      ) : (
        <div className="mb-5 flex flex-col gap-2">
          {incoming.map((f) => {
            const age = daysOld(f.created_at, now);
            return (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-panel px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-disp text-[13px] font-semibold">{f.title}</div>
                  <div className="mt-0.5 text-[12px] text-dim">
                    {nameOf(f.client_id)} ·{" "}
                    {new Date(f.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                    {f.size_bytes ? ` · ${formatBytes(f.size_bytes)}` : ""}
                  </div>
                  {f.note && <p className="mt-1 text-[12px] text-slate">{f.note}</p>}
                  {age >= STALE_UPLOAD_DAYS && (
                    <p className="mt-1 text-[11.5px] font-medium text-orange">
                      Held for {age} days — delete it if you no longer need it.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <a href={`/api/shared/${f.id}`} className="psy-btn-ghost !px-3.5 !py-2 !text-[13px]">
                    Open
                  </a>
                  <button
                    onClick={() => remove(f.id, f.title)}
                    disabled={pending}
                    className="font-disp text-[12px] font-medium text-bad/80 transition hover:text-bad disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-2.5 font-disp text-[11px] uppercase tracking-[2px] text-slate">
        Sent to clients {outgoing.length ? `(${outgoing.length})` : ""}
      </div>
      {!outgoing.length ? (
        <div className="psy-card p-8 text-center text-[13px] text-dim">
          You haven’t sent anything yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {outgoing.map((f) => {
            const left = timeLeft(f.expires_at, now);
            const gone = left === "Expired";
            return (
              <div
                key={f.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-[10px] border px-4 py-3 ${
                  gone ? "border-line bg-[#0a111f] opacity-60" : "border-line bg-panel"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-disp text-[13px] font-semibold">{f.title}</div>
                  <div className="mt-0.5 text-[12px] text-dim">
                    {nameOf(f.client_id)} · {gone ? "expired, awaiting clear-out" : left}
                    {f.downloaded_at ? " · collected" : " · not collected yet"}
                  </div>
                  {f.note && <p className="mt-1 text-[12px] text-slate">{f.note}</p>}
                </div>
                <button
                  onClick={() => remove(f.id, f.title)}
                  disabled={pending}
                  className="shrink-0 font-disp text-[12px] font-medium text-bad/80 transition hover:text-bad disabled:opacity-40"
                >
                  {gone ? "Clear" : "Withdraw"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function BookingTab({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <>
      <Hint>
        This is the link behind “Arrange your next session” on every client’s
        dashboard. Change it here and it updates everywhere.
      </Hint>
      <form
        action={(fd) =>
          start(async () => {
            await saveSettings(fd);
            setSaved(true);
            router.refresh();
            setTimeout(() => setSaved(false), 2000);
          })
        }
        className="max-w-[620px] rounded-xl border border-line bg-panel p-5"
      >
        <h4 className="mb-3.5 font-disp text-sm font-semibold">Booking link</h4>
        <label className="psy-label">Calendly URL</label>
        <input name="calendly_url" defaultValue={settings.calendly_url} className="psy-input" />
        <div className="mt-1 grid gap-4 md:grid-cols-2">
          <div>
            <label className="psy-label">Session length</label>
            <input name="session_length" defaultValue={settings.session_length} className="psy-input" />
          </div>
          <div>
            <label className="psy-label">Format</label>
            <input name="session_format" defaultValue={settings.session_format} className="psy-input" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={pending} className="psy-btn !w-auto">
            Save
          </button>
          {saved && <span className="text-[12px] text-good">Saved.</span>}
        </div>
      </form>
    </>
  );
}
