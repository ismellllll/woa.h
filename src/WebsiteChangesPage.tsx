import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, MoreHorizontal } from "lucide-react";
import { db } from "./firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp
} from "firebase/firestore";

type ChangeDoc = {
  id: string;
  date: number;          // epoch ms (displayed as YYYY.MM.DD)
  title: string;
  items: string[];       // bullet points
  note?: string | null;  // small text
  createdAt: number;
};

const Button = ({
  className = "", disabled, onClick, children, type,
}: React.PropsWithChildren<{ className?: string; disabled?: boolean; onClick?: () => void; type?: "button"|"submit" }>) => (
  <motion.button
    type={type || "button"}
    whileTap={{ scale: 0.97 }} whileHover={!disabled ? { y: -1 } : undefined}
    disabled={disabled} onClick={onClick}
    className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-white/90 transition ${className}`}
  >
    {children}
  </motion.button>
);

const Pill = ({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-xs font-semibold border transition ${
      active ? "bg-white text-black border-white/0" : "bg-white/5 text-white/90 border-white/10 hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

export default function WebsiteChangesPage() {
  const isAdmin = useMemo(() => sessionStorage.getItem("grj-admin") === "true", []);
  const [rows, setRows] = useState<ChangeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // editor state
  const [openEditor, setOpenEditor] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [title, setTitle] = useState("");
  const [changes, setChanges] = useState(""); // each line = 1.,2.,…
  const [note, setNote] = useState("");

  // filter state
  const [activeKey, setActiveKey] = useState<"latest" | string>("latest"); // "latest" or YYYY.MM.DD

  useEffect(() => {
    const q = query(collection(db, "changelog"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: ChangeDoc[] = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          id: d.id,
          date: x.date?.toMillis?.() ?? x.date ?? Date.now(),
          title: x.title || "",
          items: Array.isArray(x.items) ? x.items : [],
          note: x.note || null,
          createdAt: x.createdAt?.toMillis?.() ?? Date.now(),
        };
      });
      setRows(list);
      setLoading(false);
      if (list.length && activeKey === "latest") {
        // keep "latest" selected; nothing else to do
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateKey = (ms: number) => {
    const d = new Date(ms);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}.${mm}.${dd}`;
  };

  const dateChips = useMemo(() => {
    const keys = Array.from(new Set(rows.map((r) => dateKey(r.date))));
    return keys;
  }, [rows]);

  const visible = useMemo(() => {
    if (activeKey === "latest") return rows[0] ? [rows[0]] : [];
    return rows.filter((r) => dateKey(r.date) === activeKey);
  }, [rows, activeKey]);

  const openCreate = () => {
    if (!isAdmin) return;
    setEditingId(null);
    setTitle("");
    setChanges("");
    setNote("");
    setOpenEditor(true);
  };

  const openEdit = (r: ChangeDoc) => {
    if (!isAdmin) return;
    setEditingId(r.id);
    setTitle(r.title);
    setChanges(r.items.join("\n"));
    setNote(r.note || "");
    setOpenEditor(true);
  };

  const save = async () => {
    const items = changes
      .split("\n")
      .map((l) => l.trim().replace(/^\d+\.\s*/, "")) // strip leading "1. ", "2. "
      .filter(Boolean);

    if (!title.trim() || items.length === 0) return;

    if (editingId) {
      await updateDoc(doc(db, "changelog", editingId), {
        title: title.trim(),
        items,
        note: note.trim() || null,
      });
    } else {
      await addDoc(collection(db, "changelog"), {
        title: title.trim(),
        items,
        note: note.trim() || null,
        date: serverTimestamp(),      // “today” for the chip
        createdAt: serverTimestamp(),
      });
    }
    setOpenEditor(false);
  };

  const remove = async (id: string) => {
    if (!isAdmin) return;
    await deleteDoc(doc(db, "changelog", id));
  };

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827] via-[#0a0a0a] to-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <Link to="/" className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur hover:bg-white/20">
            ← Back
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Website updates</h1>
          {isAdmin ? (
            <Button className="!px-3 !py-2" onClick={openCreate}>New entry</Button>
          ) : (
            <div className="opacity-0 pointer-events-none">spacer</div>
          )}
        </div>

        {/* chips */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Pill active={activeKey === "latest"} onClick={() => setActiveKey("latest")}>Latest</Pill>
          {dateChips.map((k) => (
            <Pill key={k} active={activeKey === k} onClick={() => setActiveKey(k)}>
              {k}
            </Pill>
          ))}
        </div>

        {/* list */}
        <div className="mt-8 grid gap-4">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
          ))}

          {!loading && visible.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              No updates yet.
            </div>
          )}

          <AnimatePresence>
            {visible.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-white/60">{dateKey(r.date)}</div>
                    <h3 className="mt-1 text-lg font-semibold">{r.title}</h3>
                    <ul className="mt-3 space-y-2 text-sm list-disc list-inside marker:text-white/60">
                      {r.items.map((it, i) => (
                        <li key={i} className="leading-relaxed">{it}</li>
                      ))}
                    </ul>
                    {r.note && (
                      <div className="mt-3 text-xs text-white/60">{r.note}</div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="relative">
                      <button
                        className="h-8 w-8 grid place-items-center rounded-full bg-black/40 border border-white/10 hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          // simple inline menu
                          const menu = document.getElementById(`menu-${r.id}`);
                          if (menu) menu.classList.toggle("hidden");
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <div id={`menu-${r.id}`} className="hidden absolute right-0 mt-2 rounded-xl border border-white/10 bg-black/80 text-sm shadow-lg backdrop-blur p-1">
                        <button className="px-3 py-2 rounded-lg hover:bg-white/10 w-full text-left" onClick={() => openEdit(r)}>Edit</button>
                        <button className="px-3 py-2 rounded-lg hover:bg-white/10 w-full text-left text-red-300" onClick={() => remove(r.id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* editor modal */}
      <AnimatePresence>
        {openEditor && (
          <motion.div className="fixed inset-0 z-[70]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div onClick={() => setOpenEditor(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
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
                  <div className="text-sm font-semibold">{editingId ? "Edit update" : "New update"}</div>
                  <button onClick={() => setOpenEditor(false)} className="h-8 w-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 grid gap-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <textarea
                    value={changes}
                    onChange={(e) => setChanges(e.target.value)}
                    placeholder={"1. First change\n2. Second change\n3. ..."}
                    className="min-h-[140px] rounded-2xl bg-black/30 border border-white/10 p-3 outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Small text (optional)"
                    className="min-h-[80px] rounded-2xl bg-black/30 border border-white/10 p-3 outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <div className="flex justify-end gap-2">
                    <Button className="!bg-white/20 !text-white" onClick={() => setOpenEditor(false)}>Cancel</Button>
                    <Button onClick={save}>{editingId ? "Save" : "Publish"}</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
