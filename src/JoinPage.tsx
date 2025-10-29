import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageCircleHeart, Users, Shield, Sparkles, ArrowRight } from "lucide-react";

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ type: "spring", stiffness: 160, damping: 18 }}
    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
  >
    <div className="flex items-center gap-2 text-white/80">
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </div>
    <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
  </motion.div>
);

export default function JoinPage() {
  const invite = "https://discord.com/invite/ghostrider";

  return (
    <div className="relative min-h-screen text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827] via-[#0a0a0a] to-black overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45, x: [0, 14, -10, 0], y: [0, -8, 16, 0] }}
          transition={{ repeat: Infinity, duration: 18 }}
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-indigo-500/25"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35, x: [0, -10, 18, 0], y: [0, 18, -12, 0] }}
          transition={{ repeat: Infinity, duration: 22 }}
          className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl bg-fuchsia-500/20"
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="h-9 w-9 grid place-items-center rounded-xl bg-white text-black font-black"
            >
              GRJ
            </motion.div>
            <span className="font-semibold tracking-wide text-white/90">GhostriderJunior</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <Link to="/" className="hover:text-white">Home</Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-16">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="text-4xl md:text-6xl font-black leading-tight"
          >
            Join the{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
              GhostriderJunior
            </span>{" "}
            Discord
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-white/70 max-w-2xl"
          >
            Hang out with the community, get any help you need.
          </motion.p>

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            className="mt-10 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6"
          >
            <div className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70">
                  <Sparkles className="h-3.5 w-3.5" />
                  Experience the best motorcycle server
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">Be part of the build</h2>
                <p className="mt-2 text-sm text-white/70">
                  Friendly community, bikes and cars. What else would you want us to do to join?
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <motion.a
                    href={invite}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white text-black font-semibold px-5 py-3 shadow-sm hover:bg-white/90"
                  >
                    Join the server
                    <ArrowRight className="h-4 w-4" />
                  </motion.a>

                  <a
                    href={invite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-white/70 hover:text-white underline/30"
                  >
                    discord.com/invite/ghostrider
                  </a>
                </div>
              </div>

              {/* Side card with stats / trust */}
              <div className="grid gap-3">
                <Stat icon={Users} label="Community" value="Growing daily" />
                <Stat icon={MessageCircleHeart} label="Channels" value="off topic • motorcycle channels • car channels" />
                <Stat icon={Shield} label="Moderation" value="Friendly & safe" />
              </div>
            </div>
          </motion.div>

          {/* Feature bullets */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Active",
                text: "We ask you to join to make it even more active.",
              },
              {
                icon: MessageCircleHeart,
                title: "Motorcycle community",
                text: "Find people to ride with, get help to fix your motorcycle, anything you want you will find here.",
              },
              {
                icon: Shield,
                title: "No drama",
                text: "Clear rules, active mod team, and good vibes only.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 180, damping: 18 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <f.icon className="h-5 w-5" />
                  <h3 className="font-semibold">{f.title}</h3>
                </div>
                <p className="mt-2 text-sm text-white/70">{f.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Secondary CTA */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ type: "spring", stiffness: 160, damping: 20 }}
              className="mt-12"
            >
              <motion.a
                href={invite}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20"
              >
                Hop in now
                <ArrowRight className="h-4 w-4" />
              </motion.a>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Footer */}
        <footer className="mt-24 border-t border-white/10 pt-8 text-xs text-white/60">
          <p>© {new Date().getFullYear()} GhostriderJunior. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
