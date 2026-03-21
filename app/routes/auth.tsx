import { Link, Outlet } from "react-router";

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <section className="panel-header">
        <h1>Account</h1>
        <p className="muted">Sign in or create an account.</p>
        <nav className="nav-pills">
          <Link className="pill" to="/">Home</Link>
          <Link className="pill" to="signin">Sign in</Link>
          <Link className="pill" to="signup">Sign up</Link>
        </nav>
      </section>
      <Outlet />
    </div>
  );
};

export default AuthLayout;
