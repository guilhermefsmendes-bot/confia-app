import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  runTransaction,
  where
} from "firebase/firestore";
import { auth, signInAnonymously } from "../../firebaseAuth";
import { db } from "../../firebaseFirestore";
import type { SharePost } from "../../types";
import { blockCommunityMember } from "./blocking";
import {
  isExperienceMatchingId,
  type ExperienceMatchingId,
  type ExperienceMatchPreference
} from "./experienceMatching";

export type ExperienceConversationMode = "one_to_one" | "group" | "either";

export interface ExperienceMatchProfile {
  active: boolean;
  activeTags: ExperienceMatchingId[];
  preference: ExperienceMatchPreference;
  conversationMode: ExperienceConversationMode;
}

export interface ExperienceMatchCircle {
  id: string;
  experienceTag: ExperienceMatchingId;
  participants: string[];
  capacity: number;
  status: "open" | "full";
  createdAtMs: number;
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
      cb({ active: false, activeTags: [], preference: "either", conversationMode: "either" });
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
          : "either",
        conversationMode: ["one_to_one", "group", "either"].includes(data?.conversationMode)
          ? data!.conversationMode
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
    conversationMode: profile.conversationMode,
    updatedAt: serverTimestamp()
  }, { merge: true });
}


export function subscribeBlockedUserIds(cb: (ids: string[]) => void) {
  let stops: Array<() => void> = [];
  let outgoing: string[] = [];
  let incoming: string[] = [];
  let outgoingReady = false;
  let incomingReady = false;
  const stopAuth = auth.onAuthStateChanged(user => {
    stops.forEach(stop => stop());
    stops = [];
    outgoing = [];
    incoming = [];
    outgoingReady = false;
    incomingReady = false;
    if (!user) { cb([]); return; }
    cb(["*"]);
    const emit = () => {
      if (outgoingReady && incomingReady) cb([...new Set([...outgoing, ...incoming])]);
      else cb(["*"]);
    };
    stops.push(onSnapshot(
      query(collection(db, "blocks"), where("blockerId", "==", user.uid)),
      snap => {
        outgoing = snap.docs.map(item => item.data().blockedUserId)
          .filter((value): value is string => typeof value === "string");
        outgoingReady = true;
        emit();
      },
      error => {
        outgoingReady = false;
        console.error("Não foi possível verificar os bloqueios efetuados:", error);
        cb(["*"]);
      },
    ));
    stops.push(onSnapshot(
      query(collection(db, "blocks"), where("blockedUserId", "==", user.uid)),
      snap => {
        incoming = snap.docs.map(item => item.data().blockerId)
          .filter((value): value is string => typeof value === "string");
        incomingReady = true;
        emit();
      },
      error => {
        incomingReady = false;
        console.error("Não foi possível verificar os bloqueios recebidos:", error);
        cb(["*"]);
      },
    ));
  });
  return () => { stops.forEach(stop => stop()); stopAuth(); };
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
  const requestId = user.uid + "_" + post.id;
  const ref = doc(db, "communityMatchRequests", requestId);
  const existingSnap = await getDoc(ref);
  if (existingSnap.exists()) {
    const x = existingSnap.data();
    return {
      id: existingSnap.id,
      requesterId: x.requesterId || "",
      recipientId: x.recipientId || "",
      postId: x.postId || "",
      experienceTag: isExperienceMatchingId(x.experienceTag) ? x.experienceTag : experienceTag,
      status: ["pending","accepted","declined","cancelled"].includes(x.status) ? x.status : "pending",
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
  return { id: requestId, requesterId:user.uid, recipientId:post.authorId, postId:post.id, experienceTag, status:"pending" as const, createdAtMs:Date.now() };
}

export async function respondToExperienceMatch(request: ExperienceMatchRequest, accept: boolean) {
  const user = await ensureUser();
  if (request.recipientId !== user.uid || request.status !== "pending") return null;
  const ref = doc(db, "communityMatchRequests", request.id);
  if (!accept) {
    await updateDoc(ref, { status: "declined", respondedAt: serverTimestamp() });
    return null;
  }

  const postRef = doc(db, "posts", request.postId);
  const chatId = `match_${request.id}`;
  const chatRef = doc(db, "chats", chatId);
  const participants = [request.requesterId, request.recipientId].sort();

  // Acceptance and chat creation are one atomic operation. If a block exists,
  // Firestore rules reject the chat write and the request remains pending.
  await runTransaction(db, async transaction => {
    const [requestSnap, postSnap, chatSnap] = await Promise.all([
      transaction.get(ref),
      transaction.get(postRef),
      transaction.get(chatRef),
    ]);
    if (!requestSnap.exists() || !postSnap.exists()) throw new Error("match-request-unavailable");
    const current = requestSnap.data();
    if (current.recipientId !== user.uid || current.status !== "pending") {
      throw new Error("match-request-no-longer-pending");
    }
    if (current.requesterId !== request.requesterId || current.postId !== request.postId
      || postSnap.data().authorId !== user.uid) {
      throw new Error("match-request-invalid");
    }
    if (chatSnap.exists()) throw new Error("match-chat-already-exists");

    transaction.update(ref, { status: "accepted", respondedAt: serverTimestamp() });
    transaction.set(chatRef, {
      participants,
      postId: request.postId,
      authorId: user.uid,
      matchRequestId: request.id,
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      unreadBy: [],
    });
  });
  return chatId;
}


export function subscribeExperienceMatchCircles(cb: (circles: ExperienceMatchCircle[]) => void) {
  let stopQuery: (() => void) | undefined;
  const stopAuth = auth.onAuthStateChanged(user => {
    stopQuery?.();
    if (!user) { cb([]); return; }
    stopQuery = onSnapshot(
      query(collection(db, "experienceMatchCircles"), where("participants", "array-contains", user.uid), limit(20)),
      snap => cb(snap.docs.map(d => {
        const x = d.data();
        return {
          id: d.id,
          experienceTag: isExperienceMatchingId(x.experienceTag) ? x.experienceTag : "stress",
          participants: Array.isArray(x.participants) ? x.participants : [],
          capacity: 8,
          status: x.status === "full" ? "full" : "open",
          createdAtMs: x.createdAt?.toMillis?.() ?? 0
        };
      }))
    );
  });
  return () => { stopQuery?.(); stopAuth(); };
}

export async function joinExperienceMatchCircle(experienceTag: ExperienceMatchingId) {
  const user = await ensureUser();
  const profileSnap = await getDoc(doc(db, "communityMatchProfiles", user.uid));
  const profile = profileSnap.data();
  if (profile?.active !== true || !Array.isArray(profile.activeTags) || !profile.activeTags.includes(experienceTag)) {
    throw new Error("matching-not-active");
  }

  const shardCount = 12;
  const preferredShard = Math.abs([...user.uid].reduce((acc, ch) => ((acc * 31) + ch.charCodeAt(0)) | 0, 0)) % shardCount;
  let circleId = "";
  let circleRef = doc(db, "experienceMatchCircles", "placeholder");
  for (let offset = 0; offset < shardCount; offset += 1) {
    const shard = (preferredShard + offset) % shardCount;
    const candidateId = "circle_" + experienceTag + "_" + shard;
    const candidateRef = doc(db, "experienceMatchCircles", candidateId);
    const candidate = await getDoc(candidateRef);
    const participants = candidate.exists() && Array.isArray(candidate.data().participants) ? candidate.data().participants : [];
    if (!candidate.exists() || participants.includes(user.uid) || participants.length < 8) {
      circleId = candidateId;
      circleRef = candidateRef;
      break;
    }
  }
  if (!circleId) throw new Error("all-circles-full");
  await runTransaction(db, async transaction => {
    const snap = await transaction.get(circleRef);
    if (!snap.exists()) {
      transaction.set(circleRef, {
        experienceTag,
        participants: [user.uid],
        capacity: 8,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return;
    }
    const data = snap.data();
    const participants: string[] = Array.isArray(data.participants) ? data.participants : [];
    if (participants.includes(user.uid)) return;
    if (participants.length >= 8) throw new Error("circle-full");
    const next = [...participants, user.uid];
    transaction.update(circleRef, {
      participants: next,
      status: next.length >= 8 ? "full" : "open",
      updatedAt: serverTimestamp()
    });
  });
  return circleId;
}

export async function leaveExperienceMatchCircle(circleId: string) {
  const user = await ensureUser();
  const ref = doc(db, "experienceMatchCircles", circleId);
  await runTransaction(db, async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const participants: string[] = Array.isArray(data.participants) ? data.participants : [];
    if (!participants.includes(user.uid)) return;
    transaction.update(ref, {
      participants: participants.filter(uid => uid !== user.uid),
      status: "open",
      updatedAt: serverTimestamp()
    });
  });
}

export async function blockCircleParticipant(circleId: string, blockedUserId: string) {
  const user = await ensureUser();
  if (!blockedUserId || blockedUserId === user.uid) throw new Error("invalid-block");
  const circleRef = doc(db, "experienceMatchCircles", circleId);
  const circleSnap = await getDoc(circleRef);
  if (!circleSnap.exists()) throw new Error("circle-not-found");
  const participants: string[] = Array.isArray(circleSnap.data().participants) ? circleSnap.data().participants : [];
  if (!participants.includes(user.uid) || !participants.includes(blockedUserId)) throw new Error("not-circle-participant");
  await blockCommunityMember(blockedUserId, circleId);
  // Remove the blocked participant from this circle while keeping the blocker
  // and unrelated members together. Firestore rules require the matching pair block.
  await runTransaction(db, async transaction => {
    const latest = await transaction.get(circleRef);
    if (!latest.exists()) return;
    const current: string[] = Array.isArray(latest.data().participants) ? latest.data().participants : [];
    if (!current.includes(user.uid) || !current.includes(blockedUserId)) return;
    const next = current.filter(uid => uid !== blockedUserId);
    transaction.update(circleRef, {
      participants: next,
      status: next.length === 8 ? "full" : "open",
      updatedAt: serverTimestamp(),
    });
  });
}

export async function reportCircleParticipant(circleId: string, reportedUserId: string, reason: string) {
  const user = await ensureUser();
  const cleanReason = reason.trim().slice(0, 500);
  if (!cleanReason || !reportedUserId || reportedUserId === user.uid) throw new Error("invalid-report");
  const circleSnap = await getDoc(doc(db, "experienceMatchCircles", circleId));
  const participants: string[] = circleSnap.exists() && Array.isArray(circleSnap.data().participants) ? circleSnap.data().participants : [];
  if (!participants.includes(user.uid) || !participants.includes(reportedUserId)) throw new Error("not-circle-participant");
  await setDoc(doc(db, "reports", `circle_${circleId}_${user.uid}_${reportedUserId}`), { reporterId:user.uid, reportedUserId, postId:"circle:"+circleId, circleId, reason:cleanReason, status:"pending", createdAt:serverTimestamp() });
}

export async function requestCircleParticipantRemoval(circleId: string, targetUserId: string) {
  const user = await ensureUser();
  if (!targetUserId || targetUserId === user.uid) throw new Error("invalid-removal-request");
  const circleSnap = await getDoc(doc(db, "experienceMatchCircles", circleId));
  const participants: string[] = circleSnap.exists() && Array.isArray(circleSnap.data().participants) ? circleSnap.data().participants : [];
  if (participants.length < 3 || !participants.includes(user.uid) || !participants.includes(targetUserId)) throw new Error("invalid-removal-request");
  await setDoc(doc(db, "reports", `removal_${circleId}_${user.uid}_${targetUserId}`), { reporterId:user.uid, reportedUserId:targetUserId, postId:"circle:"+circleId, circleId, reason:"Pedido de remoção da conversa de grupo", kind:"circle_removal_request", status:"pending", createdAt:serverTimestamp() });
}
