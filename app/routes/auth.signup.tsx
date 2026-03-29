import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { getAccessToken, isTokenExpired, signUp } from "~/services/auth";
import { AuthDeliveryVisual } from "~/components/auth-delivery-visual";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      navigate('/customer', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailPattern.test(formData.email.trim().toLowerCase())) {
      setError("Enter a valid email address");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUp({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      navigate("/auth/signin");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-grid">
      <div className="auth-panel lg:rounded-r-[3rem]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-md space-y-3"
        >
          <div className="space-y-1 text-center">
            <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red text-xl font-bold text-white shadow-lg shadow-brand-red/20">
              Q
            </div>
            <h1 className="auth-title text-2xl">Create Account</h1>
            <p className="auth-subtitle text-xs leading-relaxed">
              Sign up today and get free delivery on your first order!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="auth-error">{error}</div>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="ml-1 text-sm font-bold text-foreground" htmlFor="firstName">First name</label>
                <div className="relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    placeholder="Jane"
                    className="input-field pr-12"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <User className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-muted-foreground/50" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-sm font-bold text-foreground" htmlFor="lastName">Last name</label>
                <div className="relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Doe"
                    className="input-field pr-12"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  <User className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-muted-foreground/50" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-sm font-bold text-foreground" htmlFor="email">Email</label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="input-field pr-12"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Mail className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-muted-foreground/50" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-sm font-bold text-foreground" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Create password"
                  className="input-field pr-12"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-sm font-bold text-foreground" htmlFor="confirmPassword">Confirm password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Confirm password"
                  className="input-field pr-12"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary h-12 w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Creating account...
                </span>
              ) : (
                "Create Customer Account"
              )}
            </button>
          </form>

          <div className="space-y-1 text-center mt-4">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth/signin" className="font-semibold text-brand-red hover:underline">
                Sign in
              </Link>
            </p>
            <p>
              <a
                href="mailto:careers@quickbite.co.ke?subject=QuickBite%20Application"
                className="auth-application-link text-xs"
              >
                Join as Rider or Restaurant
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      <AuthDeliveryVisual
        title="Start today. Deliveries in motion."
        subtitle="Create your account and follow every order from checkout to doorstep."
      />
    </div>
  );
}


