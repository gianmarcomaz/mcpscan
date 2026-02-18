import { useState, useEffect } from "react";
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, githubProvider, db } from "../firebase";

/**
 * Custom hook for Firebase auth state.
 * Returns { user, loading, signIn, signOut }.
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsub;
    }, []);

    const signIn = async () => {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            const u = result.user;

            // Create or update user doc on first login
            const userRef = doc(db, "users", u.uid);
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
                await setDoc(userRef, {
                    email: u.email || "",
                    githubUsername: u.reloadUserInfo?.screenName || u.displayName || "",
                    avatarUrl: u.photoURL || "",
                    createdAt: new Date(),
                });
            }
            return u;
        } catch (err) {
            console.error("GitHub sign-in failed:", err);
            throw err;
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    return { user, loading, signIn, signOut };
}
