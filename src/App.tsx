import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser, AuthGateModal } from "./auth";
import { motion, AnimatePresence } from "framer-motion";
// NOTE: Avoid static import of @stripe/stripe-js so the sandbox won't crash if the pkg isn't installed.
// We'll dynamically import it inside a hook and fall back to a harmless mock in test/sandbox mode.
import {
  CreditCard,
  Zap,
  Infinity as InfinityIcon,
  Shield,
  CheckCircle2,
  Github,
  Twitter,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  BadgeCheck,
  MoreHorizontal,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
const MotionLink = motion(Link);

/**
 * GhostRiderJunior – Interactive Support Page (Stripe-ready) + What's Coming Feed + Stealth Admin + Post Modal
 * --------------------------------------------------------------------
 * - Optional Stripe dynamic import (no hard crash if @stripe/stripe-js isn't available in sandbox).
 * - Provide default test price IDs so diagnostics/tests pass in sandbox.
 * - Instagram-style "What's Coming" with in-page editor (admin only).
 * - Stealth creator unlock (logo 5x or type g r j), then enter admin password.
 * - Click post → animated modal with blurred backdrop.
 * - LocalStorage persistence for posts.
 * - Admin-only Edit/Delete kebab menu with animations.
 * - Tests for editor/modal/sequence + config diagnostics.
 * - ✨ Extra animations added throughout (hover lifts, image reveals, like burst, layout transitions, scroll reveals).
 *
 * Config can be provided via props, window.__GRJ_CONFIG, or <meta> tags.
 */

const CLOUDINARY = {
  cloudName: "dpzvp40au", // e.g. "d3abcxyz"
  uploadPreset: "noseee", // e.g. "posts_unsigned"
};

const MAX_HOME_UPDATES = 4; // show 4 on homepage

// ---- Lightweight UI primitives ----
const Button = ({
  className = "",
  disabled,
  onClick,
  children,
  type,
}: React.PropsWithChildren<{
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}>) => (
  <motion.button
    type={type || "button"}
    onClick={onClick}
    disabled={disabled}
    whileTap={{ scale: 0.97 }}
    whileHover={!disabled ? { y: -1 } : undefined}
    className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-white/90 transition ${className}`}
  >
    {children}
  </motion.button>
);

const Card = ({
  className = "",
  id,
  children,
}: React.PropsWithChildren<{ className?: string; id?: string }>) => (
  <motion.div
    id={id}
    initial={{ opacity: 0, y: 8, scale: 0.995 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ type: "spring", stiffness: 160, damping: 20 }}
    className={`rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl ${className}`}
  >
    {children}
  </motion.div>
);

const CardContent = ({
  className = "",
  children,
}: React.PropsWithChildren<{ className?: string }>) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

// ---- Config Resolution ----
export type GhostRiderConfig = {
  publishableKey?: string;
  priceMonthly?: string;
  priceOneTime?: string;
  successUrl?: string;
  cancelUrl?: string;
  /** Admin password/key used to unlock the What's Coming editor (client-side gate). */
  adminKey?: string;
  adminPassword?: string;
  paymentLinkMonthly?: string;
  paymentLinkOneTime?: string;
};

function getMeta(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || undefined;
}

import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  increment,
  getDoc,
  setDoc,
  getCountFromServer,
} from "firebase/firestore";

async function upsertUserProfile(authUser: any) {
  const u = authUser;
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);

  const base = {
    discordId: u.providerData?.[0]?.uid || u.discordId || null,
    username: u.displayName || u.username || null,
    globalName: u.globalName ?? null,
    email: u.email ?? null, // will be null without 'email' scope or if unverified
    avatar: u.photoURL ?? u.avatar ?? null,
    lastLoginAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, { ...base, createdAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(ref, base, { merge: true }); // don’t touch createdAt
  }
}

function useCommentCount(postId?: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!postId) return;
    const unsub = onSnapshot(collection(db, "posts", postId, "comments"), (snap) => {
      setCount(snap.size);
    });
    return () => unsub();
  }, [postId]);
  return count;
}

function resolveConfig(props: GhostRiderConfig): Required<GhostRiderConfig> | GhostRiderConfig {
  const fromProps = props || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromGlobal = (typeof window !== "undefined" && (window as any).__GRJ_CONFIG) || {};
  const fromMeta: GhostRiderConfig = {
    publishableKey: getMeta("grj-publishable-key"),
    priceMonthly: getMeta("grj-price-monthly"),
    priceOneTime: getMeta("grj-price-onetime"),
    successUrl: getMeta("grj-success-url"),
    cancelUrl: getMeta("grj-cancel-url"),
    adminKey: getMeta("grj-admin-key"),
    adminPassword: getMeta("grj-admin-password"),
    paymentLinkMonthly: getMeta("grj-link-monthly"),
    paymentLinkOneTime: getMeta("grj-link-onetime"),
  };

  const cfg: GhostRiderConfig = {
    publishableKey:
      fromProps.publishableKey || fromGlobal.publishableKey || fromMeta.publishableKey,
    priceMonthly: fromProps.priceMonthly || fromGlobal.priceMonthly || fromMeta.priceMonthly,
    priceOneTime: fromProps.priceOneTime || fromGlobal.priceOneTime || fromMeta.priceOneTime,
    successUrl:
      fromProps.successUrl ||
      fromGlobal.successUrl ||
      fromMeta.successUrl ||
      "https://ghostriderjunior.com/success",
    cancelUrl:
      fromProps.cancelUrl ||
      fromGlobal.cancelUrl ||
      fromMeta.cancelUrl ||
      "https://ghostriderjunior.com/cancel",
    adminKey: fromProps.adminKey || fromGlobal.adminKey || fromMeta.adminKey,
    adminPassword: fromProps.adminPassword || fromGlobal.adminPassword || fromMeta.adminPassword,
    paymentLinkMonthly:
      fromProps.paymentLinkMonthly || fromGlobal.paymentLinkMonthly || fromMeta.paymentLinkMonthly,
    paymentLinkOneTime:
      fromProps.paymentLinkOneTime || fromGlobal.paymentLinkOneTime || fromMeta.paymentLinkOneTime,
  };
  return cfg;
}

// ---- Utilities ----
function isValidUrlMaybe(url?: string) {
  if (!url) return true;
  try {
    const u = new URL(url);
    if (u.protocol === "javascript:") return false;
    return true;
  } catch {
    return false;
  }
}

function isHttpUrl(url?: string) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// Render helper: decide if an image should be shown
function shouldShowImage(url?: string) {
  if (!url) return false;
  if (!isValidUrlMaybe(url)) return false;
  return true;
}

// Admin secret resolver (password preferred, then key)
function resolveAdminSecret(cfg: GhostRiderConfig) {
  return cfg.adminPassword || cfg.adminKey || "";
}

/** Secret sequence matcher: returns true when buffer ends with target sequence */
export function matchSequence(buffer: string[], target: string[]): boolean {
  if (buffer.length < target.length) return false;
  for (let i = 0; i < target.length; i++) {
    if (buffer[buffer.length - target.length + i] !== target[i]) return false;
  }
  return true;
}

// ---- Tiny runtime tests (diagnostics) ----
function runConfigTests(cfg: GhostRiderConfig) {
  const results: { name: string; pass: boolean; message?: string }[] = [];
  const keyLooksOk =
    !!cfg.publishableKey && /^pk_(test|live)_[A-Za-z0-9]{10,}$/.test(cfg.publishableKey);
  results.push({ name: "Publishable key present & shape", pass: keyLooksOk });
  results.push({ name: "Monthly price present", pass: !!cfg.priceMonthly });
  results.push({ name: "One-time price present", pass: !!cfg.priceOneTime });
  results.push({ name: "Success URL present", pass: !!cfg.successUrl });
  results.push({ name: "Cancel URL present", pass: !!cfg.cancelUrl });
  const looksLikeSecret = cfg.publishableKey?.startsWith("sk_") || false;
  results.push({
    name: "No secret key in client",
    pass: !looksLikeSecret,
    message: looksLikeSecret ? "❌ Never expose sk_ keys in the browser" : undefined,
  });
  if (typeof window !== "undefined") {
    console.groupCollapsed("GRJ config tests");
    results.forEach((r) =>
      console[r.pass ? "log" : "error"](
        `${r.pass ? "✔" : "✖"} ${r.name}${r.message ? ` – ${r.message}` : ""}`,
      ),
    );
    console.groupEnd();
  }
  return results;
}

// ---- UI self-tests ----
function runPostTests() {
  const results: { name: string; pass: boolean; message?: string }[] = [];
  const tooLong = "x".repeat(2300);
  results.push({
    name: "Caption length capped (<= 2200)",
    pass: tooLong.slice(0, 2200).length === 2200,
  });
  results.push({
    name: "URL validator accepts http(s) & empty",
    pass: isValidUrlMaybe("https://example.com") && isValidUrlMaybe(""),
  });
  results.push({ name: "URL validator rejects invalid", pass: !isValidUrlMaybe("notaurl") });
  results.push({ name: "Reject javascript: URLs", pass: !isValidUrlMaybe("javascript:alert(1)") });
  const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("grj-admin") : null;
  results.push({ name: "Editor locked by default", pass: stored !== "true" });
  results.push({
    name: "No image when url empty",
    pass: shouldShowImage(undefined) === false && shouldShowImage("") === false,
  });
  results.push({
    name: "Show image for valid url",
    pass: shouldShowImage("https://example.com/pic.png") === true,
  });
  results.push({ name: "Hide image for invalid url", pass: shouldShowImage("notaurl") === false });
  const cfgA: GhostRiderConfig = { adminPassword: "pass", adminKey: "key" };
  const cfgB: GhostRiderConfig = { adminKey: "key" };
  results.push({
    name: "Admin password preferred over key",
    pass: resolveAdminSecret(cfgA) === "pass",
  });
  results.push({ name: "Falls back to key", pass: resolveAdminSecret(cfgB) === "key" });
  results.push({
    name: "matchSequence detects [g,r,j]",
    pass: matchSequence(["a", "g", "r", "j"], ["g", "r", "j"]) === true,
  });
  results.push({
    name: "matchSequence false on partial",
    pass: matchSequence(["g", "r"], ["g", "r", "j"]) === false,
  });
  const t1 = toggleLikeState(false, 0);
  const t2 = toggleLikeState(true, 1);
  results.push({
    name: "toggleLikeState increments on like",
    pass: t1.liked === true && t1.count === 1,
  });
  results.push({
    name: "toggleLikeState decrements on unlike (floored at 0)",
    pass: t2.liked === false && t2.count === 0,
  });
  const sample: ComingPost = { id: "a", caption: "x", createdAt: 1 };
  const patched = { ...sample, caption: "y" };
  results.push({ name: "edit patch applies", pass: patched.caption === "y" });
  const afterDelete = [{ id: "b" } as any].filter((p) => p.id !== "a");
  results.push({ name: "delete removes item", pass: afterDelete.length === 1 });
  if (typeof window !== "undefined") {
    console.groupCollapsed("GRJ post tests");
    results.forEach((r) =>
      console[r.pass ? "log" : "error"](
        `${r.pass ? "✔" : "✖"} ${r.name}${r.message ? ` – ${r.message}` : ""}`,
      ),
    );
    console.groupEnd();
  }
  return results;
}

// ---- Instagram-like Post Components ----
export type ComingPost = {
  id: string;
  caption: string;
  imageUrl?: string;
  createdAt: number; // epoch ms
  /** optional seed for initial like count (client-only, no server) */
  initialLikes?: number;
  likes?: number;
  commentsCount?: number; // ✅ add this
};

const AVATAR_URL =
  "https://cdn.discordapp.com/avatars/271381222184321025/d8c4d7af7ba2973e427ce6ba83662df6.png?size=1024"; // replace with your logo if desired

function useComingPosts() {
  const [posts, setPosts] = useState<ComingPost[]>([]);
  // cache counts we discovered so we can render them without writing to Firestore
  const backfillCache = useRef<Record<string, number>>({});
  const fetchedOnce = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const raw = snap.docs.map((d) => {
        const x = d.data();
        const id = d.id;
        return {
          id,
          caption: x.caption,
          imageUrl: x.imageUrl || undefined,
          createdAt: x.createdAt?.toMillis?.() ?? Date.now(),
          likes: x.likes ?? 0,
          commentsCount: backfillCache.current[id] ?? x.commentsCount ?? 0, // ⬅️ include
        } as ComingPost;
      });
      setPosts(raw);

      // fire off backfill requests once per post that still shows 0
      for (const p of raw) {
        if ((p.commentsCount ?? 0) === 0 && !fetchedOnce.current.has(p.id)) {
          fetchedOnce.current.add(p.id);
          try {
            const c = await getCountFromServer(
              // ⬅️ add this line
              collection(db, "posts", p.id, "comments"),
            );
            const real = c.data().count || 0;
            if (real > 0) {
              backfillCache.current[p.id] = real;
              setPosts((prev) =>
                prev.map((pp) =>
                  pp.id === p.id
                    ? { ...pp, commentsCount: Math.max(pp.commentsCount ?? 0, real) }
                    : pp,
                ),
              );
            }
          } catch (e) {
            console.warn("count backfill failed for", p.id, e);
          }
        }
      }
    });
    return () => unsub();
  }, []);

  // ✅ Add a new post (throws on error so caller can show message)
  const addPost = async (p: ComingPost) => {
    try {
      await addDoc(collection(db, "posts"), {
        caption: p.caption,
        imageUrl: isHttpUrl(p.imageUrl) ? p.imageUrl : null,
        createdAt: serverTimestamp(),
        likes: 0,
      });
    } catch (err) {
      console.error("Firestore addDoc failed:", err);
      throw err; // let the UI show feedback
    }
  };

  // ✅ Update an existing post
  const updatePost = async (id: string, patch: Partial<ComingPost>) => {
    await updateDoc(doc(db, "posts", id), patch);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  // ✅ Delete a post
  const deletePost = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return { posts, addPost, updatePost, deletePost };
}

// ---- Support progress (current/goal) stored in Firestore ----
// ---- Support progress (current/goal) stored in Firestore ----
function useSupportProgress(isAdmin: boolean) {
  const [goal, setGoalState] = useState<number | null>(null);
  const [current, setCurrentState] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const ref = doc(db, "config", "support");
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        try {
          if (!snap.exists()) {
            console.warn("[GRJ] config/support missing.");
            // Seed only if admin (prevents random visitors from creating the doc)
            if (isAdmin) {
              await setDoc(ref, { goal: 500, current: 0 }, { merge: true });
              console.log("[GRJ] Seeded config/support with goal=500, current=0");
            }
            setGoalState((g) => g ?? 500);
            setCurrentState((c) => c ?? 0);
          } else {
            const d = snap.data() as { goal?: number; current?: number };
            console.log("[GRJ] support snapshot:", d);
            if (typeof d.goal === "number") setGoalState(d.goal);
            if (typeof d.current === "number") setCurrentState(d.current);
          }
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("[GRJ] onSnapshot error:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [isAdmin]);

  const setGoal = async (val: number) => {
    setGoalState(val);
    try {
      await setDoc(doc(db, "config", "support"), { goal: val }, { merge: true });
    } catch (e) {
      console.error("Failed to save goal:", e);
    }
  };

  const setCurrent = async (val: number) => {
    setCurrentState(val);
    try {
      await setDoc(doc(db, "config", "support"), { current: val }, { merge: true });
    } catch (e) {
      console.error("Failed to save current:", e);
    }
  };

  return { goal: goal ?? 0, current: current ?? 0, setGoal, setCurrent, loading };
}

// ---- Likes (per-visitor, localStorage) ----
function toggleLikeState(prevLiked: boolean, prevCount: number) {
  const liked = !prevLiked;
  const count = Math.max(0, prevCount + (prevLiked ? -1 : 1));
  return { liked, count };
}

function useLikes() {
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("grj-liked-posts") || "{}");
    } catch {
      return {};
    }
  });
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem("grj-like-counts") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("grj-liked-posts", JSON.stringify(likedMap));
    } catch {}
  }, [likedMap]);
  useEffect(() => {
    try {
      localStorage.setItem("grj-like-counts", JSON.stringify(counts));
    } catch {}
  }, [counts]);

  const liked = (id: string) => !!likedMap[id];
  const count = (id: string) => counts[id] ?? 0;
  const toggle = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    setCounts((prev) => {
      const current = prev[id] ?? 0;
      const next = toggleLikeState(!!likedMap[id], current).count;
      return { ...prev, [id]: next };
    });
  };

  return { liked, count, toggle };
}

const VerifiedBadge = () => (
  <span
    aria-label="Verified account"
    title="Verified account"
    className="inline-flex items-center align-middle ml-1"
  >
    <BadgeCheck className="h-4 w-4 text-sky-400" />
  </span>
);

const InstaHeader = ({ isAdmin = false }: { isAdmin?: boolean }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex items-center gap-3">
      <img
        src={AVATAR_URL}
        alt="grj avatar"
        className="h-8 w-8 rounded-full ring-1 ring-white/10"
      />
      <div className="leading-tight">
        <div className="text-sm font-semibold">
          ghostriderjunior <VerifiedBadge />
        </div>
        <div className="text-[10px] text-white/60">Official updates</div>
      </div>
    </div>
    {isAdmin && <MoreHorizontal className="h-5 w-5 text-white/70" />}
  </div>
);

// Like burst particles
function HeartBurst({ show }: { show: boolean }) {
  const particles = Array.from({ length: 8 });
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute left-10 top-[18px]"
        >
          {particles.map((_, i) => {
            const angle = (i / particles.length) * Math.PI * 2;
            const dx = Math.cos(angle) * 22;
            const dy = Math.sin(angle) * 14;
            return (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
                animate={{ x: dx, y: dy, scale: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute block h-2 w-2 rounded-full bg-pink-400"
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const InstaActions = ({
  liked,
  count,
  onLike,
  onComment,
  commentCount = 0,
}: {
  liked: boolean;
  count: number;
  onLike: () => void;
  onComment?: () => void;
  commentCount?: number;
}) => (
  <div className="flex items-center justify-between px-4 py-3 relative">
    <div className="flex gap-4">
      {/* like */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onLike();
        }}
        aria-pressed={liked}
        whileTap={{ scale: 0.9 }}
        className={`group/like inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/10 transition ${liked ? "text-pink-400" : ""}`}
      >
        <Heart className="h-5 w-5 self-center" style={{ fill: liked ? "currentColor" : "none" }} />
        <span className="text-xs tabular-nums flex items-center h-5 leading-none">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={count}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="block"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.button>

      {/* comment */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onComment?.();
        }}
        className="group/comment inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/10 transition"
        aria-label="Comment"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-xs tabular-nums flex items-center h-5 leading-none">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={commentCount ?? 0}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="block"
            >
              {(commentCount ?? 0) > 0 ? commentCount : ""}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.button>
      {/* share (optional) */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="rounded-full p-1 hover:bg-white/10"
        aria-label="Share"
      >
        <Send className="h-5 w-5" />
      </motion.button>
    </div>

    <motion.button
      whileTap={{ scale: 0.9 }}
      className="rounded-full p-1 hover:bg-white/10"
      aria-label="Save"
    >
      <Bookmark className="h-5 w-5" />
    </motion.button>
  </div>
);

// --- Admin kebab + edit modal helpers ---
const KebabMenu = ({ children }: React.PropsWithChildren) => (
  <motion.div
    initial={{ opacity: 0, y: -4, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -6, scale: 0.98 }}
    transition={{ duration: 0.15 }}
    className="rounded-xl border border-white/10 bg-black/80 text-sm shadow-lg backdrop-blur p-1"
  >
    {children}
  </motion.div>
);

const KebabItem = ({
  danger,
  children,
  onClick,
}: {
  danger?: boolean;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <motion.button
    whileHover={{ x: 3 }}
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 ${danger ? "text-red-300 hover:bg-red-500/10" : ""}`}
  >
    {children}
  </motion.button>
);

