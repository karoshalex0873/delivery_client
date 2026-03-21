import { Link } from "react-router";
import type { Route } from "../+types/root";

// meta function to set the page title and description
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "welcome to pinnacle courier" }
  ]
}

const Index = () => {
  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">Pinnacle Courier</div>
        <nav className="nav-pills">
          <Link className="pill" to="/auth/signin">Sign in</Link>
          <Link className="pill" to="/auth/signup">Create account</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="role-tag">Delivery MVP</div>
        <h1 className="hero-title">Fast deliveries for every role in the flow.</h1>
        <p className="hero-subtitle">
          A clean, role-based entry point for customers, restaurants, riders, and
          admins. Pick a destination to preview the UI.
        </p>

        <div className="card-grid">
          <div className="card">
            <h3>Customer</h3>
            <p>Browse menus, track orders, and stay updated on delivery.</p>
            <Link to="/customer">Open customer panel</Link>
          </div>
          <div className="card">
            <h3>Restaurant</h3>
            <p>Manage menu items, incoming orders, and kitchen status.</p>
            <Link to="/restaurant">Open restaurant panel</Link>
          </div>
          <div className="card">
            <h3>Rider</h3>
            <p>Accept deliveries and monitor your live route status.</p>
            <Link to="/rider">Open rider panel</Link>
          </div>
          <div className="card">
            <h3>Admin</h3>
            <p>Oversee performance metrics and system health.</p>
            <Link to="/admin">Open admin panel</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
