import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827] via-[#0a0a0a] to-black overflow-hidden">
      {/* Ambient orbs to match site */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5, x: [0, 20, -10, 0], y: [0, -10, 20, 0] }}
          transition={{ repeat: Infinity, duration: 16 }}
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-indigo-500/30"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5, x: [0, -10, 15, 0], y: [0, 15, -10, 0] }}
          transition={{ repeat: Infinity, duration: 18 }}
          className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full blur-3xl bg-fuchsia-500/20"
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
          className="mx-auto max-w-md text-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8"
        >
          <div className="text-6xl font-black tracking-tight">404</div>
          <p className="mt-2 text-white/70">Page not found</p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-6 text-sm text-white/60"
          >
            The link you followed might be broken, or the page may have been moved.
          </motion.div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white text-black px-5 py-3 text-sm font-semibold shadow-sm hover:bg-white/90 transition"
            >
              ← Go back home
            </Link>
            <Link
              to="/updates"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20"
            >
              See latest updates
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