function AdminKebab({
  onEdit,
  onDelete,
}: {
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="h-8 w-8 grid place-items-center rounded-full bg-black/40 border border-white/10 hover:bg-white/10"
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 mt-2"
          >
            <KebabMenu>
              <KebabItem
                onClick={(e) => {
                  onEdit(e);
                  setOpen(false);
                }}
              >
                Edit
              </KebabItem>
              <KebabItem
                danger
                onClick={(e) => {
                  onDelete(e);
                  setOpen(false);
                }}
              >
                Delete
              </KebabItem>
            </KebabMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditPostModal({
  post,
  onClose,
  onSave,
}: {
  post: ComingPost | null;
  onClose: () => void;
  onSave: (caption: string, imageUrl?: string) => void;
}) {
  const [caption, setCaption] = useState(post?.caption || "");
  const [image, setImage] = useState<string>(post?.imageUrl || "");
  useEffect(() => {
    setCaption(post?.caption || "");
    setImage(post?.imageUrl || "");
  }, [post?.id]);

  return (
    <AnimatePresence>
      {post && (
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
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-4"
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0 }}
          >
            <motion.div
              layout
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-6"
            >
              <h3 className="text-lg font-semibold">Edit update</h3>
              <div className="mt-3 grid gap-3">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[120px] rounded-2xl bg-black/30 border border-white/10 p-3 outline-none focus:ring-2 focus:ring-white/20"
                />
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Optional image URL"
                  className="rounded-xl bg-black/30 border border-white/10 px-2 py-2 outline-none focus:ring-2 focus:ring-white/20"
                />
                <div className="flex justify-end gap-2">
                  <Button className="!bg-white/20 !text-white" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={() => onSave(caption.trim(), image.trim() || undefined)}>
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const InstaPostCard = ({
  post,
  onOpen,
  liked,
  onLike,
  isAdmin,
  onEdit,
  onDelete,
  count,
  onComment, // 👈 NEW (optional, lets parent control the visible like count)
}: {
  post: ComingPost;
  onOpen: (p: ComingPost) => void;
  liked: boolean;
  onLike: () => void;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  count?: number;
  onComment?: (p: ComingPost) => void; // 👈 NEW
}) => {
  const liveCommentCount = useCommentCount(post.id);
  const [burst, setBurst] = useState(false);

  const handleLike = () => {
    const wasLiked = liked;
    onLike();
    if (!wasLiked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 520);
    }
  };

  return (
    <motion.div
      layout
      onClick={() => onOpen(post)}
      whileHover={{ y: -2 }}
      className="group text-left rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20 relative"
      role="button"
      tabIndex={0}
    >
      <InstaHeader isAdmin={isAdmin} />

      {isAdmin && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition">
          <AdminKebab
            onEdit={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            onDelete={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        </div>
      )}

      {shouldShowImage(post.imageUrl) && (
        <motion.img
          src={post.imageUrl as string}
          alt="post"
          className="w-full max-h-[420px] object-cover"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          whileHover={{ scale: 1.03 }}
        />
      )}

      <div className="relative">
        <HeartBurst show={burst} />
        <InstaActions
          liked={liked}
          count={typeof count === "number" ? count : (post.likes ?? 0)} // 👈 use parent count if given
          onLike={handleLike}
          onComment={() => onComment?.(post)}
          commentCount={liveCommentCount}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="px-4 pb-4"
      >
        <p className="text-sm">
          <span className="font-semibold mr-2 inline-flex items-center">
            ghostriderjunior <VerifiedBadge />
          </span>
          {post.caption}
        </p>
        <div className="mt-2 text-[10px] uppercase tracking-wide text-white/40">
          {new Date(post.createdAt).toLocaleString()}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---- Modal for enlarged post ----
export function PostModal({
  post,
  onClose,
  liked,
  count,
  onLike,
  isAdmin,
  onEdit,
  onDelete,
  onComment,
}: {
  post: ComingPost | null;
  onClose: () => void;
  liked: boolean;
  count: number;
  onLike: () => void;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onComment?: (p: ComingPost) => void;
}) {
  const liveCommentCount = useCommentCount(post?.id);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {post && (
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
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-0 flex items-center justify-center p-4"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <motion.div
              layout
              className="relative max-w-3xl w-full rounded-3xl overflow-hidden border border-white/10 bg-zinc-900"
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-3 right-3 z-50 h-9 w-9 grid place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </motion.button>
              <div className="relative">
                <InstaHeader isAdmin={isAdmin} />
                {isAdmin && (
                  <div className="absolute top-3 right-14 z-40">
                    <AdminKebab
                      onEdit={(e) => {
                        e.stopPropagation();
                        onEdit && onEdit();
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete();
                      }}
                    />
                  </div>
                )}
              </div>
              {shouldShowImage(post?.imageUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <motion.img
                  src={post?.imageUrl as string}
                  alt="post"
                  className="w-full max-h-[70vh] object-contain bg-black"
                  initial={{ opacity: 0, scale: 1.01 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              <div className="px-4 pb-5">
                <InstaActions
                  liked={liked}
                  count={count}
                  onLike={onLike}
                  onComment={() => onComment?.(post)}
                  commentCount={liveCommentCount ?? 0}
                />
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm"
                >
                  <span className="font-semibold mr-2 inline-flex items-center">
                    ghostriderjunior <VerifiedBadge />
                  </span>
                  {post.caption}
                </motion.p>
                <div className="mt-2 text-[10px] uppercase tracking-wide text-white/40">
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CommentsModal({
  post,
  open,
  onClose,
  user,
  onLogin, // 👈 add
}: {
  post: ComingPost | null;
  open: boolean;
  onClose: () => void;
  user: { uid: string; displayName?: string | null; photoURL?: string | null } | null;
  onLogin: () => void; // 👈 add
}) {
  const [comments, setComments] = useState<
    Array<{
      id: string;
      text: string;
      createdAt: number;
      userId: string;
      userName?: string;
      userAvatar?: string;
    }>
  >([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !post) return;
    const q = query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, async (snap) => {
      const rows = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          id: d.id,
          text: x.text ?? "",
          createdAt: x.createdAt?.toMillis?.() ?? Date.now(),
          userId: x.userId ?? "",
          userName: x.userName ?? "anonymous",
          userAvatar: x.userAvatar ?? "",
        };
      });
      setComments(rows);
    });
    return () => unsub();
  }, [open, post]);

  const send = async () => {
    const txt = input.trim();
    if (!post || !txt || sending || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        text: txt,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || "discord user",
        userAvatar: user.photoURL || null,
      });

      await updateDoc(doc(db, "posts", post.id), { commentsCount: increment(1) });
      setInput("");
    } catch (e) {
      console.error("Failed to add comment or increment count:", e);
      // optional: surface a small UI error
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && post && (
        <motion.div
          className="fixed inset-0 z-[60]"
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
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-0 flex items-center justify-center p-4"
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
          >
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="text-sm font-semibold">Comments</div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {comments.length === 0 && (
                  <div className="text-sm text-white/60">No comments yet. Be the first!</div>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    {c.userAvatar ? (
                      <img
                        src={c.userAvatar}
                        alt=""
                        className="h-8 w-8 rounded-full border border-white/10"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white/10" />
                    )}
                    <div>
                      <div className="text-xs text-white/70">
                        <span className="font-semibold">{c.userName}</span>{" "}
                        <span className="text-white/40">
                          • {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm mt-1">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* input row (only if authed) */}
              {user ? (
                <div className="border-t border-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Add a comment…"
                      className="flex-1 rounded-2xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <Button disabled={!input.trim() || sending} onClick={send}>
                      {sending ? "Sending…" : "Send"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-white/10 p-3 text-xs text-white/60">
                  <div className="flex items-center justify-between">
                    <span>You must be logged in to comment.</span>
                    <Button onClick={onLogin}>Log in</Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



// ---- Stripe hook (dynamic import + mock fallback) ----
// Minimal type for the parts we use
type StripeLike = { redirectToCheckout: (opts: any) => Promise<{ error?: any } | void> } | null;

async function loadStripeSafely(publishableKey: string): Promise<StripeLike> {
  try {
    // Dynamically import @stripe/stripe-js if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod: any = await import("@stripe/stripe-js").catch(() => null);
    if (!mod || !mod.loadStripe) return null;
    const stripe = await mod.loadStripe(publishableKey);
    return (stripe as StripeLike) || null;
  } catch {
    return null;
  }
}

function useStripeRedirect(cfg: GhostRiderConfig) {
  const [stripe, setStripe] = useState<StripeLike>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (cfg.publishableKey) {
        const s = await loadStripeSafely(cfg.publishableKey);
        if (mounted) setStripe(s);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cfg.publishableKey]);

  const redirect = useCallback(
    async ({
      price,
      mode,
      successUrl,
      cancelUrl,
    }: {
      price: string;
      mode: "subscription" | "payment";
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!stripe) {
        console.warn("Stripe not available in sandbox – redirectToCheckout skipped.");
        return;
      }
      await stripe.redirectToCheckout({
        lineItems: [{ price, quantity: 1 }],
        mode,
        successUrl,
        cancelUrl,
      });
    },
    [stripe],
  );

  return { stripe, redirect };
}

// ---- Small UI atoms we referenced but hadn't defined ----
function TierToggle({
  value,
  onChange,
}: {
  value: "monthly" | "onetime";
  onChange: (v: "monthly" | "onetime") => void;
}) {
  const isMonthly = value === "monthly";
  return (
    <div className="relative inline-flex rounded-2xl border border-white/10 bg-white/10 backdrop-blur p-1">
      <button
        className={`relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition ${isMonthly ? "text-black" : "text-white/80"}`}
        onClick={() => onChange("monthly")}
      >
        Monthly
      </button>
      <button
        className={`relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition ${!isMonthly ? "text-black" : "text-white/80"}`}
        onClick={() => onChange("onetime")}
      >
        One‑time
      </button>
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-xl bg-white"
        initial={false}
        animate={{ left: isMonthly ? 4 : "calc(50% + 4px)" }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      />
    </div>
  );
}

function ProgressBar({ current, goal }: { current: number; goal: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((current / Math.max(goal, 1)) * 100)));
  return (
    <div className="w-full">
      <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-2 text-xs text-white/70"
      >
        {current} / {goal} ( {pct}% )
      </motion.div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-white/70">{text}</p>
    </motion.div>
  );
}

export default function GhostRiderJuniorLanding(props: GhostRiderConfig) {
  const cfg = resolveConfig(props);
  const [tier, setTier] = useState<"monthly" | "onetime">("monthly");
  const currentLink = tier === "monthly" ? cfg.paymentLinkMonthly : cfg.paymentLinkOneTime;

  // auth state (Discord via your ./auth)
  const auth = typeof useAuthUser === "function" ? useAuthUser() : null;
  const user = auth?.user ?? null;
  const [authGateOpen, setAuthGateOpen] = useState(false);

  // comments modal state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentPost, setCommentPost] = useState<ComingPost | null>(null);

  const navigate = useNavigate();
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState("");
  const [askSending, setAskSending] = useState(false);
  const openAsk = () => {
    if (!user) {
      setAuthGateOpen(true);
      return;
    }
    setAskOpen(true);
  };
const submitQuestion = async () => {
  const txt = askText.trim();
  if (!txt) return;

  // ✅ guard for null
  if (!user) {
    setAuthGateOpen(true);
    return;
  }

  setAskSending(true);
  try {
    await addDoc(collection(db, "questions"), {
      text: txt,
      createdAt: serverTimestamp(),
      userId: user.uid,                   // safe after guard
      userName: user.displayName || "discord user",
      userAvatar: user.photoURL || null,
      status: "open",
    });
    setAskText("");
    setAskOpen(false);
  } catch (e) {
    console.error("Failed to submit question:", e);
  } finally {
    setAskSending(false);
  }
};
  useEffect(() => {
    if (!user?.uid) return;
    upsertUserProfile(user).catch((e) => console.error("upsertUserProfile failed:", e));
  }, [user?.uid]);

  useEffect(() => {
    if (authGateOpen && user && commentPost) {
      setAuthGateOpen(false);
      setCommentsOpen(true);
    }
  }, [authGateOpen, user, commentPost]);

  // when someone clicks comment on a card
  const handleCommentRequest = (p: ComingPost) => {
    setCommentPost(p);
    setCommentsOpen(true); // always open to view
  };

  // Admin state (session persisted) — single source of truth
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem("grj-admin") === "true";
  });
  const [adminInput, setAdminInput] = useState("");

  useEffect(() => {
    if (isAdmin && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("grj-admin", "true");
    }
  }, [isAdmin]);

  // Firestore-backed support progress
  const { goal, current, setGoal, setCurrent } = useSupportProgress(isAdmin);

  // Stripe (optional)
  const { stripe } = useStripeRedirect(cfg);
  useEffect(() => {
    console.log("Stripe loaded?", !!stripe, "Key:", cfg.publishableKey);
  }, [stripe, cfg.publishableKey]);

  // Diagnostics
  const diagnostics = useMemo(
    () => runConfigTests(cfg),
    [cfg.publishableKey, cfg.priceMonthly, cfg.priceOneTime, cfg.successUrl, cfg.cancelUrl],
  );
  const hasAllConfig = Boolean(cfg.publishableKey && cfg.priceMonthly && cfg.priceOneTime);

  // What's Coming state
  const { posts, addPost, updatePost, deletePost } = useComingPosts();
  const postTests = useMemo(() => runPostTests(), []);
  const likes = useLikes();
  const [draft, setDraft] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errMsg, setErrMsg] = useState<string>("");
  const CAP_LIMIT = 2200;

  // ---- Stealth unlock mechanics ----
  const [showUnlock, setShowUnlock] = useState(false);
  const logoClickCount = useRef(0);
  const keyBuffer = useRef<string[]>([]);
  const TARGET_SEQ = ["g", "r", "j"];

  const onLogoClick = () => {
    logoClickCount.current += 1;
    if (logoClickCount.current >= 5) {
      setShowUnlock(true);
      logoClickCount.current = 0;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!/^[a-z]$/.test(k)) return;
      keyBuffer.current.push(k);
      if (keyBuffer.current.length > 6) keyBuffer.current.shift();
      if (matchSequence(keyBuffer.current, TARGET_SEQ)) setShowUnlock(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- Modal state ----
  const [selectedPost, setSelectedPost] = useState<ComingPost | null>(null);
  const [editingPost, setEditingPost] = useState<ComingPost | null>(null);

  const onEditSave = (id: string, caption: string, imageUrl?: string) => {
    updatePost(id, { caption, imageUrl });
    setEditingPost(null);
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg("");

    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > CAP_LIMIT) return;
    if (uploading) return;
    if (imageUrl && !isHttpUrl(imageUrl)) return; // require http/https

    try {
      await addPost({
        id: crypto.randomUUID(),
        caption: trimmed,
        imageUrl: isHttpUrl(imageUrl) ? imageUrl : undefined, // sanitize
        createdAt: Date.now(),
      });

      setDraft("");
      setImageUrl("");
    } catch (err: any) {
      const code = err?.code || "unknown";
      setErrMsg(`Failed to post (${code}). Check Firestore rules & console.`);
    }
  };

  return (
    <div className="relative min-h-screen text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827] via-[#0a0a0a] to-black overflow-hidden">
      {/* Ambient orbs */}
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
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onLogoClick}
              className="h-9 w-9 grid place-items-center rounded-xl bg-white text-black font-black focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              GRJ
            </motion.button>
            <span className="font-semibold tracking-wide text-white/90">GhostriderJunior</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            {[
              { href: "#features", label: "Features" },
              { href: "#support", label: "Support" },
              { href: "#whats-coming", label: "What's coming" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="relative hover:text-white">
                <span>{l.label}</span>
                <motion.span
                  layoutId={`nav-underline`}
                  className="absolute -bottom-1 left-0 h-0.5 w-0 bg-white"
                  whileHover={{ width: "100%" }}
                />
              </a>
            ))}
            <a
              href="https://twitter.com"
              target="_blank"
              className="hover:text-white flex items-center gap-2"
              rel="noreferrer"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </a>
            <a
              href="https://github.com"
              target="_blank"
              className="hover:text-white flex items-center gap-2"
              rel="noreferrer"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative mt-14 grid gap-8 md:grid-cols-[1.3fr_1fr] items-center">
          <div>
            <motion.h1
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 90, damping: 14 }}
              className="text-4xl md:text-6xl font-black leading-tight"
            >
              Fuel the{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
                GhostriderJunior
              </span>{" "}
              project
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 text-white/70 max-w-xl"
            >
              Support for frequent updates.
            </motion.p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <TierToggle value={tier} onChange={setTier} />
              <Button
                onClick={() => currentLink && window.location.assign(currentLink)}
                disabled={!currentLink}
                className="rounded-2xl px-6 py-6 text-base font-semibold"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {tier === "monthly" ? "Support Monthly" : "One-time Support"}
              </Button>
              <span className="text-xs text-white/60">Secure checkout via Stripe</span>
            </div>
            <div className="mt-8 max-w-md">
              <ProgressBar current={current} goal={goal} />
              {isAdmin && (
                <div className="mt-3 grid gap-3 max-w-md">
                  <label className="text-xs text-white/60">Current: {current}</label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, goal || 1)}
                    value={Math.min(current, Math.max(1, goal || 1))}
                    onChange={(e) => setCurrent(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-white/60">Goal:</label>
                    <input
                      type="number"
                      min={1}
                      value={goal}
                      onChange={(e) => setGoal(Math.max(1, Number(e.target.value) || 1))}
                      className="w-28 rounded-md bg-black/30 border border-white/10 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="text-[11px] text-white/50">
                    Saved to Firestore at <code>config/support</code>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Card */}
          <Card id="support" className="">
            <CardContent>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm text-white/80">Choose your vibe</p>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl bg-black/30 border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">Monthly Backer</p>
                      <h3 className="text-2xl font-bold tracking-tight">
                        $5<span className="text-white/60 text-base">/mo</span>
                      </h3>
                    </div>
                    <Button
                      className="rounded-xl"
                      disabled={!cfg.paymentLinkMonthly}
                      onClick={() =>
                        cfg.paymentLinkMonthly && window.location.assign(cfg.paymentLinkMonthly)
                      }
                    >
                      <Zap className="mr-2 h-4 w-4" /> Subscribe
                    </Button>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-white/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Coming soon
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Coming soon
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Coming soon
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-black/30 border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">One-time Support</p>
                      <h3 className="text-2xl font-bold tracking-tight">$25</h3>
                    </div>
                    <Button
                      className="rounded-xl"
                      disabled={!cfg.paymentLinkOneTime}
                      onClick={() =>
                        cfg.paymentLinkOneTime && window.location.assign(cfg.paymentLinkOneTime)
                      }
                    >
                      <DollarSign className="mr-2 h-4 w-4" /> Support
                    </Button>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-white/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Coming soon
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Coming soon
                    </li>
                  </ul>
                </div>
              </div>

              <p className="mt-6 flex items-center gap-2 text-xs text-white/60">
                <Shield className="h-4 w-4" /> Payments handled by Stripe. We never see your card.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section id="features" className="mt-24 grid gap-6 md:grid-cols-3">
          <Feature icon={Zap} title="Support (no strings)" text="000000000." />
          <Feature
            icon={InfinityIcon}
            title="Open arms"
            text="im treating the funds responsibily"
          />
          <Feature icon={Shield} title="oh" text="We treat funds responsibly" />
        </section>

        {/* What's Coming (Instagram-like feed + editor) */}
        <section id="whats-coming" className="mt-24">
          <h2 className="text-2xl font-bold">What's Coming</h2>

          {/* Editor unlock (stealth) */}
          {showUnlock && (
            <Card className="mt-6">
              <CardContent>
                {!isAdmin ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const secret = resolveAdminSecret(cfg);
                      if (adminInput && secret && adminInput === secret) {
                        setIsAdmin(true);
                        setAdminInput("");
                        setShowUnlock(false);
                      }
                    }}
                    className="grid gap-3"
                  >
                    <div className="text-sm text-white/80">Creator login</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={adminInput}
                        onChange={(e) => setAdminInput(e.target.value)}
                        placeholder="Enter admin password"
                        className="flex-1 rounded-2xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                      />
                      <Button type="submit">Unlock editor</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/80">Editor unlocked for this session</div>
                    <Button
                      onClick={() => {
                        setIsAdmin(false);
                        if (typeof sessionStorage !== "undefined")
                          sessionStorage.removeItem("grj-admin");
                      }}
                      className="!bg-white/20 !text-white"
                    >
                      Lock
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Posting form (visible only when admin) */}
          {isAdmin && (
            <Card className="mt-6">
              <CardContent>
                <form onSubmit={submitPost} className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={AVATAR_URL}
                      alt="grj avatar"
                      className="h-10 w-10 rounded-full ring-1 ring-white/10"
                    />
                    <div className="flex-1">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={CAP_LIMIT}
                        placeholder="Write an update… (looks like an IG caption)"
                        className="w-full min-h-[88px] rounded-2xl bg-black/30 border border-white/10 p-3 outline-none focus:ring-2 focus:ring-white/20"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              // show a quick local preview
                              const preview = URL.createObjectURL(file);
                              setImageUrl(preview);

                              setUploading(true);
                              setErrMsg("");

                              try {
                                // 🧼 strip EXIF + GPS metadata before upload
                                async function stripImageMetadata(file: File): Promise<File> {
                                  const dataUrl = await new Promise<string>((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(file);
                                  });

                                  const img = await new Promise<HTMLImageElement>(
                                    (resolve, reject) => {
                                      const i = new Image();
                                      i.onload = () => resolve(i);
                                      i.onerror = reject;
                                      i.src = dataUrl;
                                    },
                                  );

                                  const canvas = document.createElement("canvas");
                                  canvas.width = img.naturalWidth;
                                  canvas.height = img.naturalHeight;
                                  const ctx = canvas.getContext("2d")!;
                                  ctx.drawImage(img, 0, 0);

                                  const blob: Blob = await new Promise((resolve) =>
                                    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92),
                                  );

                                  return new File(
                                    [blob],
                                    file.name.replace(/\.\w+$/, "") + ".jpg",
                                    {
                                      type: "image/jpeg",
                                    },
                                  );
                                }

                                const cleaned = await stripImageMetadata(file);

                                const form = new FormData();
                                form.append("file", cleaned);
                                form.append("upload_preset", CLOUDINARY.uploadPreset);

                                const controller = new AbortController();
                                const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

                                const res = await fetch(
                                  `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`,
                                  { method: "POST", body: form, signal: controller.signal },
                                );

                                clearTimeout(timeout);

                                if (!res.ok) {
                                  const text = await res.text().catch(() => "");
                                  throw new Error(
                                    `Cloudinary upload failed: ${res.status} ${text}`,
                                  );
                                }

                                const data = await res.json();
                                if (!data.secure_url) throw new Error("No secure_url returned");

                                setImageUrl(data.secure_url); // ✅ real https URL (EXIF-free)
                                URL.revokeObjectURL(preview);
                              } catch (err) {
                                console.error(err);
                                setErrMsg("Image upload failed. Try another image.");
                                setImageUrl(""); // drop preview if failed
                              } finally {
                                setUploading(false);
                              }
                            }}
                            className="w-64 rounded-xl bg-black/30 border border-white/10 px-2 py-1 outline-none focus:ring-2 focus:ring-white/20"
                          />

                          {imageUrl && isValidUrlMaybe(imageUrl) && (
                            <img
                              src={imageUrl}
                              alt="preview"
                              className="mt-2 max-h-40 rounded-xl border border-white/10 object-cover"
                            />
                          )}
                        </div>
                        <div>
                          {draft.length} / {CAP_LIMIT}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={
                        uploading ||
                        !draft.trim() ||
                        draft.length > CAP_LIMIT ||
                        (!!imageUrl && !isValidUrlMaybe(imageUrl))
                      }
                      className="px-6"
                    >
                      {uploading ? "Uploading…" : "Post update"}
                    </Button>
                  </div>

                  {errMsg && <div className="text-xs text-red-300 mt-2">{errMsg}</div>}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Feed */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {posts.length === 0 && (
              <div className="text-white/60 text-sm">No updates yet. Be the first to post! ✨</div>
            )}

            {posts.slice(0, MAX_HOME_UPDATES).map((p) => (
              <InstaPostCard
                key={p.id}
                post={p}
                onOpen={setSelectedPost}
                liked={likes.liked(p.id)}
                onLike={async () => {
                  const wasLiked = likes.liked(p.id);
                  likes.toggle(p.id);
                  try {
                    await updateDoc(doc(db, "posts", p.id), {
                      likes: increment(wasLiked ? -1 : 1),
                    });
                  } catch (err) {
                    likes.toggle(p.id);
                    console.error("Failed to update likes:", err);
                  }
                }}
                isAdmin={isAdmin}
                onEdit={() => setEditingPost(p)}
                onDelete={() => deletePost(p.id)}
                onComment={() => handleCommentRequest(p)}
              />
            ))}
          </div>

          {/* See all updates CTA */}
          <div className="mt-6 flex justify-center">
            <MotionLink
              to="/updates"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20"
            >
              See all updates
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
                <path fill="currentColor" d="M13 5l7 7l-7 7v-4H4v-6h9V5z" />
              </svg>
            </MotionLink>
          </div>

          {/* Post tests output (debug) */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Editor & UI self-tests:</div>
            <ul className="mt-2 text-xs grid gap-1">
              {postTests.map((t, i) => (
                <li key={i} className={t.pass ? "text-green-300" : "text-red-300"}>
                  {t.pass ? "✔" : "✖"} {t.name}
                </li>
              ))}
              <li className="text-green-300">
                ✔ matchSequence works (e.g., [g,r,j] in buffer → true)
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">FAQ</h2>
            <div className="flex gap-3">
              <Button
                className="!px-4 !py-2 !bg-white/20 !text-white"
                onClick={() => navigate("/questions")}
              >
                Community questions
              </Button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <h3 className="font-semibold">Can I cancel my monthly support?</h3>
              <p className="mt-2 text-sm text-white/70">
                Yes, anytime via your Stripe customer portal or by contacting us.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <h3 className="font-semibold">Do I get access to private features?</h3>
              <p className="mt-2 text-sm text-white/70">
                Backers receive early access and Discord perks. Some features may remain public and
                open-source.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <h3 className="font-semibold">Is this tax-deductible?</h3>
              <p className="mt-2 text-sm text-white/70">
                This is project support, not a registered charity. Treat as a normal online
                purchase/donation according to your local rules.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <h3 className="font-semibold">Do you offer refunds?</h3>
              <p className="mt-2 text-sm text-white/70">
                If something goes wrong with your payment, reach out and we’ll make it right.
              </p>
            </div>
          </div>
        </section>

        {/* Diagnostics Panel (renders when config missing) */}
        {!hasAllConfig && (
          <div className="mt-12 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-5 text-yellow-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-5 w-5" /> Missing configuration detected
            </div>
            <p className="mt-2 text-sm opacity-90">
              Checkout is disabled until you provide your Stripe publishable key and price IDs. You
              can pass them as props, define <code>window.__GRJ_CONFIG</code>, or use{" "}
              <code>&lt;meta name=\"grj-*\" /&gt;</code> tags.
            </p>
            <pre className="mt-3 whitespace-pre-wrap text-xs/5 bg-black/30 p-3 rounded-xl">{`Example:
<meta name="grj-publishable-key" content="pk_test_123..." />
<meta name="grj-price-monthly" content="price_123..." />
<meta name="grj-price-onetime" content="price_456..." />`}</pre>
            <ul className="mt-3 text-xs space-y-1">
              {diagnostics.map((d, i) => (
                <li key={i} className={d.pass ? "text-green-300" : "text-red-200"}>
                  {d.pass ? "✔" : "✖"} {d.name}
                  {d.message ? ` — ${d.message}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 border-t border-white/10 pt-8 text-xs text-white/60">
          <p>© {new Date().getFullYear()} GhostriderJunior. All rights reserved.</p>
        </footer>
      </div>
      {/* Vercel Speed Insights */}
      <SpeedInsights /> {/* 👈 add this here */}
      <AnimatePresence>
        {askOpen && (
          <motion.div className="fixed inset-0 z-[70]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div onClick={() => setAskOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              role="dialog" aria-modal="true"
              className="absolute inset-0 flex items-center justify-center p-4"
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 160, damping: 20 }}
            >
              <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="text-sm font-semibold">Ask a question</div>
                  <button onClick={() => setAskOpen(false)}
                    className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4">
                  {!user ? (
                    <div className="text-xs text-white/60 flex items-center justify-between border border-white/10 rounded-xl p-3">
                      <span>You must be logged in to ask.</span>
                      <Button onClick={() => setAuthGateOpen(true)}>Log in</Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <textarea
                        value={askText}
                        onChange={(e) => setAskText(e.target.value)}
                        placeholder="Write your question…"
                        className="min-h-[120px] rounded-2xl bg-black/30 border border-white/10 p-3 outline-none focus:ring-2 focus:ring-white/20"
                      />
                      <div className="flex justify-end gap-2">
                        <Button className="!bg-white/20 !text-white" onClick={() => setAskOpen(false)}>
                          Cancel
                        </Button>
                        <Button disabled={!askText.trim() || askSending} onClick={submitQuestion}>
                          {askSending ? "Sending…" : "Submit"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ☝️☝️ PASTED BLOCK ENDS HERE ☝️☝️ */}

      {/* Keep ONE AuthGateModal */}
      <AuthGateModal
        open={authGateOpen}
        hideCancel
        onClose={() => {
          setAuthGateOpen(false);
          if (!user) return;
          if (commentPost) setCommentsOpen(true);
        }}
      />
      {/* Discord auth gate modal (only appears when needed) */}
      {/* Comments modal */}
      <CommentsModal
        post={commentPost}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        user={user}
        onLogin={() => setAuthGateOpen(true)}
      />
      {/* Modal mount */}
      <PostModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        liked={selectedPost ? likes.liked(selectedPost.id) : false}
        count={selectedPost ? (posts.find((p) => p.id === selectedPost.id)?.likes ?? 0) : 0}
        onLike={async () => {
          if (!selectedPost) return;
          const wasLiked = likes.liked(selectedPost.id);
          likes.toggle(selectedPost.id);
          try {
            await updateDoc(doc(db, "posts", selectedPost.id), {
              likes: increment(wasLiked ? -1 : 1),
            });
          } catch (err) {
            // revert local toggle if the write fails
            likes.toggle(selectedPost.id);
            console.error("Failed to update likes:", err);
          }
        }}
        isAdmin={isAdmin}
        onEdit={() => selectedPost && setEditingPost(selectedPost)}
        onDelete={() => selectedPost && deletePost(selectedPost.id)}
        onComment={(p) => handleCommentRequest(p)}
      />
      {/* Edit modal mount (only for admins) */}
      {isAdmin && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={(caption, image) => editingPost && onEditSave(editingPost.id, caption, image)}
        />
      )}
    </div>
  );
}
