// --- Auth Actions ---
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./config";
import { k } from "../i18n/strings.js";
 
export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
 
export function logIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
 
export function logOut() {
  return signOut(auth);
}
 
// Attach this token to every n8n call
export async function getIdToken() {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

// --- Turn Firebase error codes into readable text ---
export function authMessage(code) {
  const map = {
    "auth/email-already-in-use": k("That email is already registered."),
    "auth/invalid-email": k("That email address looks wrong."),
    "auth/weak-password": k("Password should be at least 6 characters."),
    "auth/invalid-credential": k("Wrong email or password."),
    "auth/user-not-found": k("No account with that email."),
  };
  return map[code] || k("Something went wrong. Try again.");
}
