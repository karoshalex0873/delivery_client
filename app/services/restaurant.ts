const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type RestaurantPayload = {
  name: string;
  address: string;
  description?: string;
  phoneNumber: string;
};

export type RestaurantAdminPayload = RestaurantPayload & {
  userId: string;
};

export type RestaurantOwnerRecord = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export type MenuItemPayload = {
  name: string;
  price: number;
};

export type MenuItemRecord = MenuItemPayload & {
  id: string;
  restaurantId: string;
};

export type RestaurantRecord = RestaurantPayload & {
  id: string;
  userId: string;
  user?: RestaurantOwnerRecord;
  menuItems?: MenuItemRecord[];
};

export type OrderItemRecord = {
  id: string;
  quantity: number;
  price: number;
  orderId: string;
  menuItemId: string;
  menuItem: MenuItemRecord;
};

export type RestaurantOrderRecord = {
  id: string;
  status: string;
  totalPrice: number;
  userId: string;
  riderId?: string | null;
  restaurantId: string;
  user?: RestaurantOwnerRecord;
  rider?: {
    id: string;
    name: string;
    phoneNumber: string;
    status: string;
    address: string;
  } | null;
  orderItems?: OrderItemRecord[];
};

export type RestaurantOrderUserLocationRecord = {
  orderId: string;
  orderStatus: string;
  user: RestaurantOwnerRecord;
  location: {
    userId: string;
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
};

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("accessToken");
};

const withAuthHeaders = () => {
  const token = getToken();
  if (!token) {
    throw new Error("Missing access token");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const parseError = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (typeof data?.message === "string") {
      return data.message;
    }
    if (Array.isArray(data?.message)) {
      return data.message.join(", ");
    }
  } catch {
    const text = await response.text();
    if (text) {
      return text;
    }
  }
  return fallback;
};

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  ...withAuthHeaders(),
});

export const getMyRestaurant = async () => {
  const response = await fetch(`${BaseURL}/restaurant/me`, {
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load restaurant"));
  }

  return response.json() as Promise<RestaurantRecord>;
};

export const createMyRestaurant = async (payload: RestaurantPayload) => {
  const response = await fetch(`${BaseURL}/restaurant/me`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to create restaurant"));
  }

  return response.json() as Promise<RestaurantRecord>;
};

export const updateMyRestaurant = async (payload: Partial<RestaurantPayload>) => {
  const response = await fetch(`${BaseURL}/restaurant/me`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update restaurant"));
  }

  return response.json() as Promise<RestaurantRecord>;
};

export const getAllRestaurants = async () => {
  const response = await fetch(`${BaseURL}/restaurant/all`, {
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load restaurants"));
  }

  return response.json() as Promise<RestaurantRecord[]>;
};

export const createRestaurantForUser = async (payload: RestaurantAdminPayload) => {
  const response = await fetch(`${BaseURL}/restaurant/admin/create`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to create restaurant"));
  }

  return response.json() as Promise<RestaurantRecord>;
};

export const updateRestaurantById = async (id: string, payload: Partial<RestaurantPayload>) => {
  const response = await fetch(`${BaseURL}/restaurant/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update restaurant"));
  }

  return response.json() as Promise<RestaurantRecord>;
};

export const deleteRestaurantById = async (id: string) => {
  const response = await fetch(`${BaseURL}/restaurant/${id}`, {
    method: "DELETE",
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to delete restaurant"));
  }

  return response.json() as Promise<RestaurantRecord>;
};

export const getMyMenuItems = async () => {
  const response = await fetch(`${BaseURL}/restaurant/me/menu-items`, {
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load menu items"));
  }

  return response.json() as Promise<MenuItemRecord[]>;
};

export const getMyOrders = async () => {
  const response = await fetch(`${BaseURL}/restaurant/me/orders`, {
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load orders"));
  }

  return response.json() as Promise<RestaurantOrderRecord[]>;
};

export const getMyOrderUserLocations = async () => {
  const response = await fetch(`${BaseURL}/restaurant/me/orders/user-locations`, {
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load order user locations"));
  }

  return response.json() as Promise<RestaurantOrderUserLocationRecord[]>;
};

export const createMyMenuItem = async (payload: MenuItemPayload) => {
  const response = await fetch(`${BaseURL}/restaurant/me/menu-items`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to create menu item"));
  }

  return response.json() as Promise<MenuItemRecord>;
};

export const updateMyMenuItem = async (id: string, payload: Partial<MenuItemPayload>) => {
  const response = await fetch(`${BaseURL}/restaurant/me/menu-items/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update menu item"));
  }

  return response.json() as Promise<MenuItemRecord>;
};

export const deleteMyMenuItem = async (id: string) => {
  const response = await fetch(`${BaseURL}/restaurant/me/menu-items/${id}`, {
    method: "DELETE",
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to delete menu item"));
  }

  return response.json() as Promise<MenuItemRecord>;
};

export const getRestaurantOrdersById = async (restaurantId: string) => {
  const response = await fetch(`${BaseURL}/restaurant/${restaurantId}/orders`, {
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load restaurant orders"));
  }

  return response.json() as Promise<RestaurantOrderRecord[]>;
};

export const upsertMyRestaurantLocation = async (latitude: number, longitude: number) => {
  const response = await fetch(`${BaseURL}/restaurant/me/location`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update restaurant location"));
  }

  return response.json();
};
