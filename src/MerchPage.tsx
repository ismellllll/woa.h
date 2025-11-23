import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shirt,
  Sparkles,
  ShoppingBag,
  Shield,
  Truck,
  ArrowLeft,
  Lock,
  X,
} from "lucide-react";
import GlassNav from "./ui/GlassNav";
import HoodieViewer3D from "./HoodieViewer3D";

type MerchItem = {
  id: string;
  name: string;
  tag: string;
  price: string;
  status: "coming-soon" | "live";
  description: string;
  colors: string[];
};

const merchItems: MerchItem[] = [
  {
    id: "og-hoodie",
    name: "GhostriderJunior clean hoodie",
    tag: "Drop 01 • Core",
    price: "$54",
    status: "coming-soon",
    description:
      "Heavyweight fleece hoodie with a subtle chest print and big back hit. Built to last.",
    colors: ["Midnight Black", "Storm Grey"],
  },
  {
    id: "signal-hoodie",
    name: "Signal Glow Hoodie",
    tag: "Drop 01 • Limited",
    price: "$64",
    status: "coming-soon",
    description:
      "Gradient ‘signal’ print inspired by the GhostriderJunior glow. Soft but structured.",
    colors: ["Obsidian", "Night Sky"],
  },
  {
    id: "badge-tee",
    name: "Badge Tee",
    tag: "Essentials",
    price: "$32",
    status: "coming-soon",
    description:
      "Everyday tee with a minimal front badge. Clean enough for IRL, comfy enough for the setup.",
    colors: ["Washed Black", "Bone"],
  },
];

