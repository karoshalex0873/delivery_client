import { Outlet } from "react-router";
import { AuthNav } from "~/components/auth-nav";

const AuthLayout = () => {
  return (
    <div className="auth-shell">
      <AuthNav />
      <Outlet />
    </div>
  );
};

export default AuthLayout;
