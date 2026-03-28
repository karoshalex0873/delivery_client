import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { cn } from "~/lib/utils";
import {
  LogOut,
  Menu as MenuIcon,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useClerk } from "@clerk/clerk-react";
import { logout as logoutUser } from "~/services/auth";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface AppLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userRole: string; // "customer" | "restaurant" | "rider" | "admin"
  showBottomNav?: boolean;
  headerTitle?: string;
  headerRight?: React.ReactNode;
  showHeaderBorder?: boolean;
  showMobileMenuButton?: boolean;
}

export function AppLayout({
  children,
  navItems,
  userRole,
  showBottomNav = false,
  headerTitle,
  headerRight,
  showHeaderBorder = true,
  showMobileMenuButton = true,
}: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();

  const isNavItemActive = (href: string) => {
    const isRoleRoot = href.split("/").filter(Boolean).length === 1;
    if (isRoleRoot) {
      return location.pathname === href;
    }
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    await logoutUser();
    try {
      await signOut();
    } catch {
      // Ignore if Clerk session does not exist.
    }
    navigate("/auth/signin", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:inset-auto md:h-screen md:flex md:flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-red flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            <span className="text-xl font-bold tracking-tight">Derivery</span>
          </Link>
          <button
            className="ml-auto md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:overflow-y-visible">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={() =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isNavItemActive(item.href)
                      ? "bg-brand-red text-white"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className={cn("flex h-16 items-center bg-surface px-6 md:hidden", showHeaderBorder ? "border-b border-border" : "")}>
          {showMobileMenuButton ? (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-foreground"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          ) : null}
          <span className={cn("text-font-bold text-lg capitalize", showMobileMenuButton ? "ml-4" : "")}>
            {headerTitle ?? `${userRole} Portal`}
          </span>
          {headerRight ? <div className="ml-auto">{headerRight}</div> : null}
        </header>

        {headerTitle || headerRight ? (
          <header className={cn("hidden h-16 items-center bg-surface px-6 md:flex", showHeaderBorder ? "border-b border-border" : "")}>
            <span className="text-lg font-semibold text-foreground">{headerTitle ?? `${userRole} Portal`}</span>
            {headerRight ? <div className="ml-auto">{headerRight}</div> : null}
          </header>
        ) : null}

        <main className={`flex-1 overflow-auto p-4 md:p-8 ${showBottomNav ? "pb-24 md:pb-8" : ""}`}>
          <div className="mx-auto max-w-6xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {showBottomNav ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-safe md:hidden">
          <div
            className="grid h-20"
            style={{ gridTemplateColumns: `repeat(${Math.min(6, navItems.length)}, minmax(0, 1fr))` }}
          >
            {navItems.slice(0, 6).map((item) => {
              const isActive = isNavItemActive(item.href);
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-brand-red" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
