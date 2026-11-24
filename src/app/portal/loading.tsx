// Shown the instant a tab is tapped, while the page loads (Don, card BT1,
// 24 Nov 2026: "bit of a lag when selecting different tabs").
export default function Loading() {
  return (
    <div className="mx-auto max-w-[720px] animate-pulse pt-4" aria-busy="true" aria-label="Loading">
      <div className="h-14 rounded-[14px] bg-panel" />
      <div className="mt-5 h-6 w-2/3 rounded bg-panel" />
      <div className="mt-4 h-56 rounded-[22px] bg-[#FF8D1E]/20" />
      <div className="mt-5 h-24 rounded-[14px] bg-panel" />
    </div>
  );
}
