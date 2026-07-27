"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SharedFile } from "@/lib/types";
import { MAX_UPLOAD_BYTES, UPLOAD_ACCEPT, formatBytes, timeLeft } from "@/lib/shared";
import { uploadToCoach, withdrawUpload } from "./actions";

// "5 hours left" is a function of the current time, so rendering it from
// Date.now() during the client's first render disagrees with what the server
// already sent and React reports a hydration mismatch. Instead the server's
// clock is passed in and used for the first render, then swapped for the
// browser's on mount and ticked once a minute.
function useClock(serverNow: number) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function SharedFilesView({
  fromCoach,
  sent,
  serverNow,
}: {
  fromCoach: SharedFile[];
  sent: SharedFile[];
  serverNow: number;
}) {
  const now = useClock(serverNow);
  return (
    <>
      <FromCoach files={fromCoach} now={now} />
      <SendToCoach files={sent} />
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dashed border-line px-5 py-8 text-center text-[13px] leading-relaxed text-mut">
      {children}
    </div>
  );
}

function FromCoach({ files, now }: { files: SharedFile[]; now: number }) {
  return (
    <section className="psy-card mb-5 p-5 sm:p-6">
      <h2 className="font-disp text-[15px] font-semibold text-off">From your coach</h2>
      <p className="mb-4 mt-1.5 text-[13px] leading-relaxed text-mut">
        Documents we’ve left for you. These are removed automatically once their
        window closes, so download anything you want to keep.
      </p>

      {!files.length ? (
        <Empty>Nothing waiting for you right now.</Empty>
      ) : (
        <div className="flex flex-col gap-2.5">
          {files.map((f) => {
            const left = timeLeft(f.expires_at, now);
            const urgent = left.includes("minute") || left.startsWith("1 hour");
            return (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[11px] border border-line bg-[#0a111f] px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-disp text-[13.5px] font-semibold text-off">
                    {f.title}
                  </div>
                  {f.note && (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-sec">{f.note}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-mut">
                    <span className={urgent ? "font-semibold text-orange" : "text-orange/90"}>
                      {left}
                    </span>
                    {f.size_bytes ? <span>· {formatBytes(f.size_bytes)}</span> : null}
                    {f.downloaded_at ? <span>· collected</span> : null}
                  </div>
                </div>
                <a href={`/api/shared/${f.id}`} className="psy-btn !w-auto shrink-0 !py-2.5">
                  Download
                </a>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SendToCoach({ files }: { files: SharedFile[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState("");

  const remove = (id: string, title: string) => {
    if (!confirm(`Remove ${title}? Your coach will no longer be able to see it.`)) return;
    start(async () => {
      setError(null);
      const res = await withdrawUpload(id);
      if (res?.error) setError(res.error);
      router.refresh();
    });
  };

  return (
    <section className="psy-card p-5 sm:p-6">
      <h2 className="font-disp text-[15px] font-semibold text-off">Send to your coach</h2>
      <p className="mb-4 mt-1.5 text-[13px] leading-relaxed text-mut">
        To share a workbook: open it, use{" "}
        <b className="text-sec">Download / Print to PDF</b> at the bottom of the
        workbook, then upload the PDF here. Photos of handwritten notes are fine
        too. What you send stays here until we remove it — it does not expire.
      </p>

      <form
        ref={formRef}
        action={(fd) =>
          start(async () => {
            setError(null);
            setOk(false);
            const res = await uploadToCoach(fd);
            if (res?.error) {
              setError(res.error);
              return;
            }
            setOk(true);
            setFileName("");
            formRef.current?.reset();
            router.refresh();
            setTimeout(() => setOk(false), 5000);
          })
        }
        className="mb-5 rounded-[12px] border border-line bg-[#0a111f] p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
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
                setError(
                  f && f.size > MAX_UPLOAD_BYTES
                    ? `That file is ${formatBytes(f.size)} — the limit is 25 MB.`
                    : null,
                );
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-mut">
            {fileName || "PDF, Word document, or a photo · up to 25 MB"}
          </span>
        </div>

        <label className="psy-label">Add a note (optional)</label>
        <input
          name="note"
          maxLength={300}
          className="psy-input"
          placeholder="e.g. My Session 2 workbook — the niche list is on page 3."
        />

        <button type="submit" disabled={pending} className="psy-btn mt-4 !w-auto">
          {pending ? "Sending…" : "Send to your coach"}
        </button>

        {error && (
          <p className="mt-3 rounded-[9px] border border-bad/30 bg-bad/10 px-3 py-2.5 text-[13px] text-[#f0a99f]">
            {error}
          </p>
        )}
        {ok && (
          <p className="mt-3 text-[12.5px] text-good">
            Sent. We’ve been notified by email.
          </p>
        )}
      </form>

      {!files.length ? (
        <Empty>You haven’t sent anything yet.</Empty>
      ) : (
        <div className="flex flex-col gap-2.5">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[11px] border border-line bg-[#0a111f] px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-disp text-[13.5px] font-semibold text-off">
                  {f.title}
                </div>
                {f.note && (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-sec">{f.note}</p>
                )}
                <div className="mt-1.5 text-[11.5px] text-mut">
                  Sent {new Date(f.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                  {f.size_bytes ? ` · ${formatBytes(f.size_bytes)}` : ""}
                </div>
              </div>
              <button
                onClick={() => remove(f.id, f.title)}
                disabled={pending}
                className="shrink-0 font-disp text-[12px] font-medium text-bad/80 transition hover:text-bad disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
