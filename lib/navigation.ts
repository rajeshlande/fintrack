export const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/cards", label: "Cards" },
  { href: "/budgets", label: "Budgets" },
  { href: "/networth", label: "Networth" },
  { href: "/settings", label: "Settings" },
] as const;

export type NavLabel = (typeof navItems)[number]["label"];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
