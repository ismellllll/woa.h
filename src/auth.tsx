// auth.tsx
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
  hideCancel = false,
}: {
  open: boolean;
  onClose: () => void;
  hideCancel?: boolean;
}) {
  const { signInWithDiscord, loading } = useAuthUser();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop — no onClick so only the X closes */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-5">
          {/* top-right X only */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <h3 className="text-lg font-semibold">Sign in with Discord</h3>
          <p className="mt-2 text-sm text-white/70">
            Connect to comment and join the conversation.
          </p>

          <div className="mt-4">
            <button
              disabled={loading}
              onClick={async () => {
                try {
                  await signInWithDiscord();
                  onClose();
                } catch (e) {
                  console.error("Discord sign-in failed:", e);
                }
              }}
              className="w-full rounded-xl bg-white text-black px-4 py-3 font-semibold disabled:opacity-60"
            >
              Continue with Discord
            </button>
          </div>

          {/* Hide any footer cancel entirely when hideCancel is true */}
          {!hideCancel && null}
        </div>
      </div>
    </div>
  );
}
