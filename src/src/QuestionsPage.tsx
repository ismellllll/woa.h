import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useAuthUser, AuthGateModal } from "./auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { X, Search, Plus, Send } from "lucide-react";

type Question = {
  id: string;
  text: string;
  createdAt: number;
  userId: string;
  userName?: string;
  userAvatar?: string;
  status?: "open" | "answered" | "hidden";
  answer?: string | null;
  answeredBy?: string | null;
  answeredAt?: number | null;
};

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
    className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-white/90 transition ${className}`}
  >
    {children}
  </motion.button>
);

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
        active
          ? "bg-white text-black border-white"
          : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function QuestionsPage() {
  const auth = typeof useAuthUser === "function" ? useAuthUser() : null;
  const user = auth?.user ?? null;

  // matches your stealth-admin unlock
  const isAdmin = useMemo(() => sessionStorage.getItem("grj-admin") === "true", []);

  const [authGateOpen, setAuthGateOpen] = useState(false);

  const [rows, setRows] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // ask modal
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState("");
  const [askSending, setAskSending] = useState(false);

  // reply modal
  const [replyOpen, setReplyOpen] = useState<null | Question>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  // filters / search
  const [filter, setFilter] = useState<"all" | "open" | "answered">("all");
  const [qtext, setQtext] = useState("");

  // live updates
  useEffect(() => {
    const qRef = query(collection(db, "questions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qRef, (snap) => {
      const list: Question[] = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          id: d.id,
          text: x.text || "",
          createdAt: x.createdAt?.toMillis?.() ?? Date.now(),
          userId: x.userId || "",
          userName: x.userName || "anonymous",
          userAvatar: x.userAvatar || "",
          status: x.status || (x.answer ? "answered" : "open"),
          answer: x.answer ?? null,
          answeredBy: x.answeredBy ?? null,
          answeredAt: x.answeredAt?.toMillis?.() ?? null,
        };
      });
      setRows(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openReply = (q: Question) => {
    if (!isAdmin) return;
    setReplyOpen(q);
    setAnswerText(q.answer || "");
  };

  const saveReply = async () => {
    if (!replyOpen) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "questions", replyOpen.id), {
        answer: answerText.trim() || null,
        status: answerText.trim() ? "answered" : "open",
        answeredBy: user?.displayName || "admin",
        answeredAt: serverTimestamp(),
      });
      setReplyOpen(null);
      setAnswerText("");
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (id: string) => {
    if (!isAdmin) return;
    await deleteDoc(doc(db, "questions", id));
  };

  const ask = useCallback(async () => {
    const txt = askText.trim();
    if (!txt) return;
    if (!user) {
      setAskOpen(false);
      setAuthGateOpen(true);
      return;
    }
    setAskSending(true);
    try {
      await addDoc(collection(db, "questions"), {
        text: txt,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || "discord user",
        userAvatar: user.photoURL || null,
        status: "open",
      });
      setAskText("");
      setAskOpen(false);
    } finally {
      setAskSending(false);
    }
  }, [askText, user]);

  const visible = rows
    .filter((r) => (filter === "all" ? true : r.status === filter))
    .filter((r) =>
      qtext.trim()
        ? (r.text + " " + (r.answer || "") + " " + (r.userName || "")).toLowerCase().includes(qtext.toLowerCase())
        : true,
    );

  return (
    <div className="relative min-h-screen text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827] via-[#0a0a0a] to-black overflow-hidden">
      {/* soft moving orbs for premium vibe */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4, x: [0, 20, -10, 0], y: [0, -10, 20, 0] }}
          transition={{ repeat: Infinity, duration: 22 }}
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-indigo-500/25"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35, x: [0, -12, 15, 0], y: [0, 16, -12, 0] }}
          transition={{ repeat: Infinity, duration: 26 }}
          className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full blur-3xl bg-fuchsia-500/20"
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur hover:bg-white/20"
          >
            ← Back
          </Link>
          <motion.h1
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            className="text-xl font-bold tracking-tight"
          >
            Community questions
          </motion.h1>
          <Button className="!px-3 !py-2" onClick={() => setAskOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ask a question
          </Button>
        </div>

        {/* Filters & search */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          <Chip active={filter === "open"} onClick={() => setFilter("open")}>Open</Chip>
          <Chip active={filter === "answered"} onClick={() => setFilter("answered")}>Answered</Chip>

          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              placeholder="Search..."
              className="rounded-2xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>

        {/* Empty state */}
        {!loading && visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70"
          >
            No questions yet. Be the first!
          </motion.div>
        )}

        {/* List */}
        <LayoutGroup>
          <div className="mt-8 grid gap-4">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  layout
                  className="h-28 rounded-3xl border border-white/10 bg-white/5 overflow-hidden"
                >
                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]" />
                </motion.div>
              ))}

            <AnimatePresence initial={false}>
              {!loading &&
                visible.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.995 }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          {q.userAvatar ? (
                            <img
                              src={q.userAvatar}
                              alt=""
                              className="h-6 w-6 rounded-full border border-white/10"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-white/10" />
                          )}
                          <span className="font-semibold text-white/80">{q.userName}</span>
                          <span>• {new Date(q.createdAt).toLocaleString()}</span>
                          {q.status === "answered" && (
                            <span className="ml-2 rounded-full bg-white/15 px-2 py-[2px] text-[10px]">
                              answered
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-sm">{q.text}</div>

                        {q.answer && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm"
                          >
                            <div className="text-xs text-white/60 mb-1">
                              Answered by {q.answeredBy || "admin"}
                              {q.answeredAt ? ` • ${new Date(q.answeredAt).toLocaleString()}` : ""}
                            </div>
                            <div>{q.answer}</div>
                          </motion.div>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex flex-col gap-2">
                          <Button className="!px-3 !py-2" onClick={() => openReply(q)}>
                            {q.answer ? "Edit reply" : "Reply"}
                          </Button>
                          <Button
                            className="!px-3 !py-2 !bg-white/10 !text-white"
                            onClick={() => removeQuestion(q.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </div>

      {/* Auth gate */}
      <AuthGateModal open={authGateOpen} onClose={() => setAuthGateOpen(false)} />

      {/* Ask modal (in-page) */}
      <AnimatePresence>
        {askOpen && (
          <motion.div
            className="fixed inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={() => setAskOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
              <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="text-sm font-semibold">Ask a question</div>
                  <button
                    onClick={() => setAskOpen(false)}
                    className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  >
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
                        <Button disabled={!askText.trim() || askSending} onClick={ask}>
                          {askSending ? "Sending…" : (<span className="inline-flex items-center"><Send className="h-4 w-4 mr-1" />Submit</span>)}
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

      {/* Reply modal (admin) */}
      <AnimatePresence>
        {replyOpen && (
          <motion.div
            className="fixed inset-0 z-[72]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={() => setReplyOpen(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
              <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="text-sm font-semibold">Reply to question</div>
                  <button
                    onClick={() => setReplyOpen(null)}
                    className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4">
                  {!isAdmin ? (
                    <div className="text-xs text-white/70">Admin only.</div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="text-xs text-white/60">Question</div>
                      <div className="rounded-2xl bg-black/30 border border-white/10 p-3 text-sm">
                        {replyOpen.text}
                      </div>
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your reply…"
                        className="min-h-[120px] rounded-2xl bg-black/30 border border-white/10 p-3 outline-none focus:ring-2 focus:ring-white/20"
                      />
                      <div className="flex justify-end gap-2">
                        <Button className="!bg-white/20 !text-white" onClick={() => setReplyOpen(null)}>
                          Cancel
                        </Button>
                        <Button disabled={saving} onClick={saveReply}>
                          {saving ? "Saving…" : "Save reply"}
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
    </div>
  );
}
