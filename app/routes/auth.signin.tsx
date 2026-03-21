const SignIn = () => {
  return (
    <section className="auth-card">
      <h2>Sign in</h2>
      <p className="muted">Enter your phone number and password.</p>

      <form className="form-grid">
        <label className="input">
          Phone number
          <input type="tel" name="phone" placeholder="0803 000 0000" />
        </label>
        <label className="input">
          Password
          <input type="password" name="password" placeholder="Your password" />
        </label>
        <button className="button" type="submit">Continue</button>
      </form>
    </section>
  );
};

export default SignIn;
