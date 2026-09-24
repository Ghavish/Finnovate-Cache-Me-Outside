// --- src/components/auth/Login.jsx ---
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logIn, authMessage } from "../../firebase/authService";
 
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
 
  const handleSubmit = async () => {
    setError("");
    try {
      await logIn(email, password);
      navigate("/dashboard");
    } catch (err) {
        console.error("FIREBASE ERROR:", err.code, err.message);
        console.log("My API Key is:", import.meta.env.VITE_FIREBASE_API_KEY);
        setError(authMessage(err.code));
    }
  };
 
  return (
    <div className="auth-card">
      <h2>Log in</h2>
      {error && <p className="auth-error">{error}</p>}
      <input type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleSubmit}>Log in</button>
      <p>No account? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}
