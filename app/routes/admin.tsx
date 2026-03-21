import { Link } from "react-router";

const Admin = () => {
  const roles = [
    { id: 1, name: "customer" },
    { id: 2, name: "rider" },
    { id: 3, name: "restaurant" },
    { id: 4, name: "admin" },
  ];

  const users = [
    { id: "usr_001", firstName: "Amina", lastName: "Okoro", phoneNumber: "08030000001", roleId: 1 },
    { id: "usr_002", firstName: "David", lastName: "Mensah", phoneNumber: "08030000002", roleId: 1 },
    { id: "usr_003", firstName: "Ngozi", lastName: "Eze", phoneNumber: "08030000003", roleId: 3 },
    { id: "usr_004", firstName: "Tunde", lastName: "Adebayo", phoneNumber: "08030000004", roleId: 4 },
  ];

  const restaurants = [
    { id: "res_001", name: "Sunrise Grill", address: "12 Allen Ave, Ikeja", phoneNumber: "08030000101", userId: "usr_003" },
    { id: "res_002", name: "Coastal Bites", address: "24 Admiralty Way, Lekki", phoneNumber: "08030000102", userId: "usr_004" },
  ];

  const riders = [
    { id: "rider_001", name: "Ibrahim Musa", phoneNumber: "08030000011", status: "online", address: "Ikeja, Lagos" },
    { id: "rider_002", name: "Kemi Bello", phoneNumber: "08030000012", status: "offline", address: "Wuse, Abuja" },
  ];

  const orders = [
    { id: "ord_1001", status: "out_for_delivery", totalPrice: 8200, userId: "usr_001", restaurantId: "res_001", riderId: "rider_001" },
    { id: "ord_1002", status: "delivered", totalPrice: 5800, userId: "usr_002", restaurantId: "res_002", riderId: null },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">Admin Console</div>
        <nav className="nav-pills">
          <Link className="pill" to="/">Home</Link>
          <Link className="pill" to="/auth/signin">Switch account</Link>
        </nav>
      </header>

      <section className="panel">
        <div className="panel-header">
          <span>Operations</span>
          <h1 className="hero-title">System overview and live insights.</h1>
          <p className="muted">Monitor fulfillment, customer activity, and rider health.</p>
        </div>

        <div className="stats">
          <div className="stat">
            <strong>128</strong>
            <span>Orders processed today</span>
          </div>
          <div className="stat">
            <strong>92%</strong>
            <span>On-time delivery rate</span>
          </div>
          <div className="stat">
            <strong>14</strong>
            <span>Active restaurants</span>
          </div>
        </div>

        <div className="card-grid">
          <div className="card">
            <h3>Users</h3>
            <div className="list">
              {users.map((user) => {
                const role = roles.find((item) => item.id === user.roleId);
                return (
                  <div className="list-item" key={user.id}>
                    <div>{user.firstName} {user.lastName}</div>
                    <span>{role?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <h3>Restaurants</h3>
            <div className="list">
              {restaurants.map((restaurant) => (
                <div className="list-item" key={restaurant.id}>
                  <div>{restaurant.name}</div>
                  <span>{restaurant.phoneNumber}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Riders</h3>
            <div className="list">
              {riders.map((rider) => (
                <div className="list-item" key={rider.id}>
                  <div>{rider.name}</div>
                  <span>{rider.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Orders</h3>
            <div className="list">
              {orders.map((order) => (
                <div className="list-item" key={order.id}>
                  <div>{order.id}</div>
                  <span>{order.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admin;
