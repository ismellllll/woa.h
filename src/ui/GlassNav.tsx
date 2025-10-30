import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { X as CloseIcon, Menu } from "lucide-react";

type Props = { onLogoClick?: () => void };

/* --- Inline brand icons (no package issues) --- */
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
    </svg>
  );
}
function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  // full Discord logo path
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 8.27 8.27 0 0 0-.608 1.249 18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.249.077.077 0 0 0-.079-.037 19.65 19.65 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C2.23 7.23 1.71 9.988 1.88 12.708a.082.082 0 0 0 .03.057 19.9 19.9 0 0 0 5.993 3.056.077.077 0 0 0 .084-.027c.461-.63.873-1.295 1.226-1.993a.076.076 0 0 0-.041-.105c-.652-.247-1.274-.549-1.872-.892a.077.077 0 0 1-.007-.128c.125-.094.25-.19.368-.288a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.243.194.368.288a.077.077 0 0 1-.006.128c-.598.35-1.22.652-1.873.898a.076.076 0 0 0-.04.106c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.876 19.876 0 0 0 5.994-3.056.077.077 0 0 0 .03-.057c.2-3.26-.34-6.005-1.607-8.312a.061.061 0 0 0-.031-.028ZM8.02 13.885c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.094 2.157 2.419 0 1.334-.955 2.419-2.157 2.419Zm7.974 0c-1.184 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.094 2.157 2.419 0 1.334-.947 2.419-2.157 2.419Z"
      />
    </svg>
  );
}

