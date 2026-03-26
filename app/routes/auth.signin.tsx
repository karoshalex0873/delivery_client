﻿import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { useSignIn, useUser } from "@clerk/clerk-react";
import { getAccessToken, getRoleIdFromToken, isTokenExpired, signIn, signInWithGoogle } from "~/services/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn: clerkSignIn, isLoaded: isClerkSignInLoaded } = useSignIn();
  const { user, isLoaded: isClerkUserLoaded } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleSyncTriggered = useRef(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const completeLogin = (data: any) => {
    const token = data?.accessToken ?? data?.token;

    if (!token) {
      throw new Error("No access token received");
    }

    localStorage.setItem("accessToken", token);
    const roleId = Number(data?.roleId ?? getRoleIdFromToken(token) ?? 1);
    localStorage.setItem("roleId", `${Number.isNaN(roleId) ? 1 : roleId}`);
    navigate("/customer");
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      navigate("/customer", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const token = getAccessToken();
    const hasValidAppToken = Boolean(token && !isTokenExpired(token));

    if (!isClerkUserLoaded || !user || hasValidAppToken || googleSyncTriggered.current) {
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      setError("Google account does not have a primary email.");
      return;
    }

    googleSyncTriggered.current = true;
    setIsGoogleLoading(true);
    setError(null);

    signInWithGoogle({
      email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      googleId: user.id,
    })
      .then((data) => {
        completeLogin(data);
      })
      .catch((err: any) => {
        setError(err?.message ?? "Google sign in failed");
      })
      .finally(() => {
        setIsGoogleLoading(false);
      });
  }, [isClerkUserLoaded, user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();

    if (!emailPattern.test(email)) {
      setError("Enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const data = await signIn({ email, password });
      completeLogin(data);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleContinue = async () => {
    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
    if (!publishableKey) {
      setError("Clerk is not configured. Add VITE_CLERK_PUBLISHABLE_KEY to client environment.");
      return;
    }

    if (!isClerkSignInLoaded || !clerkSignIn) {
      setError("Google sign in is still loading. Try again.");
      return;
    }

    setIsGoogleLoading(true);
    setError(null);

    try {
      await clerkSignIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/auth/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/auth/signin?oauth=complete`,
      });
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.message ?? "Google sign in failed");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="auth-grid">
      <div className="auth-panel lg:rounded-r-[3rem]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-md space-y-7"
        >
          <div className="space-y-2">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red text-2xl font-bold text-white shadow-lg shadow-brand-red/20">
              Q
            </div>
            <h1 className="auth-title">Sign in to QuickBite</h1>
            <p className="auth-subtitle">Start from sign in. If you are new, create a customer account from sign up.</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleContinue}
            disabled={isGoogleLoading}
            className="btn btn-outline h-12 w-full gap-2"
          >
            {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FcGoogle className="h-5 w-5" />}
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-3 text-muted-foreground">or use email and password</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="auth-error">{error}</div>}

            <div className="space-y-2">
              <label className="ml-1 text-sm font-bold text-foreground" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="input-field pl-12"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="ml-1 flex items-center justify-between">
                <label className="text-sm font-bold text-foreground" htmlFor="password">Password</label>
                <Link to="/auth/forgot-password" className="text-sm font-semibold text-brand-red hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required
                  className="input-field pl-12 pr-12"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5 " />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary h-12 w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Do not have an account?{" "}
              <Link to="/auth/signup" className="font-semibold text-brand-red hover:underline">
                Sign up as customer
              </Link>
            </p>
            <p>
              <a
                href="mailto:careers@quickbite.co.ke?subject=QuickBite%20Application"
                className="auth-application-link"
              >
                Want to join as Rider or Restaurant? Send an application.
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden bg-background p-12 lg:flex">
        <div className="absolute right-0 top-0 h-125 w-125 -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-red/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-125 w-125 -translate-x-1/3 translate-y-1/3 rounded-full bg-warning/10 blur-[100px]" />
        <div className="relative z-10 max-w-lg space-y-4 text-center">
          <h2 className="h2">Fast login. Fast ordering.</h2>
          <p className="text-subtle">Use Google or your email and password to continue quickly.</p>
        </div>
      </div>
    </div>
  );
}