// Ducket AI Galactica — Reusable Etherscan transaction link component
// Renders a consistently branded external link to Sepolia Etherscan.
// Used in resale flow steps 2 (escrow deposit) and 4 (settlement confirmation).
//
// Apache 2.0 License

/**
 * EtherscanLink — renders an accessible Etherscan transaction link.
 *
 * Props:
 *   href  — full Etherscan URL (e.g. https://sepolia.etherscan.io/tx/0x...)
 *   label — optional display text; defaults to the raw href
 *
 * Always opens in a new tab with noopener noreferrer for security.
 * Styled with M3 secondary (gold) to match the Celestial Ledger palette.
 */
export function EtherscanLink({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-m3-secondary underline font-mono text-xs break-all hover:text-m3-secondary/80 transition-colors"
    >
      {label ?? href}
    </a>
  );
}
