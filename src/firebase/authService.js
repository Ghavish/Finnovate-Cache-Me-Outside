// --- Auth Actions ---
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

import { auth } from "./config";

// --- Sign Up ---
export function signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

// --- Log In ---
export function logIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

// --- Log Out ---
export function logOut() {
    return signOut(auth);
}

// --- Get the current user's ID token (attach to n8n calls) ---
export async function getIdToken() {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
}