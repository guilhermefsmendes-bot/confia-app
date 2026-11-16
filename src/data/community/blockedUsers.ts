import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth } from "../../firebaseAuth";
import { db } from "../../firebaseFirestore";

type BlockedUsersListener = (ids: string[]) => void;

const listeners = new Set<BlockedUsersListener>();
let stopAuthListener: (() => void) | null = null;
let queryUnsubscribers: Array<() => void> = [];
let latestBlockedIds: string[] = ["*"];

function publishBlockedIds(ids: string[]) {
  latestBlockedIds = ids;
  for (const listener of listeners) {
    try {
      listener(ids);
    } catch (error) {
      console.error("Erro ao atualizar estado de bloqueios:", error);
    }
  }
}

function stopBlockQueries() {
  queryUnsubscribers.forEach(unsubscribe => unsubscribe());
  queryUnsubscribers = [];
}

/**
 * One pair of Firestore listeners serves the whole app.
 * Subscribers share the same fail-closed block state and are reference-counted;
 * leaving Community/Chat releases the network listeners when nobody needs them.
 */
function startSharedBlockListener() {
  if (stopAuthListener) return;

  stopAuthListener = auth.onAuthStateChanged(user => {
    stopBlockQueries();

    if (!user) {
      publishBlockedIds([]);
      return;
    }

    let outgoing: string[] = [];
    let incoming: string[] = [];
    let outgoingReady = false;
    let incomingReady = false;

    // Never expose community content until both directions are known.
    publishBlockedIds(["*"]);

    const emit = () => {
      if (outgoingReady && incomingReady) {
        publishBlockedIds([...new Set([...outgoing, ...incoming])]);
      } else {
        publishBlockedIds(["*"]);
      }
    };

    queryUnsubscribers.push(onSnapshot(
      query(collection(db, "blocks"), where("blockerId", "==", user.uid)),
      snapshot => {
        outgoing = snapshot.docs
          .map(item => item.data().blockedUserId)
          .filter((value): value is string => typeof value === "string");
        outgoingReady = true;
        emit();
      },
      error => {
        outgoingReady = false;
        console.error("Não foi possível verificar os bloqueios efetuados:", error);
        publishBlockedIds(["*"]);
      },
    ));

    queryUnsubscribers.push(onSnapshot(
      query(collection(db, "blocks"), where("blockedUserId", "==", user.uid)),
      snapshot => {
        incoming = snapshot.docs
          .map(item => item.data().blockerId)
          .filter((value): value is string => typeof value === "string");
        incomingReady = true;
        emit();
      },
      error => {
        incomingReady = false;
        console.error("Não foi possível verificar os bloqueios recebidos:", error);
        publishBlockedIds(["*"]);
      },
    ));
  });
}

export function subscribeBlockedUserIds(listener: BlockedUsersListener) {
  listeners.add(listener);
  listener(latestBlockedIds);

  if (!stopAuthListener) startSharedBlockListener();

  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;

    stopAuthListener?.();
    stopAuthListener = null;
    stopBlockQueries();
    latestBlockedIds = ["*"];
  };
}
