import React, { createContext, useContext, useEffect, useState} from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../firebase/config";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  loginAsGuest: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  loginAsGuest: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginAsGuest = () => {
    setIsGuest(true);
  };

  const logout = async () => {
    setIsGuest(false);
    if (user) {
      await signOut(auth);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isGuest, loginAsGuest, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);