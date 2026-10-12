import { useEffect, useState } from "react";
import App from "./App";
import Auth from "./Auth";

const API = "http://127.0.0.1:5000";

export default function AuthGate() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (active && response.ok && data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  if (checking) {
    return <div className="auth-loading"><span className="auth-loader" />Preparing TrafficIQ…</div>;
  }

  if (!user) {
    return <Auth onAuthenticated={setUser} />;
  }

  return (
    <>
      <div className="auth-userbar">
        <span>Signed in as <strong>{user.name}</strong></span>
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch(`${API}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
              });
            } finally {
              setUser(null);
            }
          }}
        >
          Log out
        </button>
      </div>
      <App />
    </>
  );
}
