import { getAccessToken } from "./auth";

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const withAuthHeaders = () => {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Missing access token");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const upsertMyUserLocation = async (latitude: number, longitude: number) => {
  const response = await fetch(`${BaseURL}/location/users/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...withAuthHeaders(),
    },
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
};
