import { Link } from "react-router";

export function HomeNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#F1DFCF] bg-[#FFF8F0]/95 backdrop-blur">
      <div className="mx-auto flex py-6 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-[#E53935]">
          QuickBite
        </Link>
        <div className="hidden items-center gap-6 text-sm font-semibold md:flex">
          <a href="#categories" className="hover:text-[#E53935]">Categories</a>
          <a href="#dishes" className="hover:text-[#E53935]">Top Dishes</a>
          <a href="#restaurants" className="hover:text-[#E53935]">Restaurants</a>
          <a href="#how-it-works" className="hover:text-[#E53935]">How It Works</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth/signin" className="hidden text-sm font-semibold text-[#2E2E2E] hover:text-[#E53935] sm:block">
            Sign In
          </Link>
          <Link
            to="/auth/signin"
            className="rounded-full bg-[#E53935] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D32F2F]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
