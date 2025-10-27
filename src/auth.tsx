import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  OAuthProvider,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

type AuthValue = {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signInWithDiscord = async () => {
    const auth = getAuth();
    const provider = new OAuthProvider("oidc.discord");
    provider.addScope("identify");
    provider.addScope("email");
    await signInWithPopup(auth, provider);
  };

  const signOutFn = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, signInWithDiscord, signOut: signOutFn }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuthUser() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuthUser must be used within <AuthProvider>");
  return v;
}

export function AuthGateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { signInWithDiscord, loading } = useAuthUser();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60">
      <div className="rounded-2xl bg-zinc-900/90 border border-white/10 p-6 w-[360px]">
        <h3 className="text-lg font-semibold">Sign in</h3>
        <p className="text-sm text-white/70 mt-2">Continue with Discord to comment.</p>
        <div className="mt-4 flex gap-2">
          <button
            className="px-4 py-2 rounded-xl bg-white text-black"
            onClick={async () => {
              await signInWithDiscord();
              onClose();
            }}
            disabled={loading}
          >
            Continue with Discord
          </button>
          <button className="px-4 py-2 rounded-xl bg-white/10" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
