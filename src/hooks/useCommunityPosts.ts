import { useEffect, useState } from "react";
import type { SharePost } from "../types";
import { INITIAL_POSTS } from "../data/initialPosts";

const STORAGE_KEY = "confia_posts_v2";

function normalizeStoredPosts(value: unknown, fallback: SharePost[]): SharePost[] {
  if (!Array.isArray(value)) return fallback;
  const normalized: SharePost[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const post = item as Record<string, unknown>;
    const id = typeof post.id === "string" ? post.id : "";
    const message = typeof post.message === "string" ? post.message : "";
    if (!id || !message) continue;

    normalized.push({
      id,
      authorId: typeof post.authorId === "string" ? post.authorId : "",
      userName: typeof post.userName === "string" && post.userName.trim() ? post.userName : "Guardião Anon",
      feeling: typeof post.feeling === "string" && post.feeling.trim() ? post.feeling : "Calmo",
      topic: typeof post.topic === "string" ? post.topic : undefined,
      message,
      timestamp: typeof post.timestamp === "string" ? post.timestamp : "",
      createdAtMs: typeof post.createdAtMs === "number" && Number.isFinite(post.createdAtMs) ? post.createdAtMs : 0,
      yellowLikes: typeof post.yellowLikes === "number" && Number.isFinite(post.yellowLikes) ? post.yellowLikes : 0,
      greenLikes: typeof post.greenLikes === "number" && Number.isFinite(post.greenLikes) ? post.greenLikes : 0,
      redLikes: typeof post.redLikes === "number" && Number.isFinite(post.redLikes) ? post.redLikes : 0,
      yellowLikedBy: Array.isArray(post.yellowLikedBy) ? post.yellowLikedBy.filter((id): id is string => typeof id === "string") : [],
      greenLikedBy: Array.isArray(post.greenLikedBy) ? post.greenLikedBy.filter((id): id is string => typeof id === "string") : [],
      redLikedBy: Array.isArray(post.redLikedBy) ? post.redLikedBy.filter((id): id is string => typeof id === "string") : [],
      userReaction: post.userReaction === "yellow" || post.userReaction === "green" || post.userReaction === "red" ? post.userReaction : undefined,
      experienceTag: typeof post.experienceTag === "string" ? post.experienceTag : undefined,
      supportMode: ["share", "other_side", "seeking_match", "give_back", "poll"].includes(String(post.supportMode))
        ? post.supportMode as SharePost["supportMode"]
        : undefined,
      circleExpiresAt: typeof post.circleExpiresAt === "number" ? post.circleExpiresAt : undefined,
    });
  }

  return normalized;
}

function readStoredPosts(fallback: SharePost[]): SharePost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeStoredPosts(JSON.parse(raw), fallback) : fallback;
  } catch {
    return fallback;
  }
}

export function useCommunityPosts(appDataReady: boolean) {
  // Hydrate local feed data as soon as the age gate and app shell are ready.
  // The small static fallback is bundled eagerly, avoiding a second dynamic
  // import when Community is first opened.
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);

  useEffect(() => {
    if (!appDataReady) return;
    setPosts(current => current.length ? current : readStoredPosts(INITIAL_POSTS));
    setPostsLoaded(true);
  }, [appDataReady]);

  return { posts, setPosts, postsLoaded };
}
