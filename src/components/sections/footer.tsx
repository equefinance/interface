import Image from "next/image";
import { siDiscord, siGithub, siMedium, siX } from "simple-icons";

const PRODUCT_LINKS = [
  { label: "Vault", href: "#" },
  { label: "Auction", href: "#" },
  { label: "Faucet", href: "#" },
];

const COMPANY_LINKS = [
  { label: "Docs", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Brand Kit", href: "#" },
];

const SOCIALS = [
  { label: "GitHub", href: "#", path: siGithub.path },
  { label: "X", href: "#", path: siX.path },
  { label: "Discord", href: "#", path: siDiscord.path },
  { label: "Medium", href: "#", path: siMedium.path },
];
// TODO: point footer links at real destinations (docs URL, app routes, social handles).

/**
 * Footer inner content, dark ink on teal. The parent supplies the teal
 * background (either the zoomed Eque mark or a static teal footer).
 *
 * Bottom: the wordmark bleeds off the edge, cropped by the parent's
 * overflow-hidden — like the reference. The image is pointer-events-none +
 * non-draggable so it can't be hovered/clicked/saved.
 */
export function FooterContent() {
  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 pt-14 sm:px-6">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8">
          <nav aria-label="Product">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[#031A14]/60">
              Product
            </p>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#031A14]/80 transition-colors hover:text-[#031A14]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Company">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[#031A14]/60">
              Company
            </p>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#031A14]/80 transition-colors hover:text-[#031A14]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Legal */}
        <p className="mt-10 text-xs text-[#031A14]/60">© 2026 Eque</p>
        <p className="mt-1.5 text-xs text-[#031A14]/60">
          Built on Base &amp; Robinhood chain for Colosseum worlds fair
        </p>

        {/* Socials */}
        <div className="mt-6 flex items-center gap-5">
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="text-[#031A14]/70 transition-colors hover:text-[#031A14]"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 fill-current"
              >
                <path d={social.path} />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Full-bleed bottom stack — layer order: divider > shadow > wordmark */}
      <div className="relative mt-8 overflow-hidden">
        {/* Divider */}
        <div aria-hidden="true" className="h-px w-full bg-[#031A14]/15" />
        <div className="relative">
          {/* Thin dark shadow rising from the bottom, behind the wordmark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#031A14]/20 to-transparent"
          />
          {/* Wordmark bleed — cropped by the wrapper, like the reference */}
          <figure className="relative flex select-none justify-center">
            <Image
              src="/assets/footer-wordmark.png"
              alt="Eque"
              width={1400}
              height={400}
              draggable={false}
              className="pointer-events-none relative w-[115%] max-w-none flex-none -mb-[3%]"
            />
          </figure>
        </div>
      </div>
    </div>
  );
}

/** Static footer for reduced-motion: plain teal, no zoom. */
export function Footer() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-[#031A14]/15 bg-[#1FFFC3]">
      <FooterContent />
    </footer>
  );
}
