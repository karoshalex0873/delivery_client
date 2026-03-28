import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router";
import { useClerk } from "@clerk/clerk-react";
import { Bike, LayoutDashboard, LineChart, LogOut, Settings, User, Users, Utensils, Wrench, X } from "lucide-react";
import { useRoleGuard } from "../components/role-guard";
import { getCurrentUser, logout as logoutUser, type CurrentUserRecord } from "../services/auth";
import { AppLayout, type NavItem } from "~/components/app-layout";

const AdminLayoutRoute = () => {
  const authorized = useRoleGuard(4);
  const { signOut } = useClerk();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUserRecord | null>(null);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    let isMounted = true;
    const loadCurrentUser = async () => {
      try {
        const me = await getCurrentUser();
        if (isMounted) {
          setCurrentUser(me);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      }
    };

    void loadCurrentUser();
    return () => {
      isMounted = false;
    };
  }, [authorized]);

  const handleLogout = async () => {
    await logoutUser();
    try {
      await signOut();
    } catch {
      // Ignore if Clerk session does not exist.
    }
    window.location.href = "/auth/signin";
  };

  if (!authorized) {
    return null;
  }

  const navItems: NavItem[] = [
    { title: "Home", href: "/admin", icon: LayoutDashboard },
    { title: "Restaurants", href: "/admin/restaurants", icon: Utensils },
    { title: "Riders", href: "/admin/riders", icon: Bike },
    { title: "Customers", href: "/admin/customers", icon: Users },
    { title: "Analytics", href: "/admin/analytics", icon: LineChart },
    { title: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const displayName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";
  const displayEmail = currentUser?.email ?? "admin@derivery.app";

  const headerRight = (
    <button
      type="button"
      onClick={() => setShowSettingsModal(true)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
      aria-label="Open admin settings"
    >
      <Settings className="h-5 w-5" />
    </button>
  );

  return (
    <>
      <AppLayout
        navItems={navItems}
        userRole="admin"
        showBottomNav
        headerTitle={displayName}
        headerRight={headerRight}
        showMobileMenuButton={false}
      >
        <Outlet />
      </AppLayout>

      {showSettingsModal ? (
        <div
          className="fixed inset-0 z-70 bg-black/20"
          role="dialog"
          aria-modal="true"
          aria-label="Admin settings"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="absolute right-4 top-20 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Admin Settings</p>
                <p className="text-xs text-muted-foreground">{displayName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{displayEmail}</p>
              </div>

              <Link
                to="/admin"
                onClick={() => setShowSettingsModal(false)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
              >
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                Dashboard
              </Link>
              <Link
                to="/admin/profile"
                onClick={() => setShowSettingsModal(false)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Profile
              </Link>
              <Link
                to="/admin/settings"
                onClick={() => setShowSettingsModal(false)}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
              >
                <Wrench className="h-4 w-4 text-muted-foreground" />
                Settings
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AdminLayoutRoute;
