import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { auth, signInAnonymously } from "../../firebaseAuth";
import { db } from "../../firebaseFirestore";
import type { SharePost } from "../../types";
import {
  isExperienceMatchingId,
  type ExperienceMatchingId,
  type ExperienceMatchPreference
} from "./experienceMatching";

export interface ExperienceMatchProfile {
  active: boolean;
  activeTags: ExperienceMatchingId[];
  preference: ExperienceMatchPreference;
}

export interface ExperienceMatchRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  postId: string;
  experienceTag: ExperienceMatchingId;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAtMs: number;
}

async function ensureUser() {
  if (!auth.currentUser) await signInAnonymously(auth);
  if (!auth.currentUser) throw new Error("auth");
  return auth.currentUser;
}

export function subscribeExperienceMatchProfile(cb: (profile: ExperienceMatchProfile) => void) {
  let stopDoc: (() => void) | undefined;
  const stopAuth = auth.onAuthStateChanged(user => {
    stopDoc?.();
    if (!user) {
      cb({ active: false, activeTags: [], preference: "either" });
      return;
    }
    stopDoc = onSnapshot(doc(db, "communityMatchProfiles", user.uid), snap => {
      const data = snap.data();
      const activeTags = Array.isArray(data?.activeTags)
        ? data.activeTags.filter(isExperienceMatchingId).slice(0, 3)
        : [];
      cb({
        active: data?.active === true && activeTags.length > 0,
        activeTags,
        preference: ["same_now", "been_there", "either"].includes(data?.preference)
          ? data!.preference
          : "either"
      });
    });
  });
  return () => { stopDoc?.(); stopAuth(); };
}

export async function saveExperienceMatchProfile(profile: ExperienceMatchProfile) {
  const user = await ensureUser();
  const tags = profile.activeTags.filter(isExperienceMatchingId).slice(0, 3);
  await setDoc(doc(db, "communityMatchProfiles", user.uid), {
    ownerId: user.uid,
    active: profile.active && tags.length > 0,
    activeTags: tags,
    preference: profile.preference,
    updatedAt: serverTimestamp()
  }, { merge: true });
}


export function subscribeBlockedUserIds(cb: (ids: string[]) => void) {
  let stopQuery: (() => void) | undefined;
  const stopAuth = auth.onAuthStateChanged(user => {
    stopQuery?.();
    if (!user) { cb([]); return; }
    stopQuery = onSnapshot(
      query(collection(db, "blocks"), where("blockerId", "==", user.uid), limit(100)),
      snap => cb(snap.docs.map(d => d.data().blockedUserId).filter((x): x is string => typeof x === "string"))
    );
  });
  return () => { stopQuery?.(); stopAuth(); };
}

export function subscribeExperienceMatchRequests(cb: (requests: ExperienceMatchRequest[]) => void) {
  let stops: Array<() => void> = [];
  let outgoing: ExperienceMatchRequest[] = [];
  let incoming: ExperienceMatchRequest[] = [];
  const emit = () => {
    const byId = new Map([...outgoing, ...incoming].map(x => [x.id, x]));
    cb([...byId.values()].sort((a,b) => b.createdAtMs - a.createdAtMs));
  };
  const stopAuth = auth.onAuthStateChanged(user => {
    stops.forEach(stop => stop()); stops = []; outgoing = []; incoming = []; emit();
    if (!user) return;
    const mapSnap = (snap: any): ExperienceMatchRequest[] => snap.docs.map((d: any) => {
      const x = d.data();
      return {
        id: d.id,
        requesterId: x.requesterId || "",
        recipientId: x.recipientId || "",
        postId: x.postId || "",
        experienceTag: isExperienceMatchingId(x.experienceTag) ? x.experienceTag : "stress",
        status: ["pending","accepted","declined","cancelled"].includes(x.status) ? x.status : "pending",
        createdAtMs: x.createdAt?.toMillis?.() ?? 0
      };
    });
    stops.push(onSnapshot(query(collection(db, "communityMatchRequests"), where("requesterId","==",user.uid), limit(30)), s => { outgoing = mapSnap(s); emit(); }));
    stops.push(onSnapshot(query(collection(db, "communityMatchRequests"), where("recipientId","==",user.uid), limit(30)), s => { incoming = mapSnap(s); emit(); }));
  });
  return () => { stops.forEach(stop => stop()); stopAuth(); };
}

export async function requestExperienceMatch(post: SharePost, experienceTag: ExperienceMatchingId) {
  const user = await ensureUser();
  if (!post.id || !post.authorId || post.authorId === user.uid || post.experienceTag !== experienceTag) return null;
  const requestId = `${user.uid}_${post.id}`;
  const ref = doc(db, "communityMatchRequests", requestId);
  const existingSnap = await getDoc(ref);
  if (existingSnap.exists()) {
    const x = existingSnap.data();
    return {
      id: existingSnap.id,
      requesterId: x.requesterId,
      recipientId: x.recipientId,
      postId: x.postId,
      experienceTag: x.experienceTag,
      status: x.status,
      createdAtMs: x.createdAt?.toMillis?.() ?? 0
    } as ExperienceMatchRequest;
  }
  await setDoc(ref, {
    requesterId: user.uid,
    recipientId: post.authorId,
    postId: post.id,
    experienceTag,
    status: "pending",
    createdAt: serverTimestamp()
  });
  return { id: ref.id, requesterId:user.uid, recipientId:post.authorId, postId:post.id, experienceTag, status:"pending" as const, createdAtMs:Date.now() };
}

export async function respondToExperienceMatch(request: ExperienceMatchRequest, accept: boolean) {
  const user = await ensureUser();
  if (request.recipientId !== user.uid || request.status !== "pending") return null;
  const ref = doc(db, "communityMatchRequests", request.id);
  await updateDoc(ref, { status: accept ? "accepted" : "declined", respondedAt: serverTimestamp() });
  if (!accept) return null;

  const postSnap = await getDoc(doc(db, "posts", request.postId));
  if (!postSnap.exists() || postSnap.data().authorId !== user.uid) return null;

  const participants = [request.requesterId, request.recipientId].sort();
  const chatId = `match_${request.id}`;
  await setDoc(doc(db, "chats", chatId), {
    participants,
    postId: request.postId,
    authorId: user.uid,
    matchRequestId: request.id,
    createdAt: serverTimestamp(),
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    unreadBy: []
  });
  return chatId;
}
