import { Link } from "react-router";
import { useRoleGuard } from "~/components/role-guard";

const Rider = () => {
  const authorized = useRoleGuard(2);

  if (!authorized) {
    return null;
  }

  const rider = {
    id: "rider_001",
    name: "Ibrahim Musa",
    phoneNumber: "08030000011",
    status: "online",
    address: "Ikeja, Lagos",
  };

  const orders = [
    { id: "ord_1001", status: "pickup", totalPrice: 8200, userId: "usr_001", restaurantId: "res_001", riderId: rider.id },
    { id: "ord_1003", status: "delivering", totalPrice: 3400, userId: "usr_002", restaurantId: "res_002", riderId: rider.id },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">Rider Board</div>
        <nav className="nav-pills">
          <Link className="pill" to="/">Home</Link>
          <Link className="pill" to="/auth/signin">Rider login</Link>
        </nav>
      </header>

      <section className="panel">
        <div className="panel-header">
          <span>On duty</span>
          <h1>{rider.name}</h1>
          <p className="muted">{rider.address} • {rider.phoneNumber}</p>
        </div>

        <div className="card-grid">
          <div className="card">
            <h3>Assigned orders</h3>
            <div className="list">
              {orders.map((order) => (
                <div className="list-item" key={order.id}>
                  <div>{order.id}</div>
                  <span>{order.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Status</h3>
            <div className="list">
              <div className="list-item">
                <div>Availability</div>
                <span>{rider.status}</span>
              </div>
              <div className="list-item">
                <div>Rider ID</div>
                <span>{rider.id}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Rider;
