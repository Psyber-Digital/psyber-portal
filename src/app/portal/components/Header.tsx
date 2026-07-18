import Image from "next/image";

export function Header({ name, role }: { name: string; role: "client" | "admin" }) {
  return (
    <header className="mb-8 flex items-center justify-between border-b border-line pb-6">
      <Image
        src="/wordmark.png"
        alt="Psyber Digital"
        width={200}
        height={38}
        priority
        className="h-[30px] w-auto"
      />
      <div className="flex items-center gap-3.5 text-[13px] text-slate">
        <span className="rounded-full border border-blue/25 bg-blue/[0.12] px-2.5 py-1 font-disp text-[10px] uppercase tracking-[1.5px] text-blue">
          {role === "admin" ? "Admin" : "Client"}
        </span>
        <span className="font-semibold text-off">{name}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="psy-btn-ghost !px-3.5 !py-2 !text-[13px]">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
