import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext({
  user: null,
  authLoading: true,
  authUiReady: false,
});

function mapAuthUser(firebaseUser, displayNameOverride) {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: displayNameOverride ?? firebaseUser.displayName ?? "",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const syncAuthUser = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUser(null);
      setAuthLoading(false);
      return;
    }
    setUser(mapAuthUser(currentUser));
    setAuthLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapAuthUser(firebaseUser) : null);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const authUiReady = !authLoading;

  const value = useMemo(
    () => ({ user, authLoading, authUiReady, syncAuthUser }),
    [user, authLoading, authUiReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
