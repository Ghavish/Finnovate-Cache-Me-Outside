// --- src/components/auth/Signup.jsx ---
import { useState } from "react";
import { Eye, EyeOff, Target } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { signUp, authMessage } from "../../firebase/authService";
import { callN8n } from "../../firebase/apiClient";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salary, setSalary] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signUp(email.trim(), password);
    } catch (err) {
      setError(authMessage(err.code));
      setSubmitting(false);
      return;
    }

    // The account exists now, so a failed profile call must not block the user.
    try {
      // Create the profile row. A blank salary stays empty, so the app asks for a payslip later.
      await callN8n({
        inputType: "profile",
        ...(salary ? { salaryCents: Math.round(Number(salary) * 100) } : {}),
      });
    } catch (err) {
      console.error("Profile creation failed:", err);
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="login-page">
      <section className="login-panel login-brand-panel">
        <div className="login-logo">GOALPATH <span>AI</span></div>
        <div>
          <div className="login-icon"><Target size={30} /></div>
          <h1>Plan your goals.<br />Understand your money.</h1>
          <p>Build a clearer path toward the financial goals that matter to you.</p>
        </div>
        <small>Your financial journey starts here.</small>
      </section>

      <section className="login-panel login-form-panel">
        <form onSubmit={handleSubmit}>
          <span className="eyebrow">GET STARTED</span>
          <h2>Create your account</h2>
          <p>Sign up to start planning your goals.</p>

          <label>Email address
            <input type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label>Password
            <div className="password-input">
              <input type={show ? "text" : "password"} autoComplete="new-password" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label="Show or hide password">
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>

          <label>Monthly salary (Rs, optional)
            <input type="number" min="0" inputMode="numeric"
              value={salary} onChange={(e) => setSalary(e.target.value)} />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>

          <p className="auth-switch">Have an account? <Link to="/login">Log in</Link></p>
        </form>
      </section>
    </main>
  );
}
