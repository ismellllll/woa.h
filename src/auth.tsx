import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth, discordProvider } from "./firebase";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function useAuthUser() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  useEffect(() => {
    const off = onAuthStateChanged(auth, setUser);
    return () => off();
  }, []);
  return user;
}

export function AuthGateModal(props: {
  open: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
}) {
  const { open, onClose, onSignedIn } = props;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  const login = async () => {
    setBusy(true);
    setErr("");
    try {
      await signInWithPopup(auth, discordProvider);
      onSignedIn?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Failed to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="absolute inset-0 grid place-items-center p-4">
            <motion.div
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/95 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sign in to comment</h3>
                <button
                  onClick={onClose}
                  className="h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-2 text-sm text-white/70">
                We’ll use your Discord username & avatar on your comment.
              </p>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                disabled={busy}
                onClick={login}
                className="mt-5 w-full rounded-2xl bg-white text-black font-semibold px-5 py-3 disabled:opacity-60"
              >
                {busy ? "Connecting to Discord…" : "Continue with Discord"}
              </motion.button>

              {err && (
                <div className="mt-3 text-xs text-red-300">
                  {err}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
