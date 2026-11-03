import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseFirestore";
import { auth, signInAnonymously } from "../../firebaseAuth";
import type { SharePost } from "../../types";
import { blockCommunityMember } from "./blocking";

type Reaction = "yellow" | "green" | "red";
type Translator = (key: string) => string;

export function filterBlockedCommunityPosts<T extends { authorId: string }>(
  posts: T[],
  blockedUserIds: ReadonlySet<string>,
): T[] {
  if (blockedUserIds.size === 0) return posts;
  return posts.filter(post => !blockedUserIds.has(post.authorId));
}

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Normalize untrusted Firestore fields before they reach React components. */
export function normalizeCommunityPost(
  id: string,
  value: unknown,
  userId: string,
  justNow: string,
): SharePost | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (typeof data.message !== "string" || !data.message.trim()) return null;

  const createdAt = data.createdAt;
  let timestamp = justNow;
  let createdAtMs = 0;
  if (createdAt && typeof createdAt === "object") {
    const dateValue = createdAt as { toDate?: () => Date; toMillis?: () => number };
    try {
      const date = typeof dateValue.toDate === "function" ? dateValue.toDate() : null;
      if (date instanceof Date && Number.isFinite(date.getTime())) {
        timestamp = date.toLocaleString("pt-PT");
      }
      if (typeof dateValue.toMillis === "function") {
        createdAtMs = finiteNumber(dateValue.toMillis());
      }
    } catch {
      // A malformed legacy timestamp must not break the whole feed.
    }
  }

  const stringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  const supportMode = ["share", "other_side", "seeking_match", "give_back", "poll"].includes(String(data.supportMode))
    ? data.supportMode as SharePost["supportMode"]
    : undefined;
  const reaction: Reaction | undefined =
    stringArray(data.yellowLikedBy).includes(userId) ? "yellow" :
    stringArray(data.greenLikedBy).includes(userId) ? "green" :
    stringArray(data.redLikedBy).includes(userId) ? "red" : undefined;

  return {
    id,
    authorId: typeof data.authorId === "string" ? data.authorId : "",
    userName: typeof data.userName === "string" && data.userName.trim() ? data.userName : "Guardião Anon",
    feeling: typeof data.feeling === "string" && data.feeling.trim() ? data.feeling : "Calmo",
    topic: typeof data.topic === "string" ? data.topic : undefined,
    message: data.message,
    timestamp,
    createdAtMs,
    experienceTag: typeof data.experienceTag === "string" ? data.experienceTag : undefined,
    supportMode,
    circleExpiresAt: typeof data.circleExpiresAt === "number" && Number.isFinite(data.circleExpiresAt) ? data.circleExpiresAt : undefined,
    yellowLikes: finiteNumber(data.yellowLikes),
    greenLikes: finiteNumber(data.greenLikes),
    redLikes: finiteNumber(data.redLikes),
    yellowLikedBy: stringArray(data.yellowLikedBy),
    greenLikedBy: stringArray(data.greenLikedBy),
    redLikedBy: stringArray(data.redLikedBy),
    userReaction: reaction,
  };
}

export function subscribeToCommunityPosts(
  setPosts: (posts: SharePost[]) => void,
  t: Translator,
) {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error("Não foi possível iniciar o feed sem autenticação.");
    setPosts([]);
    return () => undefined;
  }

  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  let latestPosts: SharePost[] = [];
  let blockedUserIds = new Set<string>();
  let outgoingBlocks: string[] = [];
  let incomingBlocks: string[] = [];
  let outgoingBlocksReady = false;
  let incomingBlocksReady = false;
  let postsReady = false;

  const publishVisiblePosts = () => {
    // Fail closed until the block list has loaded: never briefly show a
    // blocked author's posts while the two Firestore listeners start.
    if (!outgoingBlocksReady || !incomingBlocksReady || !postsReady) return;
    setPosts(filterBlockedCommunityPosts(latestPosts, blockedUserIds));
  };

  const unsubscribePosts = onSnapshot(
    postsQuery,
    snapshot => {
      latestPosts = snapshot.docs
        .map(postDoc => normalizeCommunityPost(postDoc.id, postDoc.data(), userId, t("justNow")))
        .filter((post): post is SharePost => post !== null);
      postsReady = true;
      publishVisiblePosts();
    },
    error => console.error("Erro ao ouvir comunidade:", error),
  );

  const unsubscribeOutgoingBlocks = onSnapshot(
    query(collection(db, "blocks"), where("blockerId", "==", userId)),
    snapshot => {
      outgoingBlocks = snapshot.docs.map(item => item.data().blockedUserId)
        .filter((value): value is string => typeof value === "string");
      blockedUserIds = new Set([...outgoingBlocks, ...incomingBlocks]);
      outgoingBlocksReady = true;
      publishVisiblePosts();
    },
    error => {
      outgoingBlocksReady = false;
      console.error("Erro ao carregar bloqueios efetuados:", error);
      setPosts([]);
    },
  );
  const unsubscribeIncomingBlocks = onSnapshot(
    query(collection(db, "blocks"), where("blockedUserId", "==", userId)),
    snapshot => {
      incomingBlocks = snapshot.docs.map(item => item.data().blockerId)
        .filter((value): value is string => typeof value === "string");
      blockedUserIds = new Set([...outgoingBlocks, ...incomingBlocks]);
      incomingBlocksReady = true;
      publishVisiblePosts();
    },
    error => {
      incomingBlocksReady = false;
      console.error("Erro ao carregar bloqueios recebidos:", error);
      setPosts([]);
    },
  );

  return () => {
    unsubscribePosts();
    unsubscribeOutgoingBlocks();
    unsubscribeIncomingBlocks();
  };
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
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function blockCommunityUser(blockedUserId: string) {
  await blockCommunityMember(blockedUserId);
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
