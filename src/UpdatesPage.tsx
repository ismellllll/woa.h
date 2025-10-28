import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthUser, AuthGateModal } from "./auth";
import {
  collection,
  doc,
  getDocs,
  increment,
  limit as fsLimit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { InstaPostCard, PostModal, CommentsModal } from "./App"; // reusing your components

export type ComingPost = {
  id: string;
  caption: string;
  imageUrl?: string;
  createdAt: number;
  likes?: number;
  commentsCount?: number;
};

function useLikes() {
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("grj-liked-posts") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("grj-liked-posts", JSON.stringify(likedMap));
    } catch {}
  }, [likedMap]);

  const liked = (id: string) => !!likedMap[id];
  const toggle = (id: string) => setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  return { liked, toggle };
}

function usePagedPosts(pageSize = 10) {
  const [posts, setPosts] = useState<ComingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<any>(null);

  const load = useCallback(
    async (initial = false) => {
      if (initial) setLoading(true);
      else setLoadingMore(true);
      try {
        const q = cursorRef.current
          ? query(
              collection(db, "posts"),
              orderBy("createdAt", "desc"),
              startAfter(cursorRef.current),
              fsLimit(pageSize),
            )
          : query(collection(db, "posts"), orderBy("createdAt", "desc"), fsLimit(pageSize));

        const snap = await getDocs(q);
        const batch = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            caption: data.caption,
            imageUrl: data.imageUrl || undefined,
            createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
            likes: data.likes ?? 0,
            commentsCount: data.commentsCount ?? 0,
          } as ComingPost;
        });

        if (initial) {
          setPosts(batch);
        } else {
          setPosts((prev) => [...prev, ...batch]);
        }

        if (snap.docs.length < pageSize) {
          setHasMore(false);
        } else {
          cursorRef.current = snap.docs[snap.docs.length - 1];
        }
      } finally {
        if (initial) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  const bumpLike = useCallback((id: string, delta: 1 | -1) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: Math.max(0, (p.likes ?? 0) + delta) } : p)),
    );
  }, []);

  return { posts, loading, hasMore, loadingMore, loadMore: () => load(false), bumpLike };
}

function SkeletonCard() {
  return (
    <motion.div
      className="rounded-3xl border border-white/10 bg-white/5 h-[360px] animate-pulse"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    />
  );
}

export default function UpdatesPage() {
  const { posts, loading, hasMore, loadingMore, loadMore, bumpLike } = usePagedPosts(10);
  const likes = useLikes();
  const [selectedPost, setSelectedPost] = useState<ComingPost | null>(null);
  const auth = typeof useAuthUser === "function" ? useAuthUser() : null;
  const user = auth?.user ?? null;

  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentPost, setCommentPost] = useState<ComingPost | null>(null);

  const openComments = (post: ComingPost) => {
    setCommentPost(post);
    // if you want to force login before commenting, open the gate if no user:
    if (!user) setAuthGateOpen(true);
    else setCommentsOpen(true);
  };

  // Auto-load more when scroller hits sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  return (
    <div className="relative min-h-screen text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827] via-[#0a0a0a] to-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur hover:bg-white/20"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold tracking-tight">All updates</h1>
          <div className="opacity-0 pointer-events-none">spacer</div>
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

          {!loading &&
            posts.map((p) => (
              <InstaPostCard
                key={p.id}
                post={p}
                liked={likes.liked(p.id)}
                count={p.likes ?? 0}
                onLike={async () => {
                  const wasLiked = likes.liked(p.id);
                  const delta: 1 | -1 = wasLiked ? -1 : 1;

                  // optimistic UI
                  likes.toggle(p.id);
                  bumpLike(p.id, delta);

                  try {
                    await updateDoc(doc(db, "posts", p.id), { likes: increment(delta) });
                  } catch (err) {
                    // rollback on failure
                    console.error("Failed to update likes:", err);
                    likes.toggle(p.id);
                    bumpLike(p.id, delta === 1 ? -1 : 1);
                  }
                }}
                onOpen={setSelectedPost}
                isAdmin={false}
                onEdit={() => {}}
                onDelete={() => {}}
                onComment={(post) => {
                  setCommentPost(post);
                  setCommentsOpen(true);
                }}
              />
            ))}
        </div>

        {/* Load more */}
        <div className="mt-8 flex justify-center">
          <AnimatePresence>
            {hasMore && !loading && (
              <motion.button
                onClick={loadMore}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Sentinel for auto-load */}
        <div ref={sentinelRef} className="h-10" />

        {/* Discord auth gate (opens when someone tries to comment while logged out) */}
        <AuthGateModal
          open={authGateOpen}
          hideCancel
          onClose={() => {
            setAuthGateOpen(false);
            // if user successfully logged in via the modal, proceed to comments
            if (user && commentPost) setCommentsOpen(true);
          }}
        />

        {/* Comments modal */}
        <CommentsModal
          post={commentPost}
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          user={user}
          onLogin={() => setAuthGateOpen(true)} // shows the Discord login popup
        />

        {/* Modal */}
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          liked={selectedPost ? likes.liked(selectedPost.id) : false}
          count={selectedPost ? (posts.find((p) => p.id === selectedPost.id)?.likes ?? 0) : 0}
          onComment={(p) => p && openComments(p)}
          onLike={async () => {
            if (!selectedPost) return;
            const wasLiked = likes.liked(selectedPost.id);
            const delta: 1 | -1 = wasLiked ? -1 : 1;
            likes.toggle(selectedPost.id);
            bumpLike(selectedPost.id, delta); // ✅ optimistic
            try {
              await updateDoc(doc(db, "posts", selectedPost.id), { likes: increment(delta) });
            } catch (err) {
              likes.toggle(selectedPost.id);
              bumpLike(selectedPost.id, delta === 1 ? -1 : 1);
              console.error("Failed to update likes:", err);
            }
          }}
        />
      </div>
    </div>
  );
}
