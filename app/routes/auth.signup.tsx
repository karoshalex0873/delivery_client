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

    try {
      // call the signUp function from the auth service with the form data, converting roleId to a number and handling optional confirmPassword
      await signUp({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        password: form.password,
        confirmPassword: form.confirmPassword || undefined,
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
    <section className="flex flex-col gap-4 px-10 py-3 justify-center items-center w-full">
      <h2>Sign up</h2>
      <p className="muted">Create an account with your phone number.</p>

      <form className="form-grid min-w-md" onSubmit={handleSubmit}>
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
        {status && <p>{status}</p>}
        {error && <p className="muted">{error}</p>}
      </form>
    </section>
  );
};

export default SignUp;
