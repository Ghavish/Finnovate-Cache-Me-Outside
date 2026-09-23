// --- src/components/auth/Login.jsx ---
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logIn } from "../../firebase/authService";

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
            setError("Login failed. Check your email and password.");
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
        </div>
    );
}
