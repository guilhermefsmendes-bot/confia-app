import {
  collection, doc, onSnapshot, query, where, orderBy, limit, serverTimestamp,
  setDoc, runTransaction, Timestamp
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "../../firebaseAuth";
import { db } from "../../firebaseFirestore";
import type { SharePost } from "../../types";

export const LISTENING_THEMES = [
  "anxiety", "depression", "loneliness", "stress",
  "relationships", "grief", "selfEsteem", "other"
] as const;
export type ListeningTheme = typeof LISTENING_THEMES[number];

export interface ListeningProfile {
  active: boolean;
  themes: ListeningTheme[];
}
export interface ListeningRequest {
  id: string;
  requesterId: string;
  theme: ListeningTheme;
  note: string;
  status: "waiting" | "matched" | "cancelled" | "expired" | "closed";
  acceptedBy: string | null;
  createdAtMs: number;
  expiresAtMs: number;
}
const validTheme = (value: unknown): value is ListeningTheme =>
  typeof value === "string" && (LISTENING_THEMES as readonly string[]).includes(value);

async function ensureUser() {
  if (!auth.currentUser) await signInAnonymously(auth);
  if (!auth.currentUser) throw new Error("auth-required");
  return auth.currentUser;
}

const defaultProfile: ListeningProfile = { active: false, themes: [] };

export function subscribeListeningProfile(cb: (profile: ListeningProfile) => void) {
  let stopDoc: (() => void) | undefined;
  const stopAuth = onAuthStateChanged(auth, user => {
    stopDoc?.();
    if (!user) { cb(defaultProfile); return; }
    stopDoc = onSnapshot(doc(db, "listeningProfiles", user.uid), snap => {
      const data = snap.data();
      const themes = Array.isArray(data?.themes) ? data.themes.filter(validTheme) : [];
      cb({ active: data?.active === true && themes.length > 0, themes });
    }, error => { console.error("[ListeningSupport] profile subscription:", error); cb(defaultProfile); });
  });
  return () => { stopDoc?.(); stopAuth(); };
}

export async function saveListeningProfile(profile: ListeningProfile) {
  const user = await ensureUser();
  const themes = [...new Set(profile.themes.filter(validTheme))].slice(0, LISTENING_THEMES.length);
  await setDoc(doc(db, "listeningProfiles", user.uid), {
    ownerId: user.uid,
    active: profile.active && themes.length > 0,
    themes,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

function mapRequest(snap: any): ListeningRequest {
  const data = snap.data();
  return {
    id: snap.id,
    requesterId: typeof data.requesterId === "string" ? data.requesterId : "",
    theme: validTheme(data.theme) ? data.theme : "other",
    note: typeof data.note === "string" ? data.note : "",
    status: ["waiting", "matched", "cancelled", "expired", "closed"].includes(data.status) ? data.status : "waiting",
    acceptedBy: typeof data.acceptedBy === "string" ? data.acceptedBy : null,
    createdAtMs: data.createdAt?.toMillis?.() ?? 0,
    expiresAtMs: data.expiresAt?.toMillis?.() ?? 0
  };
}

export function subscribeListeningRequests(
  profile: ListeningProfile,
  cb: (requests: ListeningRequest[]) => void,
  onSubscriptionState?: (channel: string, error: Error | null) => void
) {
  let stops: Array<() => void> = [];
  let outgoing: ListeningRequest[] = [];
  let incoming: ListeningRequest[] = [];
  let assigned: ListeningRequest[] = [];
  const emit = () => {
    const all = new Map([...outgoing, ...incoming, ...assigned].map(r => [r.id, r]));
    cb([...all.values()].sort((a, b) => b.createdAtMs - a.createdAtMs));
  };
  const stopAuth = onAuthStateChanged(auth, user => {
    stops.forEach(stop => stop()); stops = []; outgoing = []; incoming = []; assigned = []; emit();
    if (!user) return;
    stops.push(onSnapshot(
      query(collection(db, "listeningRequests"), where("requesterId", "==", user.uid), limit(10)),
      snap => { outgoing = snap.docs.map(mapRequest); onSubscriptionState?.("outgoing", null); emit(); },
      error => { console.error("[ListeningSupport] outgoing requests:", error); onSubscriptionState?.("outgoing", error); }
    ));
    stops.push(onSnapshot(
      query(collection(db, "listeningRequests"), where("acceptedBy", "==", user.uid), where("status", "==", "matched"), limit(30)),
      snap => { assigned = snap.docs.map(mapRequest); onSubscriptionState?.("assigned", null); emit(); },
      error => { console.error("[ListeningSupport] active conversations:", error); onSubscriptionState?.("assigned", error); }
    ));
    const themes = profile.active ? [...new Set(profile.themes.filter(validTheme))] : [];
    if (themes.length) {
      // Use one equality query per opted-in theme instead of a single "in"
      // query. Firestore rules can validate each fixed theme against the
      // listener's stored profile; they cannot reliably prove that a client-
      // supplied "in" array matches that profile's dynamic themes list.
      const incomingByTheme = new Map<string, ListeningRequest[]>();
      const publishIncoming = () => {
        incoming = [...incomingByTheme.values()].flat()
          .filter(r => r.requesterId !== user.uid && r.expiresAtMs > Date.now());
        onSubscriptionState?.("incoming", null);
        emit();
      };
      for (const selectedTheme of themes) {
        stops.push(onSnapshot(
          query(
            collection(db, "listeningRequests"),
            where("status", "==", "waiting"),
            where("theme", "==", selectedTheme),
            orderBy("createdAt", "desc"),
            limit(30)
          ),
          snap => {
            incomingByTheme.set(selectedTheme, snap.docs.map(mapRequest));
            publishIncoming();
          },
          error => {
            console.error("[ListeningSupport] incoming requests for theme:", selectedTheme, error);
            onSubscriptionState?.("incoming", error);
          }
        ));
      }
    } else incoming = [];
    emit();
  });
  // The component re-subscribes whenever the listener profile changes.
  return () => { stops.forEach(stop => stop()); stopAuth(); };
}

export async function createListeningRequest(theme: ListeningTheme, note: string) {
  const user = await ensureUser();
  const cleanNote = note.trim().slice(0, 300);
  const activeRequest = doc(collection(db, "listeningRequests"));
  const expiresAtMs = Date.now() + 10 * 60 * 1000;
  const profileRef = doc(db, "listeningProfiles", user.uid);
  await runTransaction(db, async tx => {
    const profileSnap = await tx.get(profileRef);
    tx.set(activeRequest, {
      requesterId: user.uid,
      theme,
      note: cleanNote,
      status: "waiting",
      acceptedBy: null,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(expiresAtMs)
    });
    // A member asking for support should not be matched as a listener at the same time.
    if (profileSnap.exists() && profileSnap.data().active === true) {
      tx.update(profileRef, { active: false, updatedAt: serverTimestamp() });
    }
  });
  return activeRequest.id;
}

export async function cancelListeningRequest(request: ListeningRequest) {
  const user = await ensureUser();
  if (request.requesterId !== user.uid || request.status !== "waiting") return;
  await runTransaction(db, async tx => {
    const ref = doc(db, "listeningRequests", request.id);
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().requesterId !== user.uid || snap.data().status !== "waiting") return;
    tx.update(ref, { status: "cancelled", cancelledAt: serverTimestamp() });
  });
}

export async function acceptListeningRequest(request: ListeningRequest) {
  const user = await ensureUser();
  if (request.requesterId === user.uid) throw new Error("cannot-accept-own-request");
  const requestRef = doc(db, "listeningRequests", request.id);
  const chatId = "listen_" + request.id;
  await runTransaction(db, async tx => {
    const snap = await tx.get(requestRef);
    if (!snap.exists()) throw new Error("request-not-found");
    const data = snap.data();
    if (data.status !== "waiting" || data.expiresAt?.toMillis?.() <= Date.now()) throw new Error("request-no-longer-available");
    const profileRef = doc(db, "listeningProfiles", user.uid);
    const profileSnap = await tx.get(profileRef);
    const profile = profileSnap.data();
    if (profile?.active !== true || !Array.isArray(profile.themes) || !profile.themes.includes(data.theme)) {
      throw new Error("not-available-for-theme");
    }
    tx.update(requestRef, {
      status: "matched",
      acceptedBy: user.uid,
      matchedAt: serverTimestamp()
    });
    // Keep the volunteer available: accepting a request must not disable their
    // profile, so they may accept and manage multiple simultaneous conversations.
    tx.set(doc(db, "chats", chatId), {
      participants: [data.requesterId, user.uid].sort(),
      postId: chatId,
      authorId: data.requesterId,
      listeningRequestId: request.id,
      listeningTheme: data.theme,
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      unreadBy: []
    });
  });
  return chatId;
}

export function listeningRequestToPost(request: ListeningRequest): SharePost {
  const acceptedBy = request.acceptedBy || "";
  return {
    id: "listen_" + request.id,
    authorId: request.requesterId,
    userName: "Membro da CONFIA",
    feeling: "💬",
    topic: request.theme,
    message: request.note || "Preciso de alguém que me ouça sobre este tema.",
    timestamp: new Date(request.createdAtMs || Date.now()).toISOString(),
    createdAtMs: request.createdAtMs,
    yellowLikes: 0, greenLikes: 0, redLikes: 0,
    yellowLikedBy: [], greenLikedBy: [], redLikedBy: acceptedBy ? [acceptedBy] : []
  };
}

export async function closeListeningSupportChat(chatId: string) {
  const user = await ensureUser();
  if (!chatId.startsWith("listen_")) return;
  const requestId = chatId.slice("listen_".length);
  const requestRef = doc(db, "listeningRequests", requestId);
  const chatRef = doc(db, "chats", chatId);
  await runTransaction(db, async tx => {
    const [requestSnap, chatSnap] = await Promise.all([tx.get(requestRef), tx.get(chatRef)]);
    if (!requestSnap.exists() || !chatSnap.exists()) return;
    const request = requestSnap.data();
    const chat = chatSnap.data();
    const participants: string[] = Array.isArray(chat.participants) ? chat.participants : [];
    if (request.status !== "matched" || ![request.requesterId, request.acceptedBy].includes(user.uid)
      || !participants.includes(user.uid) || participants.length !== 2) return;
    const remaining = participants.filter(uid => uid !== user.uid);
    tx.update(requestRef, { status: "closed", closedAt: serverTimestamp() });
    tx.update(chatRef, { participants: remaining, unreadBy: [], closedBy: user.uid, closedAt: serverTimestamp() });
  });
}