export default function GlassNav({ onLogoClick }: Props) {
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  // lock body scroll for mobile menu
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open]);

  // ---------- Liquid cursor glow (global, edge-only via CSS mask) ----------
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, { stiffness: 220, damping: 26, mass: 0.3 });
  const my = useSpring(myRaw, { stiffness: 220, damping: 26, mass: 0.3 });
  const glow = useTransform([mx, my], ([x, y]) =>
    `radial-gradient(160px 160px at ${x}px ${y}px,
      rgba(255,255,255,0.22),
      rgba(255,255,255,0.10) 35%,
      rgba(255,255,255,0.00) 70%)`
  );

  useEffect(() => {
    let rect = shellRef.current?.getBoundingClientRect();
    const updateRect = () => { rect = shellRef.current?.getBoundingClientRect(); };
    const ro = new ResizeObserver(updateRect);
    if (shellRef.current) ro.observe(shellRef.current);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    const onMove = (e: MouseEvent) => {
      if (!rect) return;
      mxRaw.set(e.clientX - rect.left);
      myRaw.set(e.clientY - rect.top);
    };
    window.addEventListener("mousemove", onMove);

    if (rect) {
      mxRaw.set(rect.width / 2);
      myRaw.set(rect.height / 2);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      ro.disconnect();
    };
  }, [mxRaw, myRaw]);

  // ---------- Premium unconnected lightbar (exact edge, one-time run) ----------
  const rectRef = useRef<SVGRectElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [len, setLen] = useState(1000);
  const [runSweep, setRunSweep] = useState(true);

  useEffect(() => {
    const update = () => {
      const el = shellRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
      requestAnimationFrame(() => {
        try {
          const l = rectRef.current?.getTotalLength?.() ?? 1000;
          setLen(l);
        } catch {}
      });
    };
    update();
    const ro = new ResizeObserver(update);
    if (shellRef.current) ro.observe(shellRef.current);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  const segment = Math.max(120, Math.round(len * 0.22));
  const gap = Math.max(80, len - segment);
  const dashArray = `${segment} ${gap}`;
  const keyframes = [0, -len * 0.15, -len];
  const times = [0, 0.45, 1];
  const duration = 2.4;

  const NavLinks = () => (
    <>
      <a href="#features" className="hover:text-white transition">Features</a>
      <a href="#support" className="hover:text-white transition">Support</a>
      <a href="#whats-coming" className="hover:text-white transition">What’s coming</a>
      <Link to="/questions" className="hover:text-white transition">Questions</Link>
      <Link to="/changes" className="hover:text-white transition">Updates</Link>
    </>
  );

  const RADIUS = 16;
  const STROKE = 2;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.05 }}
      className="sticky top-3 z-50 mx-auto max-w-6xl px-4"
    >
      <div
        ref={shellRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl px-4 py-3 flex items-center justify-between"
      >
        {/* edge-only mouse glow */}
        <motion.div
          aria-hidden
          className="pointer-events-none hidden md:block absolute inset-0 rounded-2xl grj-edge-mask"
          style={{
            backgroundImage: glow,
            mixBlendMode: "screen",
            filter: "drop-shadow(0 0 12px rgba(255,255,255,0.35)) drop-shadow(0 0 26px rgba(180,200,255,0.22))",
          }}
        />

        {/* one-time unconnected lightbar */}
        {runSweep && size.w > 0 && size.h > 0 && (
          <svg className="pointer-events-none absolute top-0 left-0" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden>
            <defs>
              <linearGradient id="grjSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
                <stop offset="25%"  stopColor="rgba(222,236,255,0.95)" />
                <stop offset="50%"  stopColor="rgba(218,255,241,0.95)" />
                <stop offset="75%"  stopColor="rgba(236,224,255,0.95)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.95)" />
              </linearGradient>
              <filter id="grjGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="b" />
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <motion.rect
              ref={rectRef}
              x={STROKE / 2}
              y={STROKE / 2}
              width={size.w - STROKE}
              height={size.h - STROKE}
              rx={Math.max(0, RADIUS - STROKE / 2)}
              ry={Math.max(0, RADIUS - STROKE / 2)}
              fill="transparent"
              stroke="url(#grjSweep)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ strokeDasharray: dashArray }}
              animate={{ strokeDashoffset: keyframes, opacity: [1, 1, 1, 0.0] }}
              transition={{ duration, times, ease: "easeInOut" }}
              onAnimationComplete={() => setRunSweep(false)}
              filter="url(#grjGlow)"
            />
          </svg>
        )}

        {/* Brand */}
        <button onClick={onLogoClick} className="flex items-center gap-2 select-none" aria-label="Creator unlock">
          <div className="h-8 w-8 grid place-items-center rounded-xl bg-white text-black font-black">GRJ</div>
          <span className="font-semibold tracking-wide">GhostriderJunior</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <NavLinks />
        </nav>

        {/* Right side (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Keep the big Join Discord button */}
          <a
            href="/join"
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition"
          >
            Join Discord
          </a>
          {/* Socials */}
          <a
            href="https://instagram.com/ghostriderjunior"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href="https://discord.com/users/817485401975554118"
            target="_blank"
            rel="noreferrer"
            aria-label="Discord"
            className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
          >
            <DiscordIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile menu sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              onClick={() => setOpen(false)}
              aria-label="Close menu overlay"
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog" aria-modal="true"
              className="fixed inset-x-4 top-4 z-50 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl overflow-hidden md:hidden"
              initial={{ y: -12, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -8, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 grid place-items-center rounded-xl bg-white text-black font-black">GRJ</div>
                  <span className="font-semibold tracking-wide">Menu</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <nav className="px-3 py-2 text-sm text-white/90">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Support", href: "#support" },
                  { label: "What’s coming", href: "#whats-coming" },
                  { label: "Questions", to: "/questions" },
                  { label: "Updates", to: "/changes" },
                ].map((l, i) =>
                  l.href ? (
                    <motion.a
                      key={l.label}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-3 hover:bg-white/10"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}
                    >
                      {l.label}
                    </motion.a>
                  ) : (
                    <motion.div
                      key={l.label}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}
                    >
                      <Link to={l.to!} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 hover:bg-white/10">
                        {l.label}
                      </Link>
                    </motion.div>
                  )
                )}
              </nav>

              {/* Keep the big Join Discord button on mobile too */}
              <div className="border-t border-white/10 px-3 py-3">
                <a
                  href="/join"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-white text-black text-center font-semibold py-3"
                >
                  Join Discord
                </a>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <a
                    aria-label="Instagram"
                    href="https://instagram.com/ghostriderjunior"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                  <a
                    aria-label="Discord"
                    href="https://discord.com/users/817485401975554118"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
                  >
                    <DiscordIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
