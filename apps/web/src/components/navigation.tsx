import Link from "next/link";

const links = [
  { href: "/", label: "Today" },
  { href: "/sources", label: "Sources" },
  { href: "/learning", label: "Learning bank" },
  { href: "/review", label: "Review" },
  { href: "/project", label: "Project" },
];

export function Navigation() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark">PE</span>
        <span>
          <strong>Personal English Bank</strong>
          <small>Turn real conversations into active English.</small>
        </span>
      </Link>
      <nav aria-label="Primary navigation">
        {links.map((link) => (
          <Link href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
