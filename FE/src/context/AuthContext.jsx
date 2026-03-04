import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { authService } from "../services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSeq = useRef(0);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    // Don't call protected endpoint if we clearly aren't logged in.
    if (!token) {
      setUser(null);
      return null;
    }

    const seq = ++refreshSeq.current;
    try {
      const me = await authService.getMe();
      if (seq === refreshSeq.current) {
        setUser(me?.user ?? me ?? null);
      }
      return me;
    } catch {
      if (seq === refreshSeq.current) {
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  const login = useCallback(
    async (credentials) => {
      const result = await authService.login(credentials);

      if (result?.token) {
        localStorage.setItem("token", result.token);
      }
      // Keep compatibility with existing UI (Navbar/Profile) reading localStorage.user
      localStorage.setItem("user", JSON.stringify(result ?? null));
      window.dispatchEvent(new Event("auth:changed"));

      // Set a quick user snapshot immediately, then refresh full profile.
      if (result && typeof result === "object") {
        const { token: _token, ...rest } = result;
        setUser(rest);
      }

      await refreshMe();
      return result;
    },
    [refreshMe],
  );

  const loginWithGoogle = useCallback(
    async ({ credential }) => {
      const result = await authService.loginWithGoogle({ credential });

      if (result?.token) {
        localStorage.setItem("token", result.token);
      }
      localStorage.setItem("user", JSON.stringify(result ?? null));
      window.dispatchEvent(new Event("auth:changed"));

      if (result && typeof result === "object") {
        const { token: _token, ...rest } = result;
        setUser(rest);
      }

      await refreshMe();
      return result;
    },
    [refreshMe],
  );

  const logout = useCallback(async () => {
    const result = await authService.logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:changed"));
    setUser(null);
    return result;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      loginWithGoogle,
      logout,
      refreshMe,
      setUser,
    }),
    [user, loading, login, loginWithGoogle, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
