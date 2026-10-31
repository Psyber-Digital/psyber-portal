"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { join, type JoinState, type Refusal } from "./actions";
import { Brand } from "@/app/portal/components/Brand";
import { Turnstile } from "./Turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Self-serve sign-up for Foundations (Offer Ladder stage 3, ADR-0027).
// Question and refusal wording is copied word for word from the approved
// Offer-Ladder/build/LANE-GATE-draft.md. Change it there first.

const initial: JoinState = {};

// The published terms. Until they are live, the box shows without a link.
const TERMS_URL = process.env.NEXT_PUBLIC_TERMS_URL ?? "";

const LICENSE_TYPES = ["LCSW", "LPC", "LMFT", "Psychologist", "Other"];

const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const REFUSALS: Record<Refusal, { title: string; body: string; retry: boolean }> = {
  A1: {
    title: "In training",
    body: "This program is built for independently licensed clinicians, because it teaches how to run coaching alongside clinical work. Once you're licensed independently, we'd be glad to have you. In the meantime, you're welcome to follow along.",
    retry: false,
  },
  A2: {
    title: "Not a clinician",
    body: "This program is built only for licensed US mental health clinicians, so it isn't the right fit. You're welcome to follow along.",
    retry: false,
  },
  B1: {
    title: "Coaching that treats a condition",
    body: "Coaching here is non-clinical by design. A program that treats a mental health condition belongs in your clinical work. If you'd like to build your program around what people will achieve, you're welcome to try again. Or you're welcome to follow along.",
    retry: true,
  },
  B2: {
    title: "Clients from the caseload",
    body: "Your coaching clients need to come from outside your clinical work, including your caseload, waitlist and clinical referral sources. The program is built around finding them there. You're welcome to follow along.",
    retry: false,
  },
  C: {
    title: "Current or former therapy clients",
    body: "Coaching someone who is or was your therapy client, or a close family member of a current client, creates a dual relationship, so this program doesn't support it. The coaching you build here is for people who have never been your therapy clients. You're welcome to follow along.",
    retry: false,
  },
};

type Gate = {
  license: "" | "independent" | "retired" | "training" | "none";
  license_type: string;
  license_state: string;
  license_number: string;
  tick_not_treatment: boolean;
  tick_outside_caseload: boolean;
  coaches_therapy_clients: boolean | null;
};

type First = Partial<Record<keyof Gate, string | boolean>>;

const blank: Gate = {
  license: "",
  license_type: "",
  license_state: "",
  license_number: "",
  tick_not_treatment: false,
  tick_outside_caseload: false,
  coaches_therapy_clients: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="psy-btn mt-6 w-full" disabled={pending}>
      {pending ? "Checking…" : "Create my free account"}
    </button>
  );
}

function Choice({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-off">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-[#5aa9ff]"
      />
      <span>{children}</span>
    </label>
  );
}

function Tick({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-off">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-[#5aa9ff]"
      />
      <span>{children}</span>
    </label>
  );
}

function Question({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mt-7 font-disp text-[15px] font-semibold leading-snug text-off">
      <span className="text-slate">{n}. </span>
      {children}
    </h2>
  );
}

