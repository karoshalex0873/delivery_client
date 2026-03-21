import { Link, Outlet } from "react-router";

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <section className="panel-header">
        <span>Account</span>
        <h1 className="hero-title">Start delivering confidence.</h1>
        <p className="muted">
          Keep your deliveries and kitchen ops in one place. Choose how you want
          to join the flow.
        </p>
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
