import { Link } from "react-router";

const Restaurant = () => {
  const owner = {
    id: "usr_rest_001",
    firstName: "Ngozi",
    lastName: "Eze",
    phoneNumber: "08030000003",
    roleId: 3,
  };

  const restaurant = {
    id: "res_001",
    name: "Sunrise Grill",
    address: "12 Allen Ave, Ikeja",
    phoneNumber: "08030000101",
    userId: owner.id,
  };

  const menuItems = [
    { id: "menu_001", name: "Jollof Rice", price: 2500, restaurantId: restaurant.id },
    { id: "menu_002", name: "Grilled Chicken", price: 4200, restaurantId: restaurant.id },
    { id: "menu_003", name: "Fried Plantain", price: 1500, restaurantId: restaurant.id },
  ];

  const orders = [
    { id: "ord_1001", status: "preparing", totalPrice: 8200, userId: "usr_001", restaurantId: restaurant.id, riderId: "rider_001" },
    { id: "ord_1002", status: "ready", totalPrice: 5800, userId: "usr_002", restaurantId: restaurant.id, riderId: null },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">Restaurant Studio</div>
        <nav className="nav-pills">
          <Link className="pill" to="/">Home</Link>
          <Link className="pill" to="/auth/signin">Staff login</Link>
        </nav>
      </header>

      <section className="panel">
        <div className="panel-header">
          <span>Kitchen view</span>
          <h1>{restaurant.name}</h1>
          <p className="muted">{restaurant.address} • {restaurant.phoneNumber}</p>
        </div>

        <div className="card-grid">
          <div className="card">
            <h3>Menu items</h3>
            <div className="list">
              {menuItems.map((item) => (
                <div className="list-item" key={item.id}>
                  <div>{item.name}</div>
                  <span>₦{item.price}</span>
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
          <div className="card">
            <h3>Owner</h3>
            <div className="list">
              <div className="list-item">
                <div>Name</div>
                <span>{owner.firstName} {owner.lastName}</span>
              </div>
              <div className="list-item">
                <div>Phone</div>
                <span>{owner.phoneNumber}</span>
              </div>
              <div className="list-item">
                <div>Role ID</div>
                <span>{owner.roleId}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Restaurant;
