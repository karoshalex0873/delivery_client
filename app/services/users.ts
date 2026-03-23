import { getAccessToken } from "~/services/auth";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: number;
  role?: {
    name: string;
  };
};

type UserQuery = {
  role?: string;
  available?: boolean;
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
