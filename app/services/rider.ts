import { getAccessToken } from "./auth";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type RiderProfile = {
  id: string;
  name: string;
  phoneNumber: string;
  status: "online" | "offline" | string;
  availabilityStatus: "active" | "inactive" | string;
  address: string;
  costPerKm?: number;
};

export type RiderOrderOffer = {
  orderId: string;
  orderStatus: string;
  totalPrice: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  riderToRestaurantKm: number;
  restaurantToCustomerKm: number;
  isEstimated?: boolean;
  restaurant: {
    id: string;
    name: string;
    address: string;
    phoneNumber: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
};

export type RiderAssignedOrder = {
  id: string;
  status: string;
  totalPrice: number;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  riderToPickupKm?: number | null;
  pickupToDropoffKm?: number | null;
  riderToDropoffKm?: number | null;
  restaurantLocation?: {
    latitude: number;
    longitude: number;
    updatedAt?: string;
  } | null;
  customerLocation?: {
    latitude: number;
    longitude: number;
    updatedAt?: string;
  } | null;
  restaurant?: {
    id: string;
    name: string;
    address: string;
    phoneNumber: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
};

const withAuthHeaders = () => {
  const token = getAccessToken();
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

export const getRiderMe = async () => {
  const response = await fetch(`${BaseURL}/rider/me`, {
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load rider profile"));
  }
  return response.json() as Promise<RiderProfile>;
};

export const updateRiderAvailability = async (status: "online" | "offline") => {
  const response = await fetch(`${BaseURL}/rider/me/availability`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update availability"));
  }
  return response.json() as Promise<RiderProfile>;
};

export const updateRiderActivity = async (availabilityStatus: "active" | "inactive") => {
  const response = await fetch(`${BaseURL}/rider/me/activity`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ availabilityStatus }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update rider activity"));
  }
  return response.json() as Promise<RiderProfile>;
};

export const updateRiderShippingRate = async (costPerKm: number) => {
  const response = await fetch(`${BaseURL}/rider/me/shipping-rate`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ costPerKm }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update shipping rate"));
  }
  return response.json() as Promise<RiderProfile>;
};

export const upsertRiderLocation = async (latitude: number, longitude: number) => {
  const response = await fetch(`${BaseURL}/rider/me/location`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ latitude, longitude }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update rider location"));
  }
  return response.json();
};

export const getRiderOrderOffers = async () => {
  const response = await fetch(`${BaseURL}/rider/me/order-offers`, {
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load order offers"));
  }
  return response.json() as Promise<RiderOrderOffer[]>;
};

export const getRiderAssignedOrders = async () => {
  const response = await fetch(`${BaseURL}/rider/me/assigned-orders`, {
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load assigned orders"));
  }
  return response.json() as Promise<RiderAssignedOrder[]>;
};

export const acceptRiderOrder = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/rider/orders/${orderId}/accept`, {
    method: "POST",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to accept order"));
  }
  return response.json();
};

export const passRiderOrder = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/rider/orders/${orderId}/pass`, {
    method: "POST",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to pass order"));
  }
  return response.json();
};

export const riderCancelOrder = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/orders/${orderId}/rider/cancel`, {
    method: "PATCH",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to cancel order"));
  }
  return response.json();
};

export const riderDeleteOrder = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/orders/${orderId}/rider`, {
    method: "DELETE",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to delete order"));
  }
  return response.json() as Promise<{ ok: boolean; message: string }>;
};
