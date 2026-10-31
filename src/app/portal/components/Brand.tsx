// Offer names in brand orange (Don, 30 Oct: "™, not ©, and not ® until
// registered"). Plain-text ™ straight after the name, no superscript.
// Build: bold, with ™ on every mention (Don, Emails m37, 31 Oct: "Build with
// the trademark each time and also in bold"). Foundations: ™ on the first
// visible mention on a page, not bold.
// Never inside a blue element (the brand palette keeps orange and blue apart),
// so buttons keep the name in their own colour, with ™ for Build.
export function Brand({ name, tm = false }: { name: "Build" | "Foundations"; tm?: boolean }) {
  const build = name === "Build";
  return (
    <span className={build ? "font-bold text-[#F08328]" : "text-[#F08328]"}>
      {name}
      {build || tm ? "™" : ""}
    </span>
  );
}
