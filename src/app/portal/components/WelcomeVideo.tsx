import { VimeoEmbed } from "./VimeoEmbed";
import { welcomeVideo } from "@/lib/videos";

// The onboarding video, above everything else on the portal home.
//
// Not a session and not pre-work: nothing to fill in, nothing asked of the
// viewer. It orients somebody who has just joined — where the program goes, how
// a session runs, and what separates the people who finish it.
//
// It stays permanently available rather than showing once, because a client
// coming back in week five to check how the floating sessions work should find
// it where they left it. What changes is the prominence: full card while they
// are still at the start, a quiet line once they are underway.
export function WelcomeVideo({ currentWeek }: { currentWeek: number }) {
  const video = welcomeVideo();
  if (!video) return null;

  const settled = currentWeek > 1;

  if (settled) {
    return (
      <details className="psy-card mt-6 px-5 py-4 sm:px-6">
        <summary className="cursor-pointer list-none text-[13.5px] text-dim marker:hidden hover:text-off">
          <span className="psy-eyebrow text-blue">Start here</span>
          <span className="ml-3">Watch the welcome video again</span>
        </summary>
        <div className="mt-4">
          <VimeoEmbed video={video} title="Welcome to Therapy+" />
        </div>
      </details>
    );
  }

  return (
    <section className="psy-card mt-6 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="psy-eyebrow text-blue">Start here</div>
        <h2 className="mt-1.5 font-disp text-lg font-semibold sm:text-xl">
          Welcome to Therapy<span className="text-orange">+</span>
        </h2>
        <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-dim">
          Four minutes on where the program goes and how each session runs. Nothing to
          fill in — watch it before you open Session 01.
        </p>
        <div className="mt-4">
          <VimeoEmbed video={video} title="Welcome to Therapy+" />
        </div>
      </div>
    </section>
  );
}
