import React, { createContext, useContext, useEffect, useState} from "react";
import { onAuthStateChanged, User, signOut, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase/config";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  loginAsGuest: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginAsGuest: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.log("Guest login failed:", error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.log("Logout error:", error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginAsGuest, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);