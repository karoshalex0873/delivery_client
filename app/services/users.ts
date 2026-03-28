import { getAccessToken } from "~/services/auth";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  roleId: number;
  role?: {
    name: string;
  };
};

export type AdminDashboardStatsRecord = {
  dateToday: string;
  starsAverage: number;
  restaurantsCount: number;
  customersCount: number;
  ridersCount: number;
  activeRidersCount: number;
};

type UserQuery = {
  role?: string;
  available?: boolean;
};

export type AdminCreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  password?: string;
};

export type AdminUpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  roleId?: number;
};

const getToken = () => {
  return getAccessToken();
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

const buildQuery = (query?: UserQuery) => {
  if (!query) {
    return "";
  }
  const params = new URLSearchParams();
  if (query.role) {
    params.set("role", query.role);
  }
  if (typeof query.available === "boolean") {
    params.set("available", String(query.available));
  }
  const result = params.toString();
  return result ? `?${result}` : "";
};

export const getUsers = async (query?: UserQuery) => {
  const response = await fetch(`${BaseURL}/users${buildQuery(query)}`, {
    headers: {
      "Content-Type": "application/json",
      ...withAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load users"));
  }

  return response.json() as Promise<UserRecord[]>;
};

export const getAdminDashboardStats = async () => {
  const response = await fetch(`${BaseURL}/users/admin/starts`, {
    headers: {
      "Content-Type": "application/json",
      ...withAuthHeaders(),
    },
  });

  if (!response.ok) {
    const fallback = response.status === 404
      ? "Stats endpoint not found. Restart backend to load /users/admin/starts."
      : "Failed to load admin dashboard stats";
    throw new Error(await parseError(response, fallback));
  }

  return response.json() as Promise<AdminDashboardStatsRecord>;
};

export const adminCreateUser = async (payload: AdminCreateUserPayload) => {
  const response = await fetch(`${BaseURL}/users/admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...withAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to create user"));
  }

  return response.json() as Promise<UserRecord>;
};

export const adminUpdateUser = async (id: string, payload: AdminUpdateUserPayload) => {
  const response = await fetch(`${BaseURL}/users/admin/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...withAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update user"));
  }

  return response.json() as Promise<UserRecord>;
};

export const adminDeleteUser = async (id: string) => {
  const response = await fetch(`${BaseURL}/users/admin/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...withAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to delete user"));
  }

  return response.json() as Promise<{ ok: boolean }>;
};
