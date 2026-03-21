const SignIn = () => {
  return (
    <section className="auth-card">
      <h2 className="hero-title">Sign in</h2>
      <p className="muted">Welcome back. Enter your details to continue.</p>

      <form className="form-grid">
        <label className="input">
          Email address
          <input type="email" name="email" placeholder="name@company.com" />
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
