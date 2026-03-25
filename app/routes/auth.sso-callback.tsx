import { AuthenticateWithRedirectCallback, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router";

export default function SsoCallback() {
  const { isLoaded, isSignedIn } = useUser();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/auth/signin?oauth=complete" replace />;
  }

  return <AuthenticateWithRedirectCallback />;
}
