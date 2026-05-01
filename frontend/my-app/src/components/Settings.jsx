import { useState, useEffect } from "react";
import axios from "axios";
import "./Settings.css";

const API = "http://localhost:5000";

export default function SiteSettings({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Auth state
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    navLogo: "",
    heroTitle: "",
    heroSub: "",
    footerText: "",
  });

  // ── Check existing token in localStorage ──
  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // ── Fetch settings when logged in ──
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/api/settings`);
        if (res.data && Object.keys(res.data).length > 0) {
          setSettings({
            navLogo: res.data.navLogo || "",
            heroTitle: res.data.heroTitle || "",
            heroSub: res.data.heroSub || "",
            footerText: res.data.footerText || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [isLoggedIn]);

  // ── Handle Login ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!username || !password) {
      setAuthError("All fields are required");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        username,
        password,
      });

      const receivedToken = res.data.token;
      localStorage.setItem("adminToken", receivedToken);
      setToken(receivedToken);
      setIsLoggedIn(true);
      setAuthError("");
    } catch (err) {
      setAuthError(err.response?.data?.error || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Handle Register ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!username || !password || !confirmPassword) {
      setAuthError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/register`, {
        username,
        password,
      });

      const receivedToken = res.data.token;
      localStorage.setItem("adminToken", receivedToken);
      setToken(receivedToken);
      setIsLoggedIn(true);
      setAuthError("");
    } catch (err) {
      setAuthError(err.response?.data?.error || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Handle Logout ──
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  // ── Handle input change ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  // ── Save settings ──
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.post(`${API}/api/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLastSaved(new Date().toLocaleTimeString());

      // Show success
      const btn = document.getElementById("save-btn");
      if (btn) {
        btn.textContent = "✅ Saved!";
        setTimeout(() => (btn.textContent = "💾 Save Settings"), 2000);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
        setAuthError("Session expired. Please login again.");
      } else {
        alert("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  // ══════════════════════════════════════════
  // RENDER: Not logged in → show auth form
  // ══════════════════════════════════════════
  if (!isLoggedIn) {
    return (
      <div className="ss-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="ss-modal">

          {/* Header */}
          <div className="ss-header">
            <h2>⚙️ Site Settings</h2>
            <button className="ss-close" onClick={onClose}>✕</button>
          </div>

          {/* Auth Form */}
          <div className="ss-auth">
            {/* Tab Toggle */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                onClick={() => { setAuthMode("login"); setAuthError(""); }}
              >
                🔑 Login
              </button>
              <button
                className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                onClick={() => { setAuthMode("register"); setAuthError(""); }}
              >
                📝 Register
              </button>
            </div>

            {/* Error */}
            {authError && (
              <div className="auth-error">⚠️ {authError}</div>
            )}

            {/* Login Form */}
            {authMode === "login" && (
              <form onSubmit={handleLogin}>
                <div className="ss-form-group">
                  <label>👤 Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="ss-form-group">
                  <label>🔒 Password</label>
                  <div className="ss-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ss-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="ss-btn ss-btn-primary"
                  disabled={authLoading}
                >
                  {authLoading ? "⏳ Logging in..." : "🔑 Login"}
                </button>
              </form>
            )}

            {/* Register Form */}
            {authMode === "register" && (
              <form onSubmit={handleRegister}>
                <div className="ss-form-group">
                  <label>👤 Username</label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="ss-form-group">
                  <label>🔒 Password</label>
                  <div className="ss-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Choose a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ss-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <div className="ss-form-group">
                  <label>🔒 Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && (
                    <span className={`ss-match ${password === confirmPassword ? "ok" : "err"}`}>
                      {password === confirmPassword ? "✅ Match" : "❌ No match"}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="ss-btn ss-btn-primary"
                  disabled={authLoading}
                >
                  {authLoading ? "⏳ Registering..." : "🚀 Register"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RENDER: Logged in → show settings form
  // ══════════════════════════════════════════
  return (
    <div className="ss-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ss-modal">

        {/* Header */}
        <div className="ss-header">
          <h2>⚙️ Site Settings</h2>
          <div className="ss-header-actions">
            {lastSaved && (
              <span className="ss-saved">💾 Saved at {lastSaved}</span>
            )}
            <button className="ss-btn ss-btn-logout" onClick={handleLogout}>
              🚪 Logout
            </button>
            <button className="ss-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Settings Form */}
        {loading ? (
          <div className="ss-loading">
            <div className="ss-spinner" />
            <p>Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="ss-form">

            <div className="ss-section-label">🧭 Navigation</div>
            <div className="ss-form-group">
              <label>Nav Logo / Brand Name</label>
              <input
                type="text"
                name="navLogo"
                placeholder="e.g. 🎟️ Lucky Lottery"
                value={settings.navLogo}
                onChange={handleChange}
              />
              <span className="ss-hint">Shown in the top-left navbar</span>
            </div>

            <div className="ss-section-label">🦸 Hero Section</div>
            <div className="ss-form-group">
              <label>Hero Title</label>
              <input
                type="text"
                name="heroTitle"
                placeholder="e.g. Win Big with Lucky Lottery!"
                value={settings.heroTitle}
                onChange={handleChange}
              />
            </div>
            <div className="ss-form-group">
              <label>Hero Subtitle</label>
              <textarea
                name="heroSub"
                placeholder="e.g. Buy tickets, match numbers, win crypto instantly."
                value={settings.heroSub}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="ss-section-label">🦶 Footer</div>
            <div className="ss-form-group">
              <label>Footer Text</label>
              <input
                type="text"
                name="footerText"
                placeholder="e.g. © 2025 Lucky Chain Lottery"
                value={settings.footerText}
                onChange={handleChange}
              />
            </div>

            {/* Preview */}
            <div className="ss-preview">
              <div className="ss-preview-label">📋 Live Preview</div>
              <div className="ss-preview-grid">
                <div className="ss-preview-item">
                  <span>Nav</span>
                  <strong>{settings.navLogo || "—"}</strong>
                </div>
                <div className="ss-preview-item">
                  <span>Title</span>
                  <strong>{settings.heroTitle || "—"}</strong>
                </div>
                <div className="ss-preview-item">
                  <span>Footer</span>
                  <strong>{settings.footerText || "—"}</strong>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="ss-actions">
              <button
                type="button"
                className="ss-btn ss-btn-reset"
                onClick={() => setSettings({ navLogo: "", heroTitle: "", heroSub: "", footerText: "" })}
              >
                🔄 Reset
              </button>
              <button
                id="save-btn"
                type="submit"
                className="ss-btn ss-btn-save"
                disabled={saving}
              >
                {saving ? "⏳ Saving..." : "💾 Save Settings"}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}