export default function MerchPage() {
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedColor, setSelectedColor] = useState<string>("Midnight Black");
  const [isPreorderOpen, setIsPreorderOpen] = useState(false);

  // 🔗 Stripe Payment Link URL
  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/aFa28qgRM75l4Dv3MO0kE02";

  const handleOpenPreorder = () => {
    setIsPreorderOpen(true);
  };

  const handleClosePreorder = () => {
    setIsPreorderOpen(false);
  };

  const handleConfirmPreorder = () => {
    // TODO later: send size/color somewhere if you want to store them
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  return (
    <div className="min-h-screen text-white">
      <GlassNav />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl" />
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-24 pt-6 md:pt-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <span className="hidden text-xs text-white/50 md:inline">
            Drop 01 is in design
          </span>
        </div>

        {/* HERO + FEATURED */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)] md:items-center">
          {/* Left: Story + CTAs */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              <span>GhostriderJunior • Drop 01 - BUILT TO LAST</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                The first{" "}
                <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-pink-300 bg-clip-text text-transparent">
                  GhostriderJunior
                </span>{" "}
                hoodie.
              </h1>
              <p className="max-w-xl text-sm text-white/70 sm:text-base">
              A hoodie that doesn't shrink.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#collection"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-lg shadow-sky-500/40 hover:bg-zinc-100"
              >
                <ShoppingBag className="h-4 w-4" />
                See Drop 01 lineup
              </a>
              <Link
                to="/join"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                <Shirt className="h-4 w-4" />
                Get early access in Discord
              </Link>
            </div>

            <div className="grid gap-3 text-xs text-white/60 sm:grid-cols-2 sm:gap-4">
              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                <div>
                  <div className="font-medium text-white/80">
                    Heavyweight 450–500gsm fleece.
                  </div>
                  <p>
                    Real streetwear-level weight. Not a thin &quot;YouTuber merch&quot;
                    hoodie.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
                <div>
                  <div className="font-medium text-white/80">
                    Pre-shrunk so it stays your size.
                  </div>
                  <p>Wash it, dry it — it doesn&apos;t suddenly become a crop top.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <div>
                  <div className="font-medium text-white/80">
                    Streetwear-grade fabric & fit.
                  </div>
                  <p>Soft inside, clean outside, cut for real day-to-day wear.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <div>
                  <div className="font-medium text-white/80">Pre-order = first in line.</div>
                  <p>Support the drop early and get your unit before general release.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Featured 3D hoodie card */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/95 to-black shadow-[0_18px_60px_rgba(0,0,0,0.75)]"
          >
            <div className="absolute inset-0 opacity-60 mix-blend-screen">
              <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-sky-500/40 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-500/40 blur-3xl" />
            </div>

            <div className="relative p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/60">
                  Featured • Hoodie
                </span>
                <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70 backdrop-blur-sm">
                  3D preview — not final sample
                </span>
              </div>

              <div className="mt-3 mb-4 aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/60">
                <HoodieViewer3D />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    450gsm+ heavyweight fleece
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">Oversized fit</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.16em] text-sky-300">
                  Limited first run
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* PRE-ORDER BAND */}
        <section className="rounded-3xl border border-sky-400/25 bg-black/40 p-5 sm:p-6 backdrop-blur-md shadow-[0_0_40px_rgba(56,189,248,0.2)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {/* Left copy */}
            <div className="space-y-2 md:max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Pre-order & support the drop
              </div>
              <h2 className="text-lg font-semibold sm:text-xl">
                Lock in your hoodie early and help fund Drop 01.
              </h2>
              <p className="text-xs text-white/70 sm:text-sm">
                Pre-orders directly fund design, sampling, and production. You&apos;re
                literally backing the hoodie into existence — and in return, your unit
                ships{" "}
                <span className="font-medium text-sky-300">
                  before the public release.
                </span>
              </p>

              <div className="mt-3 grid gap-2 text-[11px] text-white/60 sm:grid-cols-3 sm:text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[10px]">
                    1
                  </span>
                  <span>Choose your size</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[10px]">
                    2
                  </span>
                  <span>Secure your pre-order</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[10px]">
                    3
                  </span>
                  <span>Receive hoodie before public shipping begins</span>
                </div>
              </div>
            </div>

            {/* Size + button */}
            <div className="mt-3 flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-black/60 p-4 md:mt-0 md:max-w-xs">
              <div className="flex flex-col gap-2 text-sm">
                <label className="text-xs text-white/70">Select size</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M (recommended)</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <button
                onClick={handleOpenPreorder}
                className="mt-1 inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-black hover:bg-sky-400"
              >
                Pre-order hoodie
              </button>

              <p className="text-[11px] text-white/55">
                You&apos;re not ordering from a warehouse — you&apos;re helping build the
                first run. If the drop can&apos;t go ahead, we&apos;ll refund you.
              </p>
            </div>
          </div>
        </section>

        {/* COLLECTION + SIDE INFO */}
        <section id="collection" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
              Drop 01 — Lineup
            </h2>
            <span className="text-xs text-white/50">
              All items are{" "}
              <span className="font-medium text-sky-300">locked pre-production</span>.
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
            {/* Product cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {merchItems.map((item, idx) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: idx * 0.05,
                    type: "spring",
                    stiffness: 160,
                    damping: 20,
                  }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900 to-black cursor-default"
                >
                  <div className="relative px-4 pt-4">
                    <div className="absolute inset-x-4 top-3 flex items-center justify-between text-[11px]">
                      <span className="rounded-full bg-black/60 px-2.5 py-1 text-white/70 backdrop-blur">
                        {item.tag}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Lock chip */}
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: -8 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 18,
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/70 shadow-[0_0_18px_rgba(0,0,0,0.8)] group-hover:border-sky-400/60 group-hover:text-sky-300"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </motion.div>

                        {/* Status pill */}
                        <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-sky-300">
                          Locked
                        </span>
                      </div>
                    </div>

                    {/* Mini mockup rectangle */}
                    <div className="mt-9 mb-3 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25),_transparent_60%)]" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold sm:text-base">
                        {item.name}
                      </h3>
                      <span className="text-xs text-white/70">{item.price}</span>
                    </div>
                    <p className="text-xs text-white/60 sm:text-[13px]">
                      {item.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/60">
                      {item.colors.map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-white/5 px-2.5 py-1"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
                      <span>Sizes XS–XXL planned</span>
                      <span>Community vote on colorways</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Info / FAQ side panel */}
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15,
                type: "spring",
                stiffness: 150,
                damping: 20,
              }}
              className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900 to-black p-5"
            >
              <h3 className="mb-1 text-sm font-semibold sm:text-base">
                How Drop 01 is going to work
              </h3>
              <ul className="space-y-3 text-xs text-white/70 sm:text-[13px]">
                <li className="flex gap-3">
                  <Shield className="mt-0.5 h-4 w-4 text-sky-300" />
                  <div>
                    <div className="font-medium text-white/90">
                      Quality first, no chinese hoodies.
                    </div>
                    <p>
                      We&apos;re using real streetwear blanks and screened prints.
                      If it doesn&apos;t meet the standard, it doesn&apos;t go live.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Truck className="mt-0.5 h-4 w-4 text-sky-300" />
                  <div>
                    <div className="font-medium text-white/90">
                      Global shipping.
                    </div>
                    <p>
                      Worldwide shipping as u would except from GhostriderJunior, if the delivery guys won't go to your location, he will do it himself!
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-indigo-300" />
                  <div>
                    <div className="font-medium text-white/90">
                      Community actually has a say.
                    </div>
                    <p>
                      Colorways, graphics, and extra pieces get voted on in Discord
                      before anything is printed. If you&apos;re early, your taste
                      shapes the drop.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70">
                <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/60">
                  <span>Drop 01 progress</span>
                  <span className="text-sky-300">Design & sampling</span>
                </div>
                <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400" />
                </div>
                <p>
                  We&apos;re still dialing in fits, fabrics, and prints. If you want
                  to be part of that process, hop into the Discord and live in the
                  merch channel.
                </p>
              </div>

              <Link
                to="/join"
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-100"
              >
                Join Discord
              </Link>
            </motion.aside>
          </div>
        </section>
      </main>

      {/* Pre-order modal */}
      {isPreorderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/95 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.85)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                  Pre-order
                </p>
                <h3 className="text-base font-semibold text-white">
                  GhostriderJunior Hoodie — Pre-order
                </h3>
              </div>
              <button
                onClick={handleClosePreorder}
                className="rounded-full border border-white/15 bg-white/5 p-1 text-white/60 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-xs text-white/70">
              Choose your size and preferred color. After you confirm, you&apos;ll be
              redirected to a secure Stripe checkout page to complete your pre-order.
            </p>

            {/* Size */}
            <div className="mb-3 flex flex-col gap-2 text-sm">
              <label className="text-xs text-white/70">Size</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M (recommended)</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>

            {/* Color */}
            <div className="mb-4 flex flex-col gap-2 text-sm">
              <label className="text-xs text-white/70">Color</label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
              >
                <option value="Midnight Black">Midnight Black</option>
                <option value="Storm Grey">Storm Grey</option>
                <option value="Charcoal">Charcoal</option>
                <option value="Sand">Sand</option>
                <option value="Midnight Navy">Midnight Navy</option>
                <option value="Desert Taupe">Desert Taupe</option>
                <option value="Pink">Pink</option>
              </select>
            </div>

            <div className="mb-4 space-y-2 text-[11px] text-white/60">
              <p>
                <span className="font-medium text-white/80">What happens next?</span>{" "}
                You&apos;ll be taken to a Stripe payment page to complete the pre-order.
                Once paid, your slot is locked in.
              </p>
              <p>
                Your pre-order helps fund production and you&apos;ll receive your hoodie{" "}
                <span className="font-medium text-sky-300">
                  before the shipping begins.
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={handleClosePreorder}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPreorder}
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-black hover:bg-sky-400"
              >
                Continue to payment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
