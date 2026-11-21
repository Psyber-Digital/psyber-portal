// Offer names in brand orange (Don, 30 Oct: "™, not ©, and not ® until
// registered"). Plain-text ™ straight after the name, no superscript.
// Build: bold, with ™ on every mention (Don, Emails m37, 31 Oct: "Build with
// the trademark each time and also in bold"). The free plan, once called
// Foundations, shows as "Build™ Free" (Don, 21 Nov 2026), so its Build part is
// bold with ™ like Build. The "Foundations" name is kept in code for the tier.
// Session 1 is also called Foundations: that name is the session's, not this.
// Never inside a blue element (the brand palette keeps orange and blue apart),
// so buttons keep the name in their own colour, with ™ for Build.
export function Brand({ name, tm = false }: { name: "Build" | "Foundations"; tm?: boolean }) {
  void tm;
  if (name === "Foundations")
    return (
      <span className="text-[#F08328]">
        <span className="font-bold">Build™</span> Free
      </span>
    );
  return <span className="font-bold text-[#F08328]">Build™</span>;
}
