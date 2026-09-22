import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseFirestore";
import { auth, signInAnonymously } from "../../firebaseAuth";
import type { SharePost } from "../../types";

type Reaction = "yellow" | "green" | "red";
type Translator = (key: string) => string;

export function subscribeToCommunityPosts(
  setPosts: (posts: SharePost[]) => void,
  t: Translator,
) {
  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  return onSnapshot(
    postsQuery,
    snapshot => {
      const userId = auth.currentUser?.uid;
      const firestorePosts: SharePost[] = snapshot.docs.map(postDoc => {
        const data = postDoc.data();
        let userReaction: Reaction | undefined;

        if (userId) {
          if (Array.isArray(data.yellowLikedBy) && data.yellowLikedBy.includes(userId)) userReaction = "yellow";
          else if (Array.isArray(data.greenLikedBy) && data.greenLikedBy.includes(userId)) userReaction = "green";
          else if (Array.isArray(data.redLikedBy) && data.redLikedBy.includes(userId)) userReaction = "red";
        }

        const createdAt = data.createdAt;
        const timestamp =
          createdAt && typeof createdAt.toDate === "function"
            ? createdAt.toDate().toLocaleString("pt-PT")
            : t("justNow");

        return {
          id: postDoc.id,
          authorId: data.authorId || "",
          userName: data.userName || "Guardião Anon",
          feeling: data.feeling || "Calmo",
          topic: typeof data.topic === "string" ? data.topic : undefined,
          message: data.message || "",
          timestamp,
          createdAtMs: createdAt && typeof createdAt.toMillis === "function" ? createdAt.toMillis() : 0,
          experienceTag: typeof data.experienceTag === "string" ? data.experienceTag : undefined,
          supportMode: ["share", "other_side", "seeking_match", "give_back", "poll"].includes(data.supportMode) ? data.supportMode as SharePost["supportMode"] : undefined,
          circleExpiresAt: typeof data.circleExpiresAt === "number" ? data.circleExpiresAt : undefined,
          yellowLikes: data.yellowLikes || 0,
          greenLikes: data.greenLikes || 0,
          redLikes: data.redLikes || 0,
          yellowLikedBy: Array.isArray(data.yellowLikedBy) ? data.yellowLikedBy : [],
          greenLikedBy: Array.isArray(data.greenLikedBy) ? data.greenLikedBy : [],
          redLikedBy: Array.isArray(data.redLikedBy) ? data.redLikedBy : [],
          userReaction,
        };
      });

      setPosts(firestorePosts);
    },
    error => console.error("Erro ao ouvir comunidade:", error),
  );
}

async function ensureAuth() {
  if (!auth.currentUser) await signInAnonymously(auth);
  if (!auth.currentUser) throw new Error("Utilizador não autenticado.");
  return auth.currentUser;
}

export async function deleteCommunityPost(id: string) {
  await deleteDoc(doc(db, "posts", id));
}

export async function reportCommunityPost(post: SharePost, reason: string) {
  const user = await ensureAuth();
  await addDoc(collection(db, "reports"), {
    postId: post.id,
    reportedUserId: post.authorId,
    reporterId: user.uid,
    reason,
    createdAt: serverTimestamp(),
  });
}

export async function blockCommunityUser(blockedUserId: string) {
  const user = await ensureAuth();
  if (user.uid === blockedUserId) return;
  await addDoc(collection(db, "blocks"), {
    blockerId: user.uid,
    blockedUserId,
    createdAt: serverTimestamp(),
  });
}

export async function createCommunityPost(feeling: string, topic: string, message: string, options?: { experienceTag?: string; supportMode?: "share" | "other_side" | "seeking_match" | "give_back"; circleExpiresAt?: number }) {
  const user = await ensureAuth();
  const userName = `Guardião Anon_${Math.floor(100 + Math.random() * 900)}`;
  const docRef = await addDoc(collection(db, "posts"), {
    authorId: user.uid,
    userName,
    feeling,
    topic,
    message,
    ...(options?.experienceTag ? { experienceTag: options.experienceTag.slice(0, 80) } : {}),
    ...(options?.supportMode ? { supportMode: options.supportMode } : {}),
    ...(options?.circleExpiresAt ? { circleExpiresAt: options.circleExpiresAt } : {}),
    yellowLikes: 0,
    greenLikes: 0,
    redLikes: 0,
    yellowLikedBy: [],
    greenLikedBy: [],
    redLikedBy: [],
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    authorId: user.uid,
    userName,
    feeling,
    topic,
    message,
    experienceTag: options?.experienceTag,
    supportMode: options?.supportMode,
    circleExpiresAt: options?.circleExpiresAt,
    createdAtMs: Date.now(),
    timestamp: "justNow",
    yellowLikes: 0,
    greenLikes: 0,
    redLikes: 0,
    userReaction: undefined,
  } satisfies SharePost;
}

export async function reactToCommunityPost(
  id: string,
  reaction: Reaction,
  currentReaction?: Reaction,
) {
  const user = await ensureAuth();
  const postRef = doc(db, "posts", id);

  if (currentReaction === reaction) {
    const field =
      reaction === "yellow"
        ? "yellowLikes"
        : reaction === "green"
          ? "greenLikes"
          : "redLikes";

    await updateDoc(postRef, {
      [field]: increment(-1),
      [`${reaction}LikedBy`]: arrayRemove(user.uid),
    });
    return;
  }

  const updates: Record<string, unknown> = {};

  if (currentReaction === "yellow") {
    updates.yellowLikes = increment(-1);
    updates.yellowLikedBy = arrayRemove(user.uid);
  }
  if (currentReaction === "green") {
    updates.greenLikes = increment(-1);
    updates.greenLikedBy = arrayRemove(user.uid);
  }
  if (currentReaction === "red") {
    updates.redLikes = increment(-1);
    updates.redLikedBy = arrayRemove(user.uid);
  }

  const newField =
    reaction === "yellow"
      ? "yellowLikes"
      : reaction === "green"
        ? "greenLikes"
        : "redLikes";

  updates[newField] = increment(1);
  updates[`${reaction}LikedBy`] = arrayUnion(user.uid);
  await updateDoc(postRef, updates);
}
