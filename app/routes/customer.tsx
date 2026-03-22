import { Link } from "react-router";
import { useRoleGuard } from "~/components/role-guard";

const Customer = () => {
  const authorized = useRoleGuard(1);

  if (!authorized) {
    return null;
  }

  const customer = {
    id: "usr_cus_001",
    firstName: "Amina",
    lastName: "Okoro",
    phoneNumber: "08030000001",
    roleId: 1,
  };

  const role = { id: 1, name: "customer" };

  const restaurant = {
    id: "res_001",
    name: "Sunrise Grill",
    address: "12 Allen Ave, Ikeja",
    phoneNumber: "08030000101",
    userId: "usr_rest_001",
  };

  const menuItems = [
    { id: "menu_001", name: "Jollof Rice", price: 2500, restaurantId: restaurant.id },
    { id: "menu_002", name: "Grilled Chicken", price: 4200, restaurantId: restaurant.id },
    { id: "menu_003", name: "Fried Plantain", price: 1500, restaurantId: restaurant.id },
  ];

  const rider = {
    id: "rider_001",
    name: "Ibrahim Musa",
    phoneNumber: "08030000011",
    status: "online",
    address: "Ikeja, Lagos",
  };

  const order = {
    id: "ord_1001",
    status: "out_for_delivery",
    totalPrice: 8200,
    userId: customer.id,
    restaurantId: restaurant.id,
    riderId: rider.id,
  };

  const orderItems = [
    { id: "oi_001", orderId: order.id, menuItemId: menuItems[0].id, quantity: 1, price: 2500 },
    { id: "oi_002", orderId: order.id, menuItemId: menuItems[1].id, quantity: 1, price: 4200 },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div className="brand">Customer Hub</div>
        <nav className="nav-pills">
          <Link className="pill" to="/">Home</Link>
          <Link className="pill" to="/auth/signin">Sign in</Link>
        </nav>
      </header>

      <section className="panel">
        <div className="panel-header">
          <span>Discover</span>
          <h1>Welcome back, {customer.firstName}.</h1>
          <p className="muted">Role: {role.name}. Track your latest order and menu picks.</p>
        </div>

        <div className="card-grid">
          <div className="card">
            <h3>Restaurant</h3>
            <p>{restaurant.name}</p>
            <p className="muted">{restaurant.address}</p>
            <Link to="/restaurant">View menu</Link>
          </div>
          <div className="card">
            <h3>Latest order</h3>
            <p>Order ID: {order.id}</p>
            <p className="muted">Status: {order.status}</p>
            <Link to="/rider">Track rider</Link>
          </div>
          <div className="card">
            <h3>Assigned rider</h3>
            <p>{rider.name}</p>
            <p className="muted">{rider.phoneNumber} • {rider.status}</p>
          </div>
        </div>

        <div className="card-grid">
          <div className="card">
            <h3>Order items</h3>
            <div className="list">
              {orderItems.map((item) => {
                const menuItem = menuItems.find((menu) => menu.id === item.menuItemId);
                return (
                  <div className="list-item" key={item.id}>
                    <div>{menuItem?.name}</div>
                    <span>{item.quantity} x ksh.{item.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <h3>Profile</h3>
            <div className="list">
              <div className="list-item">
                <div>Name</div>
                <span>{customer.firstName} {customer.lastName}</span>
              </div>
              <div className="list-item">
                <div>Phone</div>
                <span>{customer.phoneNumber}</span>
              </div>
              <div className="list-item">
                <div>Role ID</div>
                <span>{customer.roleId}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Customer;
