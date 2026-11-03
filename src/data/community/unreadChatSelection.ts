export interface UnreadChatDocumentLike {
  id: string;
  data: () => unknown;
}

export interface PendingUnreadChat {
  id: string;
  postId: string;
  lastMessageAt?: unknown;
}

interface ChatData {
  postId?: unknown;
  unreadBy?: unknown;
  participants?: unknown;
  lastMessageAt?: { toMillis?: () => number } | null;
}

/** Keeps blocked peers out of the automatic unread-chat entry point. */
export function filterUnreadCommunityChatsByBlockedUsers(
  documents: readonly UnreadChatDocumentLike[],
  uid: string,
  blockedUserIds: ReadonlySet<string>,
): UnreadChatDocumentLike[] {
  if (blockedUserIds.has("*")) return [];
  return documents.filter(document => {
    const participants = (document.data() as ChatData).participants;
    if (!Array.isArray(participants) || !participants.includes(uid)) return false;
    const peers = participants.filter((participant): participant is string =>
      typeof participant === "string" && participant !== uid
    );
    return peers.length > 0 && peers.every(peer => !blockedUserIds.has(peer));
  });
}

/** Selects the newest unread chat in O(n), without sorting or allocating a copy. */
export function selectNewestUnreadCommunityChat(
  documents: readonly UnreadChatDocumentLike[],
  uid: string,
): PendingUnreadChat | null {
  let newest: PendingUnreadChat | null = null;
  let newestTime = Number.NEGATIVE_INFINITY;

  for (const document of documents) {
    const chat = document.data() as ChatData;
    if (typeof chat.postId !== "string" || chat.postId.length === 0) continue;
    if (!Array.isArray(chat.unreadBy) || !chat.unreadBy.includes(uid)) continue;

    const timestamp = chat.lastMessageAt;
    const time = typeof timestamp?.toMillis === "function"
      ? timestamp.toMillis()
      : 0;

    if (newest === null || time > newestTime) {
      newest = {
        id: document.id,
        postId: chat.postId,
        lastMessageAt: timestamp,
      };
      newestTime = time;
    }
  }

  return newest;
}
