import { Link, Outlet } from "react-router";

const AuthLayout = () => {
  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">Account</div>
        <nav className="nav-pills">
          <Link className="pill" to="/">Home</Link>
          <Link className="pill" to="signin">Sign in</Link>
          <Link className="pill" to="signup">Sign up</Link>
        </nav>
      </header>
      <section className="panel">
        <p className="muted">Sign in or create an account.</p>
        <Outlet />
      </section>
    </div>
  );
};

export default AuthLayout;
