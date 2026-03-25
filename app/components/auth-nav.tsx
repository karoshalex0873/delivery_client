import { Link } from "react-router";

export function AuthNav() {
  return (
    <nav className="auth-nav">
      <div className="auth-nav-inner">
        <Link to="/" className="text-xl font-bold tracking-tight text-brand-red">
          QuickBite
        </Link>
        <div className="flex items-center gap-5 text-sm font-semibold text-foreground">
          <Link to="/" className="transition hover:text-brand-red">Home</Link>
          <Link to="/#how-it-works" className="transition hover:text-brand-red">About</Link>
        </div>
      </div>
    </nav>
  );
}
