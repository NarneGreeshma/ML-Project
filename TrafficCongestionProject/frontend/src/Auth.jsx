import { useState } from "react";
import "./Auth.css";

const API = "http://127.0.0.1:5000";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });

  const isRegister = mode === "register";
  const update = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
    setSuccess("");
  };

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isRegister && form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API}/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Authentication failed.");

      if (data.user) {
        onAuthenticated(data.user);
      } else {
        setSuccess("Account created. You can now sign in.");
        setMode("login");
        setForm({ ...form, name: "", password: "", confirmPassword: "" });
      }
    } catch (err) {
      setError(err.message || "Could not connect to the backend. Is Flask running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-scene">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-orbit orbit-one" aria-hidden="true" />
      <div className="auth-orbit orbit-two" aria-hidden="true" />
      <div className="auth-city" aria-hidden="true">
        {Array.from({ length: 19 }, (_, i) => (
          <div className="city-building" key={i} style={{
            "--i": i,
            "--height": `${45 + ((i * 37) % 105)}px`,
          }}>
            {Array.from({ length: 8 }, (_, j) => <i key={j} />)}
          </div>
        ))}
      </div>
      <div className="auth-road road-a" aria-hidden="true"><span /><span /><span /></div>
      <div className="auth-road road-b" aria-hidden="true"><span /><span /><span /></div>

      <section className="auth-layout">
        <div className="auth-brand">
          <div className="brand-mark"><span> T </span><i /></div>
          <div className="brand-word">TRAFFIC<span>IQ</span></div>
          <div className="brand-kicker">INTELLIGENT MOBILITY · MACHINE LEARNING</div>
          <h1>See the flow.<br /><em>Predict what’s next.</em></h1>
          <p>Turn traffic patterns into clear congestion insights with machine learning.</p>
          <div className="live-status"><span className="live-dot" /> PREDICTION ENGINE <b>READY</b></div>
          <div className="auth-mini-stats">
            <div><strong>03</strong><span>CONGESTION CLASSES</span></div>
            <div><strong>ML</strong><span>GRADIENT BOOSTING</span></div>
          </div>
        </div>

        <section className="auth-card">
          <div className="auth-card-top">
            <div className="auth-eyebrow">{isRegister ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</div>
            <div className="auth-card-icon">↗</div>
          </div>
          <h2>{isRegister ? "Join TrafficIQ" : "Sign in to TrafficIQ"}</h2>
          <p className="auth-subtitle">
            {isRegister ? "Create an account to access your workspace." : "Your traffic intelligence workspace awaits."}
          </p>

          <div className="auth-switch" role="tablist" aria-label="Authentication mode">
            <button type="button" className={!isRegister ? "active" : ""} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>Sign in</button>
            <button type="button" className={isRegister ? "active" : ""} onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>Create account</button>
          </div>

          <form onSubmit={submit}>
            {isRegister && (
              <label className="auth-field">
                <span>FULL NAME</span>
                <input name="name" value={form.name} onChange={update} placeholder="Your name" autoComplete="name" required />
              </label>
            )}
            <label className="auth-field">
              <span>EMAIL ADDRESS</span>
              <input type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required />
            </label>
            <label className="auth-field">
              <span>PASSWORD</span>
              <div className="password-wrap">
                <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={update} placeholder="At least 8 characters" autoComplete={isRegister ? "new-password" : "current-password"} minLength="8" required />
                <button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "HIDE" : "SHOW"}</button>
              </div>
              {isRegister && <div className="password-meter"><i style={{ width: `${Math.min(100, form.password.length * 10)}%` }} /></div>}
            </label>
            {isRegister && (
              <label className="auth-field">
                <span>CONFIRM PASSWORD</span>
                <input type={showPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Repeat your password" autoComplete="new-password" required />
              </label>
            )}

            {error && <div className="auth-message error" role="alert">{error}</div>}
            {success && <div className="auth-message success" role="status">{success}</div>}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? <><span className="button-spinner" /> Please wait…</> : <>{isRegister ? "Create account" : "Enter dashboard"} <span>↗</span></>}
            </button>
          </form>
          <div className="auth-foot"><span className="foot-lock">◇</span> Your account details are protected with password hashing.</div>
        </section>
      </section>
      <div className="auth-bottom"><span>TRAFFICIQ / ACCESS PORTAL</span><span>SMARTER ROADS START WITH BETTER INSIGHT</span><span>© 2026</span></div>
    </main>
  );
}
