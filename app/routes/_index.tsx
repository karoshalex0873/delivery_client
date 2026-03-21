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

      <section className="panel">
        <div className="panel-header">
          <span>Dashboard</span>
          <h1>Choose a role</h1>
          <p className="muted">Open a basic dashboard for each role.</p>
        </div>

        <div className="card-grid">
          <div className="card">
            <h3>Customer</h3>
            <p>Browse menus and track orders.</p>
            <Link to="/customer">Open customer panel</Link>
          </div>
          <div className="card">
            <h3>Restaurant</h3>
            <p>Manage menu items and incoming orders.</p>
            <Link to="/restaurant">Open restaurant panel</Link>
          </div>
          <div className="card">
            <h3>Rider</h3>
            <p>View assigned deliveries.</p>
            <Link to="/rider">Open rider panel</Link>
          </div>
          <div className="card">
            <h3>Admin</h3>
            <p>See users, restaurants, and orders.</p>
            <Link to="/admin">Open admin panel</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
