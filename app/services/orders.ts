import type { RestaurantOrderRecord } from "./restaurant";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type CatalogMenuItemRecord = {
  id: string;
  name: string;
  price: number;
  restaurantId: string;
};

export type CatalogRestaurantRecord = {
  id: string;
  name: string;
  address: string;
  description?: string;
  phoneNumber: string;
  userId: string;
  menuItems?: CatalogMenuItemRecord[];
};

export type CustomerOrderItemRecord = {
  id: string;
  quantity: number;
  price: number;
  orderId: string;
  menuItemId: string;
  menuItem?: CatalogMenuItemRecord;
};

export type CustomerOrderRecord = {
  id: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  checkoutRequestId?: string | null;
  merchantRequestId?: string | null;
  mpesaReceiptNumber?: string | null;
  paidAt?: string | null;
  paymentFailureReason?: string | null;
  totalPrice: number;
  userId: string;
  riderId?: string | null;
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
    address: string;
    phoneNumber: string;
  };
  rider?: {
    id: string;
    name: string;
    phoneNumber: string;
    status: string;
    address: string;
  } | null;
  orderItems?: CustomerOrderItemRecord[];
};

export type CheckoutPayload = {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
};

export type InitiatePaymentPayload = {
  orderId: string;
  phoneNumber: string;
};

export type InitiatePaymentResponse = {
  order: CustomerOrderRecord;
  customerMessage: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseDescription?: string;
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

export const getOrderCatalog = async () => {
  const response = await fetch(`${BaseURL}/orders/catalog`, {
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load restaurants"));
  }

  return response.json() as Promise<CatalogRestaurantRecord[]>;
};

export const checkoutOrder = async (payload: CheckoutPayload) => {
  const response = await fetch(`${BaseURL}/orders/checkout`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to place order"));
  }

  return response.json() as Promise<CustomerOrderRecord>;
};

export const getMyCustomerOrders = async () => {
  const response = await fetch(`${BaseURL}/orders/me`, {
    headers: jsonHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load orders"));
  }

  return response.json() as Promise<CustomerOrderRecord[]>;
};

export const initiateDarajaPayment = async (payload: InitiatePaymentPayload) => {
  const response = await fetch(`${BaseURL}/payment/daraja/stk-push`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to initiate payment"));
  }

  return response.json() as Promise<InitiatePaymentResponse>;
};

export const updateRestaurantOrderStatus = async (orderId: string, status: string) => {
  const response = await fetch(`${BaseURL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update order status"));
  }

  return response.json() as Promise<RestaurantOrderRecord>;
};

export const restaurantAcceptOrder = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/orders/${orderId}/restaurant/accept`, {
    method: "PATCH",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to accept order"));
  }
  return response.json() as Promise<RestaurantOrderRecord>;
};

export const restaurantMarkOrderReady = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/orders/${orderId}/restaurant/ready`, {
    method: "PATCH",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to mark order ready"));
  }
  return response.json() as Promise<RestaurantOrderRecord>;
};

export const restaurantSignDeliveryStart = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/orders/${orderId}/restaurant/sign-delivery-start`, {
    method: "PATCH",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to sign delivery start"));
  }
  return response.json() as Promise<RestaurantOrderRecord>;
};

export const riderSignDeliveryStart = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/orders/${orderId}/rider/sign-delivery-start`, {
    method: "PATCH",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to sign delivery start"));
  }
  return response.json() as Promise<CustomerOrderRecord>;
};

export const customerConfirmDelivered = async (orderId: string) => {
  const response = await fetch(`${BaseURL}/orders/${orderId}/customer/confirm-delivered`, {
    method: "PATCH",
    headers: jsonHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to confirm delivery"));
  }
  return response.json() as Promise<CustomerOrderRecord>;
};