export default function JoinPage() {
  const [state, action] = useFormState(join, initial);
  const [gate, setGate] = useState<Gate>(blank);
  // Every first answer is kept, so admin can see when one was changed.
  const [first, setFirst] = useState<First>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  // Bumped by "try again", so a refusal already shown can be dismissed.
  const [shownFor, setShownFor] = useState<JoinState | null>(null);
  // /join?plan=build, from a "Join Build" button: same questions, then the
  // confirm link lands on the Build payment page.
  const [plan, setPlan] = useState<"build" | "">("");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("plan") === "build") setPlan("build");
  }, []);

  // Radios: the first choice made is the first answer.
  function choose<K extends keyof Gate>(key: K, value: Gate[K]) {
    setGate((g) => ({ ...g, [key]: value }));
    setFirst((f) =>
      key in f ? f : { ...f, [key]: value as string | boolean },
    );
  }

  // Tick boxes start unticked, so their first answer is what was sent first.
  // The hidden field is rewritten here too, because the form data is read
  // before React re-renders with the new state.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const merged: First = {
      tick_not_treatment: gate.tick_not_treatment,
      tick_outside_caseload: gate.tick_outside_caseload,
      ...first,
    };
    setFirst(merged);
    const field = e.currentTarget.elements.namedItem("gate");
    if (field instanceof HTMLInputElement)
      field.value = JSON.stringify({ ...gate, first: merged });
  }

  if (state.sent) {
    return (
      <main className="relative z-10 mx-auto mt-[8vh] w-full max-w-[430px] px-5">
        <Logo />
        <div className="psy-card p-9 text-center">
          <div className="mb-3 text-2xl">✉️</div>
          <h1 className="font-disp text-xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            If this email is new to us, we’ve sent you a link to confirm it.
            Open it on this device, and Session 1 will be waiting for you.
          </p>
        </div>
      </main>
    );
  }

  if (state.refusal && shownFor !== state) {
    const r = REFUSALS[state.refusal];
    return (
      <main className="relative z-10 mx-auto mt-[8vh] w-full max-w-[480px] px-5">
        <Logo />
        <div className="psy-card p-9">
          <p className="text-[15px] leading-relaxed text-off">{r.body}</p>
          {r.retry && (
            <button
              type="button"
              onClick={() => setShownFor(state)}
              className="psy-btn mt-6 w-full"
            >
              Change my answers
            </button>
          )}
        </div>
      </main>
    );
  }

  const payload = JSON.stringify({ ...gate, first });

  return (
    <main className="relative z-10 mx-auto mb-16 mt-[6vh] w-full max-w-[560px] px-5">
      <Logo />
      <form action={action} onSubmit={onSubmit} className="psy-card p-8">
        <h1 className="font-disp text-xl font-semibold">Before you start</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate">
          This program is for licensed US clinicians, practicing or retired,
          who are building a coaching offer. Three quick questions make sure
          it’s the right fit.
        </p>
        {plan === "build" && (
          <p className="mt-2 text-sm leading-relaxed text-sec">
            After you confirm your email, you’ll choose your <Brand name="Build" tm /> plan.
          </p>
        )}

        <Question n={1}>
          Do you hold an independent license to practice as a mental health
          clinician in the US, or did you before you retired?
        </Question>
        <Choice
          name="license"
          checked={gate.license === "independent"}
          onChange={() => choose("license", "independent")}
        >
          Yes
        </Choice>
        <Choice
          name="license"
          checked={gate.license === "retired"}
          onChange={() => choose("license", "retired")}
        >
          Yes, and I’m now retired from clinical work
        </Choice>
        {(gate.license === "independent" || gate.license === "retired") && (
          <div className="ml-6">
            <label className="psy-label">License type</label>
            <select
              className="psy-input"
              value={gate.license_type}
              onChange={(e) => setGate({ ...gate, license_type: e.target.value })}
            >
              <option value="">Choose…</option>
              {LICENSE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <label className="psy-label">State</label>
            <select
              className="psy-input"
              value={gate.license_state}
              onChange={(e) => setGate({ ...gate, license_state: e.target.value })}
            >
              <option value="">Choose…</option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label className="psy-label">License number</label>
            <input
              className="psy-input"
              value={gate.license_number}
              onChange={(e) => setGate({ ...gate, license_number: e.target.value })}
            />
          </div>
        )}
        <Choice
          name="license"
          checked={gate.license === "training"}
          onChange={() => choose("license", "training")}
        >
          No, I’m pre-licensed, on an associate license, or in training
        </Choice>
        <Choice
          name="license"
          checked={gate.license === "none"}
          onChange={() => choose("license", "none")}
        >
          No
        </Choice>

        <Question n={2}>Your coaching program</Question>
        <Tick
          checked={gate.tick_not_treatment}
          onChange={(v) => setGate({ ...gate, tick_not_treatment: v })}
        >
          My coaching program will not diagnose or treat a mental health
          condition, or be offered in place of therapy. I will refer anyone who
          needs treatment to a licensed clinician other than me.
        </Tick>
        <Tick
          checked={gate.tick_outside_caseload}
          onChange={(v) => setGate({ ...gate, tick_outside_caseload: v })}
        >
          I’ll find my coaching clients outside my therapy caseload, waitlist
          and clinical referral sources.
        </Tick>

        <Question n={3}>
          Do you plan to offer coaching to anyone who is, or has ever been, your
          therapy client, or to a close family member of a current therapy
          client?
        </Question>
        <Choice
          name="q3"
          checked={gate.coaches_therapy_clients === false}
          onChange={() => choose("coaches_therapy_clients", false)}
        >
          No
        </Choice>
        <Choice
          name="q3"
          checked={gate.coaches_therapy_clients === true}
          onChange={() => choose("coaches_therapy_clients", true)}
        >
          Yes
        </Choice>

        <h2 className="mt-9 font-disp text-[15px] font-semibold text-off">
          Your account
        </h2>
        <label className="psy-label">Full name</label>
        <input
          name="full_name"
          className="psy-input"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <label className="psy-label">Email</label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="psy-input"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="psy-label">Password</label>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          className="psy-input"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input type="hidden" name="gate" value={payload} />
        <input type="hidden" name="plan" value={plan} />

        {/* Build terms 12.2: ticking this box is how the terms are accepted. */}
        <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-off">
          <input
            type="checkbox"
            name="accept_terms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 accent-[#5aa9ff]"
          />
          <span>
            I accept the{" "}
            {TERMS_URL ? (
              <a
                href={TERMS_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue"
              >
                terms
              </a>
            ) : (
              "terms"
            )}
            .
          </span>
        </label>

        {TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} resetOn={state} />}

        {state.error && (
          <p className="mt-4 rounded-[9px] border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-[#f0a99f]">
            {state.error}
          </p>
        )}

        <SubmitButton />

        <p className="mt-5 text-center text-sm text-slate">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}

function Logo() {
  return (
    <div className="mb-7 flex justify-center">
      <Image
        src="/wordmark.png"
        alt="Psyber Digital"
        width={280}
        height={54}
        priority
        className="h-11 w-auto"
      />
    </div>
  );
}
