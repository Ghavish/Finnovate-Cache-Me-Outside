// --- src/components/auth/Signup.jsx ---
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp, authMessage } from "../../firebase/authService";
import { callN8n } from "../../firebase/apiClient";
 
export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salary, setSalary] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
 
  const handleSubmit = async () => {
    setError("");
    try {
      await signUp(email, password);
      // create the users profile row (salary optional, editable later)
      await callN8n({
        inputType: "createProfile",
        salary: salary ? Number(salary) * 100 : 0,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(authMessage(err.code));
    }
  };
 
  return (
    <div className="auth-card">
      <h2>Sign up</h2>
      {error && <p className="auth-error">{error}</p>}
      <input type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="number" placeholder="Monthly salary (Rs, optional)"
        value={salary} onChange={(e) => setSalary(e.target.value)} />
      <button onClick={handleSubmit}>Create account</button>
      <p>Have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
