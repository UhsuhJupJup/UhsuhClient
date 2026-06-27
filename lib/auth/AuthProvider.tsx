"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  loginWithGithub: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
  }, []);

  const loginWithGithub = useCallback(async () => {
    if (auth) await signInWithPopup(auth, new GithubAuthProvider());
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (auth) await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
  }, []);

  const getIdToken = useCallback(async () => {
    return user ? user.getIdToken() : null;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: isFirebaseConfigured,
        loginWithGithub,
        loginWithGoogle,
        logout,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
