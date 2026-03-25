import { Outlet } from "react-router";
import { useRoleGuard } from "../components/role-guard";
import { 
  LayoutDashboard, 
  Utensils, 
  Bike, 
  Users 
} from "lucide-react";
import { AppLayout, type NavItem } from "~/components/app-layout";

const AdminLayoutRoute = () => {
  const authorized = useRoleGuard(4);

  if (!authorized) {
    return null; 
  }

  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Restaurants", href: "/admin/restaurants", icon: Utensils },
    { title: "Riders", href: "/admin/riders", icon: Bike },
    { title: "Customers", href: "/admin/customers", icon: Users },
  ];

  return (
    <AppLayout navItems={navItems} userRole="admin">
      <Outlet />
    </AppLayout>
  );
};

export default AdminLayoutRoute;
