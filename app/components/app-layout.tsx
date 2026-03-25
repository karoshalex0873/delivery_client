import { Link, NavLink, useNavigate } from "react-router";
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
}

export function AppLayout({ children, navItems, userRole }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useClerk();

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
    <div className="min-h-screen bg-background text-foreground flex">
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
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-surface border-r border-border transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:h-screen md:flex md:flex-col",
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

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
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
        <header className="flex h-16 items-center border-b border-border bg-surface px-6 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-foreground"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <span className="ml-4 text-font-bold text-lg capitalize">{userRole} Portal</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
