import { useState, useEffect, createContext, useContext } from "react";
import { localAuth } from "@/lib/localAuth";

interface AuthUser {
  id: string;
  email: string;
  nama: string;
  role: 'admin' | 'guru';
}

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const currentSession = localAuth.getSession();
    setUser(currentSession.user);
    setSession(currentSession.session);
    setLoading(false);
  }, []);

  const signOut = async () => {
    localAuth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}