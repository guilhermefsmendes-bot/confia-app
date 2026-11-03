import { useEffect } from "react";
import {
  filterUnreadCommunityChatsByBlockedUsers,
  selectNewestUnreadCommunityChat
} from "../data/community/unreadChatSelection";

export interface PendingCommunityChat {
  id: string;
  postId: string;
  lastMessageAt?: unknown;
}

interface UseUnreadCommunityChatOptions {
  setPendingCommunityChat: (chat: PendingCommunityChat | null) => void;
  enabled?: boolean;
}

/**
 * Keeps track of the most recent unread private community chat.
 * The Firestore listener is intentionally deferred so it cannot compete
 * with the first screen's critical startup work.
 */
export function useUnreadCommunityChat({
  setPendingCommunityChat,
  enabled = true
}: UseUnreadCommunityChatOptions): void {
  useEffect(() => {
    if (!enabled) {
      setPendingCommunityChat(null);
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let unsubscribeBlocks: (() => void) | undefined;
    let cancelled = false;
    let lastPublishedKey: string | null = null;
    let delayTimer: number | undefined;
    let idleId: number | undefined;

    const startUnreadChatListener = async () => {
      try {
        const [{ auth }, { db }, firestore] = await Promise.all([
          import("../firebaseAuth"),
          import("../firebaseFirestore"),
          import("firebase/firestore")
        ]);
        if (cancelled) return;

        let user = auth.currentUser;

        if (!user) {
          await new Promise<void>((resolve) => {
            const unsubscribeAuth = auth.onAuthStateChanged(() => {
              unsubscribeAuth();
              resolve();
            });
          });
          user = auth.currentUser;
        }

        if (!user || cancelled) return;

        const myUid = user.uid;
        const { subscribeBlockedUserIds } = await import("../data/community/experienceMatchingService");
        let blockedUserIds = new Set<string>(["*"]);
        let latestUnreadDocs: import("firebase/firestore").QueryDocumentSnapshot[] = [];
        const publishNewestUnread = () => {
          if (cancelled) return;
          if (blockedUserIds.has("*")) {
            if (lastPublishedKey !== null) {
              lastPublishedKey = null;
              setPendingCommunityChat(null);
            }
            return;
          }
          const visibleDocs = filterUnreadCommunityChatsByBlockedUsers(
            latestUnreadDocs,
            myUid,
            blockedUserIds
          );
          const newest = selectNewestUnreadCommunityChat(visibleDocs, myUid);
            if (!newest?.postId) {
              if (lastPublishedKey !== null) {
                lastPublishedKey = null;
                setPendingCommunityChat(null);
              }
              return;
            }

            const timestamp = newest.lastMessageAt as { toMillis?: () => number } | undefined;
            const nextKey = `${newest.id}:${newest.postId}:${typeof timestamp?.toMillis === "function" ? timestamp.toMillis() : ""}`;
            // Firestore pode emitir snapshots sem mudança útil para o badge.
            // Evitamos forçar a árvore principal a renderizar de novo nesses casos.
            if (nextKey === lastPublishedKey) return;
            lastPublishedKey = nextKey;

          setPendingCommunityChat({
            id: newest.id,
            postId: newest.postId,
            lastMessageAt: newest.lastMessageAt
          });
        };
        unsubscribeBlocks = subscribeBlockedUserIds(ids => {
          blockedUserIds = new Set(ids);
          publishNewestUnread();
        });

        // A bounded recent window allows blocked chats to be removed client-side
        // without letting a single blocked unread conversation suppress every badge.
        const chatsQuery = firestore.query(
          firestore.collection(db, "chats"),
          firestore.where("unreadBy", "array-contains", myUid),
          firestore.orderBy("lastMessageAt", "desc"),
          firestore.limit(30)
        );
        unsubscribe = firestore.onSnapshot(
          chatsQuery,
          snapshot => {
            if (cancelled) return;
            latestUnreadDocs = snapshot.docs;
            publishNewestUnread();
          },
          error => {
            console.error("Erro ao verificar mensagens da comunidade:", error);
          }
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao iniciar verificação de mensagens da comunidade:", error);
        }
      }
    };

    // A badge não é crítica para o primeiro ecrã.
    delayTimer = window.setTimeout(() => {
      const requestIdle = (window as any).requestIdleCallback;
      if (typeof requestIdle === "function") {
        idleId = requestIdle(() => {
          if (!cancelled) void startUnreadChatListener();
        }, { timeout: 2500 });
      } else {
        void startUnreadChatListener();
      }
    }, 3200);

    return () => {
      cancelled = true;
      if (delayTimer !== undefined) window.clearTimeout(delayTimer);
      if (idleId !== undefined) (window as any).cancelIdleCallback?.(idleId);
      unsubscribe?.();
      unsubscribeBlocks?.();
    };
  }, [setPendingCommunityChat, enabled]);
}
