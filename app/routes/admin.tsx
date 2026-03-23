import { Link, Outlet, useLocation } from "react-router";
import { useState } from "react";
import { useRoleGuard } from "../components/role-guard";
import { LayoutDashboard, Utensils, Bike, Users, Home, ChevronLeft, ChevronRight } from "lucide-react";

const AdminLayoutRoute = () => {
  const authorized = useRoleGuard(4);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const urls = {
    dashboard: "/admin",
    restaurants: "/admin/restaurants",
    riders: "/admin/riders",
    customers: "/admin/customers",
  };

  const navItemClass = (href: string) => {
    const isActive = location.pathname === href;
    return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 
      ${isActive
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`;
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">D</div>
            <div>
              <h1 className="text-sm font-bold leading-none">Derivery Admin</h1>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Management Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-slate-500">admin@derivery.com</p>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 shadow-sm" />
          </div>
        </div>
      </header>

      <div className="flex w-full gap-6 p-6">
        {/* Sidebar Navigation */}
        <aside
          className={`flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? "w-16" : "w-64"}`}
        >
          <div className="sticky top-24 space-y-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mb-4 flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2 text-xs font-semibold"><ChevronLeft size={16} /> Collapse Menu</div>}
            </button>

            <nav className="space-y-1">
              <Link className={navItemClass(urls.dashboard)} to={urls.dashboard}>
                <LayoutDashboard size={18} />
                {!isCollapsed && <span>Dashboard</span>}
              </Link>
              <Link className={navItemClass(urls.restaurants)} to={urls.restaurants}>
                <Utensils size={18} />
                {!isCollapsed && <span>Restaurants</span>}
              </Link>
              <Link className={navItemClass(urls.riders)} to={urls.riders}>
                <Bike size={18} />
                {!isCollapsed && <span>Riders</span>}
              </Link>
              <Link className={navItemClass(urls.customers)} to={urls.customers}>
                <Users size={18} />
                {!isCollapsed && <span>Customers</span>}
              </Link>

              <div className="my-4 border-t border-slate-200 pt-4" />

              <Link className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100" to="/">
                <Home size={18} />
                {!isCollapsed && <span>Back to Home</span>}
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutRoute;