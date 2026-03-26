import { Link } from "react-router";

export function AuthNav() {
  return (
    <nav className="auth-nav">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-brand-red">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red text-sm text-white">Q</span>
          <span>QuickBite</span>
        </Link>
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground sm:gap-5">
          <Link to="/" className="transition hover:text-brand-red">
            Home
          </Link>
          <Link to="/#how-it-works" className="transition hover:text-brand-red">
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
