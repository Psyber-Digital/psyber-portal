import type { WeekVideo } from "@/lib/videos";

// Responsive 16:9 Vimeo player for a private, domain-locked session video.
// Clean chrome (no title/byline/share), do-not-track on.
export function VimeoEmbed({ video, title }: { video: WeekVideo; title?: string }) {
  const params = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    dnt: "1",
  });
  if (video.hash) params.set("h", video.hash);
  const src = `https://player.vimeo.com/video/${video.id}?${params.toString()}`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-[12px] border border-line bg-black"
      style={{ paddingTop: "56.25%" }}
    >
      <iframe
        src={src}
        title={video.title ?? title ?? "Session video"}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
