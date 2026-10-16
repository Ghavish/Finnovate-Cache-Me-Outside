/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config.js";
import { clearReadCache } from "../firebase/apiClient.js";
import { LogoMark } from "../components/layout/Logo.jsx";

// 1. Create the context
const AuthContext = createContext();

// 2. Create the Provider wrapper
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  // The loading state is crucial. It prevents the app from rendering
  // before Firebase finishes checking the browser's hidden storage.
  const [loading, setLoading] = useState(true);

  // Firebase changes the user object in place when the profile is updated,
  // so bumping this number is what makes screens show the new name.
  const [profileVersion, setProfileVersion] = useState(0);
  const refreshUser = useCallback(() => setProfileVersion((version) => version + 1), []);

  useEffect(() => {
    // onAuthStateChanged is a real-time listener. It fires automatically
    // when a user logs in, logs out, or refreshes the page.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearReadCache(); // never show one account's numbers to the next
      setUser(currentUser);
      setLoading(false); // Firebase has made its decision, safe to render
    });

    // Cleanup the listener when the app unmounts
    return () => unsubscribe();
  }, []);

  // Show the logo while Firebase checks the saved login, instead of a blank page.
  // If we don't wait, ProtectedRoute will instantly kick valid users to /login on refresh.
  if (loading) {
    return <div className="app-splash" role="status" aria-label="MoBudget"><LogoMark size={56} /></div>;
  }

  return (
    <AuthContext.Provider value={{ user, refreshUser, profileVersion }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Export the custom hook for your components
export function useAuth() {
  return useContext(AuthContext);
}
