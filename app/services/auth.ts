export type SignUpPayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  confirmPassword?: string;
  roleId: number;
};

export type SignInPayload = {
  phoneNumber: string;
  password: string;
}

const BaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function signUp(payload: SignUpPayload) {
  const response = await fetch(`${BaseURL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Sign up failed";
    try {
      const data = await response.json();
      if (typeof data?.message === "string") {
        message = data.message;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  return response.json();
}

export const signIn = async (payload: SignInPayload) => {
    const response = await fetch(`${BaseURL}/auth/signin`,{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    // if the response is not ok, try to extract the error message from the response body and throw an error with that message
    if (!response.ok) {
      let message = "Sign in failed";
      try {
        const data = await response.json();
        if (typeof data?.message === "string") {
          message = data.message;
        }
      } catch (error) {
        const text = await response.text();
        if (text) {
          message = text;
        }
      }
      throw new Error(message);
    }
    return response.json();
}

type TokenPayload = {
  sub?: string;
  roleId?: number;
  exp?: number;
};

export const getAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("accessToken");
};

export const clearAccessToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
  }
};

export const parseJwt = (token: string): TokenPayload | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), "=");
    const jsonPayload = atob(padded);
    return JSON.parse(jsonPayload) as TokenPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const payload = parseJwt(token);
  if (!payload?.exp) {
    return true;
  }
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

export const getRoleIdFromToken = (token: string) => {
  return parseJwt(token)?.roleId ?? null;
};
