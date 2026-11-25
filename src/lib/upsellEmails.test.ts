// Guard test for the Build Free upgrade emails (voice-guard, 25 Nov 2026).
// Renders every email kind, for members in every state, at moments across the
// whole launch ladder, and fails if:
//   - "free" appears in a subject, a preview or the first lines of the body
//     (the free plan is never the headline of an upgrade email);
//   - a subject says "Last day" or "Last chance" when the saving does not
//     really end tonight (the subject must then say "Final 24 hours").
// Pure: no database, no sending.
// Run: npx tsx --tsconfig tsconfig.json src/lib/upsellEmails.test.ts

import type { UpsellKind, UpsellPerson } from "@/lib/upsellEmails";

async function main() {
  process.env.BUILD_SALE_STARTS_AT = "2026-11-27T05:00:00Z"; // midnight Eastern
  process.env.UNSUBSCRIBE_SECRET = "test-only";
  const { draftFor, renderUpsell, endsSoon } = await import("@/lib/upsellEmails");
  const { currentStep } = await import("@/lib/ladder");

  const DAY = 86_400_000;
  const SALE = Date.parse(process.env.BUILD_SALE_STARTS_AT);
  const KINDS: UpsellKind[] = [
    "upsell_a", "upsell_b", "upsell_c",
    "upsell_1", "upsell_2", "upsell_3", "upsell_4", "upsell_5", "upsell_6", "upsell_7", "upsell_8",
  ];
  const base: UpsellPerson = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "sample@example.com",
    full_name: "Sam Sample",
    tier: "foundations",
    lapsed_at: null,
    created_at: "2026-11-23T15:00:00Z",
    wants_one_on_one: false,
    session1_finished_at: null,
    list_full_at: null,
  };
  const people: [string, UpsellPerson][] = [
    ["joined before the sale", base],
    ["finished Session 1", { ...base, session1_finished_at: "2026-11-24T20:00:00Z" }],
    ["one-on-one chooser", { ...base, wants_one_on_one: true }],
    // Their steps end at 3:37pm Eastern, so "tonight" is false on the last day.
    ["joined after the sale, 3:37pm", { ...base, created_at: "2026-11-30T20:37:00Z" }],
  ];

  // Every hour from the day before the sale to six weeks after it.
  const moments: number[] = [];
  for (let t = SALE - DAY; t <= SALE + 42 * DAY; t += 3600_000) moments.push(t);

  // The two rules, as one function, so the test can prove it catches them.
  const problems = (subject: string, preview: string, firstLine: string, lastDayNotTonight: boolean) => {
    const out: string[] = [];
    for (const [part, text] of [["subject", subject], ["preview", preview], ["first line", firstLine]]) {
      if (/\bfree\b/i.test(text)) out.push(`"free" in the ${part}: ${text}`);
    }
    if (lastDayNotTonight && /^Last day|^Last chance/.test(subject)) out.push(`"${subject}" but it does not end tonight`);
    return out;
  };
  // Mutation checks: each known defect must be caught.
  const mustCatch: [string, string, string, boolean][] = [
    ["Last day: $300 off your first year of Build™", "x", "x", true],
    ["Last chance: $100 off your first year of Build™", "x", "x", true],
    ["Session 1 is ready", "Start free today", "x", false],
    ["Session 1 is ready", "x", "Your Build Free account is open.", false],
    ["Your FREE plan", "x", "x", false],
  ];
  const failures: string[] = [];
  for (const c of mustCatch) if (problems(...c).length === 0) failures.push(`checker missed a known defect: ${c.join(" | ")}`);
  if (problems("Last day: $300 off", "x", "x", false).length) failures.push("checker flagged a true Last day subject");
  let checked = 0;
  let notTonight = 0;
  for (const [who, p] of people) {
    for (const at of moments) {
      const now = new Date(at);
      const step = currentStep(p, now);
      const tonight = step ? endsSoon(step.endsAt, now).tonight : null;
      for (const kind of KINDS) {
        const d = draftFor(kind, p, now);
        const r = renderUpsell(kind, p, now);
        const first = d.body[0];
        const firstText = typeof first === "string" ? first : "quote" in first ? first.quote : first.list.join(" ");
        const where = `${kind}, ${who}, ${now.toISOString()}`;
        checked++;
        const lastDayNotTonight = Boolean(step && step.endsAt.getTime() - at <= DAY && !tonight);
        for (const f of problems(r.subject, d.preheader, firstText, lastDayNotTonight)) failures.push(`${f}: ${where}`);
        // Only the last-day emails (3, 4, 5) name a last day, and never with no saving live.
        if (/^Last day|^Last chance/.test(r.subject) && !step) failures.push(`"${r.subject}" with no saving live: ${where}`);
        if (["upsell_3", "upsell_4", "upsell_5"].includes(kind) && step && step.endsAt.getTime() - at <= DAY && !tonight) {
          notTonight++;
          if (!/^Final 24 hours/.test(r.subject)) failures.push(`expected "Final 24 hours": ${where}: ${r.subject}`);
        }
      }
    }
  }

  // The test must be able to see the case it guards.
  if (notTonight === 0) failures.push("no not-tonight last-day case was rendered, so the subject check proved nothing");

  if (failures.length) {
    console.error(`FAIL: ${failures.length} problem(s) in ${checked} renders.`);
    for (const f of failures.slice(0, 40)) console.error(" - " + f);
    process.exit(1);
  }
  console.log(`PASS: ${checked} renders checked (${notTonight} last-day renders that do not end tonight).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
