const SignUp = () => {
  return (
    <section className="auth-card">
      <h2 className="hero-title">Sign up</h2>
      <p className="muted">Create an account to get started.</p>

      <form className="form-grid">
        <label className="input">
          Full name
          <input type="text" name="name" placeholder="Your name" />
        </label>
        <label className="input">
          Phone number
          <input type="tel" name="phone" placeholder="0803 000 0000" />
        </label>
        <label className="input">
          Email address
          <input type="email" name="email" placeholder="name@company.com" />
        </label>
        <label className="input">
          Password
          <input type="password" name="password" placeholder="Create a password" />
        </label>
        <button className="button" type="submit">Create account</button>
      </form>
    </section>
  );
};

export default SignUp;
