import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Twitter, Github, X as CloseIcon, Menu } from "lucide-react";

type Props = { onLogoClick?: () => void };

export default function GlassNav({ onLogoClick }: Props) {
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  // lock body scroll for mobile menu
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  // ---------- Liquid cursor glow (global) ----------
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, { stiffness: 220, damping: 26, mass: 0.3 });
  const my = useSpring(myRaw, { stiffness: 220, damping: 26, mass: 0.3 });
  const glow = useTransform(
    [mx, my],
    ([x, y]) =>
      `radial-gradient(160px 160px at ${x}px ${y}px,
      rgba(255,255,255,0.22),
      rgba(255,255,255,0.10) 35%,
      rgba(255,255,255,0.00) 70%)`,
  );

  useEffect(() => {
    let rect = shellRef.current?.getBoundingClientRect();
    const updateRect = () => {
      rect = shellRef.current?.getBoundingClientRect();
    };
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
  const svgRef = useRef<SVGSVGElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [len, setLen] = useState(1000);
  const [runSweep, setRunSweep] = useState(true); // run once on load

  // keep SVG in pixel space matching the shell for perfect edge alignment
  useEffect(() => {
    const update = () => {
      const el = shellRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
      // measure path length after next frame
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
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // dash/gap → unconnected bar
  const segment = Math.max(120, Math.round(len * 0.22)); // lit length
  const gap = Math.max(80, len - segment); // gap (always unconnected)
  const dashArray = `${segment} ${gap}`;

  // one-shot animation: slow first 15%, then very fast to end
  // times define the percentage of the total duration spent to reach each keyframe
  const keyframes = [0, -len * 0.15, -len];
  const times = [0, 0.45, 1]; // 45% time to cover 15% distance → feels like it speeds up a lot
  const duration = 2.4;

  const NavLinks = () => (
    <>
      <a href="#features" className="hover:text-white transition">
        Features
      </a>
      <a href="#support" className="hover:text-white transition">
        Support
      </a>
      <a href="#whats-coming" className="hover:text-white transition">
        What’s coming
      </a>
      <Link to="/questions" className="hover:text-white transition">
        Questions
      </Link>
      <Link to="/changes" className="hover:text-white transition">
        Updates
      </Link>
    </>
  );

  // visual constants to match your Tailwind rounded-2xl (≈ 16px)
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
        {/* edge glow that follows cursor (EDGE-ONLY via ring mask) */}
        <motion.div
          aria-hidden
          className="pointer-events-none hidden md:block absolute inset-0 rounded-2xl grj-edge-mask" // ← add grj-edge-mask
          style={{
            backgroundImage: glow, // your radial-gradient
            mixBlendMode: "screen",
            filter:
              "drop-shadow(0 0 12px rgba(255,255,255,0.35)) drop-shadow(0 0 26px rgba(180,200,255,0.22))",
            willChange: "transform, opacity",
          }}
        />

        {/* one-time unconnected lightbar that perfectly hugs the edge */}
        {runSweep && size.w > 0 && size.h > 0 && (
          <svg
            ref={svgRef}
            className="pointer-events-none absolute top-0 left-0"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            aria-hidden
          >
            <defs>
              {/* subtle, premium spectrum – mostly white with a hint of pastel */}
              <linearGradient id="grjSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="25%" stopColor="rgba(222,236,255,0.95)" />
                <stop offset="50%" stopColor="rgba(218,255,241,0.95)" />
                <stop offset="75%" stopColor="rgba(236,224,255,0.95)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.95)" />
              </linearGradient>
              <filter id="grjGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
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
              transition={{
                duration,
                times,
                ease: "easeInOut",
              }}
              onAnimationComplete={() => setRunSweep(false)}
              filter="url(#grjGlow)"
            />
          </svg>
        )}

        {/* Brand */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 select-none"
          aria-label="Creator unlock"
        >
          <div className="h-8 w-8 grid place-items-center rounded-xl bg-white text-black font-black">
            GRJ
          </div>
          <span className="font-semibold tracking-wide">GhostriderJunior</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <NavLinks />
        </nav>

        {/* Right side (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <a
            href="/join"
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition"
          >
            Join Discord
          </a>
          <a
            aria-label="Twitter"
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <a
            aria-label="GitHub"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
          >
            <Github className="h-4 w-4" />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-4 top-4 z-50 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl overflow-hidden md:hidden"
              initial={{ y: -12, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -8, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 grid place-items-center rounded-xl bg-white text-black font-black">
                    GRJ
                  </div>
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
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.02 * i }}
                    >
                      {l.label}
                    </motion.a>
                  ) : (
                    <motion.div
                      key={l.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.02 * i }}
                    >
                      <Link
                        to={l.to!}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl px-3 py-3 hover:bg-white/10"
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  ),
                )}
              </nav>

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
                    aria-label="Twitter"
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a
                    aria-label="GitHub"
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 bg-white/10 p-2 hover:bg-white/20"
                  >
                    <Github className="h-4 w-4" />
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
