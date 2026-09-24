/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config.js";

// 1. Create the context
const AuthContext = createContext();

// 2. Create the Provider wrapper
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  // The loading state is crucial. It prevents the app from rendering
  // before Firebase finishes checking the browser's hidden storage.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is a real-time listener. It fires automatically
    // when a user logs in, logs out, or refreshes the page.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Firebase has made its decision, safe to render
    });

    // Cleanup the listener when the app unmounts
    return () => unsubscribe();
  }, []);

  // Show a blank screen (or a spinner) while Firebase thinks. 
  // If we don't do this, ProtectedRoute will instantly kick valid users to /login on refresh.
  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Export the custom hook for your components
export function useAuth() {
  return useContext(AuthContext);
}