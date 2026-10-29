import Link from "next/link";

// Shown after "Close my account". The person is already signed out.
export default function ClosedPage() {
  return (
    <main className="relative z-10 mx-auto mt-[10vh] w-full max-w-[430px] px-5">
      <div className="psy-card p-8 text-center">
        <h1 className="font-disp text-xl font-semibold">Your account is closed</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Your account and contact list have been deleted. Thank you for being with us.
        </p>
      </div>
      <p className="mt-5 text-center text-sm text-slate">
        <Link href="/login" className="font-semibold text-blue">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
