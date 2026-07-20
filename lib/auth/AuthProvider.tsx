"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const memberSyncs = new Map<string, Promise<void>>();

async function postLogin(firebaseUser: User): Promise<void> {
  const token = await firebaseUser.getIdToken();
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`auth login sync failed (${response.status})`);
  }
}

function ensureMemberSynced(firebaseUser: User): Promise<void> {
  const cached = memberSyncs.get(firebaseUser.uid);
  if (cached) return cached;
  const promise = postLogin(firebaseUser).catch((error) => {
    console.error(error);
    memberSyncs.delete(firebaseUser.uid);
  });
  memberSyncs.set(firebaseUser.uid, promise);
  return promise;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loginInProgress = useRef(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        memberSyncs.clear();
      }
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!auth || loginInProgress.current) return;
    loginInProgress.current = true;
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureMemberSynced(result.user);
    } finally {
      loginInProgress.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    memberSyncs.clear();
    if (auth) await signOut(auth);
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    await ensureMemberSynced(user);
    return user.getIdToken();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: isFirebaseConfigured,
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
