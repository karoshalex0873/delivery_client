import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import { signUp } from "../services/auth";

const SignUp = () => {
  // set up form state to track input values and submission status
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    roleId: "1",
  });
  
  // status can be "Sign up successful" or null, error can be an error message or null
  const [status, setStatus] = useState<string | null>(null);
  // error state to capture any error messages from the sign-up process
  const [error, setError] = useState<string | null>(null);

  // handleChange updates the form state when any input changes, using the name attribute to identify which field to update
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // handleSubmit is called when the form is submitted, it prevents the default form submission behavior, resets status and error states, and then calls the signUp function with the form data
  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    // log the form data for debugging purposes
    console.log("Submitting form with data:", form);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Format phone number: replace leading '0' with '+254'
      const formattedPhone = form.phoneNumber.startsWith("0") 
        ? `+254${form.phoneNumber.slice(1)}` 
        : form.phoneNumber;

      // call the signUp function from the auth service with the form data, converting roleId to a number
      // We do NOT send confirmPassword as the backend DTO forbids non-whitelisted properties
      await signUp({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: formattedPhone,
        password: form.password,
        // confirmPassword is only for client-side validation
        roleId: Number(form.roleId),
      });

      setStatus("Sign up successful");
      // reset the form after successful submission
      setForm({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        roleId: "1",
      });
      
    } catch (err) {
      // catch any errors from the sign-up process and set the error state to display the error message to the user
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
    }
  };

  return (
    <section className="auth-card">
      <h2>Sign up</h2>
      <p className="muted">Create an account with your phone number.</p>
      {status && <p className="form-message form-message-success">{status}</p>}
      {error && <p className="form-message form-message-error">{error}</p>}

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="input">
          First name
          <input
            type="text"
            name="firstName"
            placeholder="First name"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </label>
        <label className="input">
          Last name
          <input
            type="text"
            name="lastName"
            placeholder="Last name"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </label>
        <label className="input">
          Phone number
          <input
            type="tel"
            name="phoneNumber"
            placeholder="0803 000 0000"
            value={form.phoneNumber}
            onChange={handleChange}
            required
          />
        </label>
        <label className="input">
          Role
          <select name="roleId" value={form.roleId} onChange={handleChange}>
            <option value="1">Customer</option>
            <option value="2">Rider</option>
            <option value="3">Restaurant</option>
            <option value="4">Admin</option>
          </select>
        </label>
        <label className="input">
          Password
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <label className="input">
          Confirm password
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>
        <button className="button" type="submit">Create account</button>
      </form>
    </section>
  );
};

export default SignUp;
