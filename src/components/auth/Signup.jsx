import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "../../firebase/authService";

function GoalPathMark() {
  return (
    <div className="relative h-9 w-9 shrink-0" aria-hidden="true">
      {/* Same GoalPath mark as Login so both auth screens stay visually consistent. */}
      {[
        "left-1 top-4",
        "left-4 top-1",
        "left-4 top-4",
        "left-4 top-7",
        "left-7 top-4",
      ].map((position) => (
        <span
          key={position}
          className={`absolute h-2 w-2 rounded-full bg-[#5320A9] ${position}`}
        />
      ))}
    </div>
  );
}

function EyeIcon({ hidden }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {hidden ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.3A10.7 10.7 0 0 0 3 12c1.8 3.4 5 6 9 6 1.4 0 2.7-.3 3.9-.8" />
          <path d="M14.1 4.3c3.1 1.1 5.5 3.2 7 7.7a12.8 12.8 0 0 1-2.2 3.5" />
        </>
      ) : (
        <>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (loading) return;
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter an email and password.");
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Firebase already detects duplicate accounts; no custom database check is needed.
      if (err?.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else {
        setError("Account creation failed. Please check your details and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5FA] px-4 py-8 text-[#0B1739]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        {/* Same auth card treatment as Login. */}
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-center gap-2">
            <GoalPathMark />
            <div className="leading-none">
              <div className="text-sm font-black tracking-wide">GOALPATH</div>
              <div className="text-[10px] font-bold text-[#5320A9]">AI</div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5320A9]">
              Get started
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#0B1739]">
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create your GoalPath account to start building your financial picture.
            </p>
          </div>

          {/* Inline error box for duplicate-email and other Firebase failures. */}
          {error && (
            <div
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="signup-email" className="mb-2 block text-sm font-bold">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#5320A9] focus:ring-2 focus:ring-[#5320A9]/20"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-2 block text-sm font-bold">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#5320A9] focus:ring-2 focus:ring-[#5320A9]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#5320A9]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </div>
            </div>

            {/* Primary action; disabled while Firebase is creating the account. */}
            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              aria-disabled={loading}
              className={`w-full rounded-xl px-5 py-3.5 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[#A9A0FF] focus:ring-offset-2 ${
                loading
                  ? "cursor-not-allowed bg-slate-300 text-slate-500"
                  : "bg-[#5320A9] text-white hover:bg-[#411E8D]"
              }`}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#5320A9] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}