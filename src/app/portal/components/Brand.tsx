// Offer names in brand orange, with ™ on the first visible mention on a page
// (Don, 30 Oct: "™, not ©, and not ® until registered"). Same style as the
// emails: #F08328, plain-text ™ straight after the name, no superscript.
// Never inside a blue element (the brand palette keeps orange and blue apart),
// so buttons keep the plain name.
export function Brand({ name, tm = false }: { name: "Build" | "Foundations"; tm?: boolean }) {
  return (
    <span className="text-[#F08328]">
      {name}
      {tm ? "™" : ""}
    </span>
  );
}
