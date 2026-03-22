import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { getRoleIdFromToken, signIn } from "~/services/auth";

const roleRedirects: Record<number, string> = {
  1: "/customer",
  2: "/rider",
  3: "/restaurant",
  4: "/admin",
};

const SignIn = () => {
  const navigate = useNavigate();
  // set up  form state for the sign-in form (e.g., phone number, password)
  const [form, setForm] = useState({
    phoneNumber: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // handleChange for the form inputs to update the state
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  // handleSubmit for the form to call the signIn function from the auth service and handle the response
  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    try {
      const data = await signIn({
        phoneNumber: form.phoneNumber,
        password: form.password,
      });

      const token = data?.accessToken ?? data?.token;
      const roleId = Number(data?.roleId ?? (token ? getRoleIdFromToken(token) : null));

      if (!token || !roleRedirects[roleId]) {
        throw new Error("Sign in response is missing role access details");
      }

      localStorage.setItem("accessToken", token);
      navigate(roleRedirects[roleId] ?? "/");
      setStatus("Sign in successful");

      // reset the form
      setForm({
        phoneNumber: "",
        password: "",
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      setError(message);
    }
  };

  return (
    <section className="auth-card">
      <h2>Sign in</h2>
      <p className="muted">Enter your phone number and password.</p>
      {status && <p className="form-message form-message-success">{status}</p>}
      {error && <p className="form-message form-message-error">{error}</p>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="input">
          Phone number
          <input
            type="tel"
            name="phoneNumber"
            placeholder="+254XXXXXXXXX"
            value={form.phoneNumber}
            onChange={handleChange}
          />
        </label>
        <label className="input">
          Password
          <input
            type="password"
            name="password"
            placeholder="Your password"
            value={form.password}
            onChange={handleChange}
          />
        </label>
        <button className="button" type="submit">Continue</button>
      </form>
    </section>
  );
};

export default SignIn;
