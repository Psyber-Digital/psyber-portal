export default function NotFound() {
  return (
    <div className="relative z-10 mx-auto max-w-[500px] px-5 pt-[20vh] text-center">
      <h1 className="font-disp text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate">
        This page doesn’t exist or you don’t have access.
      </p>
      <a href="/portal" className="psy-btn mt-6 !inline-flex !w-auto">
        Go to your portal
      </a>
    </div>
  );
}
