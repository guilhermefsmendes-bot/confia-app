import test from "node:test";
import assert from "node:assert/strict";
import {
  filterUnreadCommunityChatsByBlockedUsers,
  selectNewestUnreadCommunityChat
} from "../unreadChatSelection";

function doc(id: string, data: Record<string, unknown>) {
  return { id, data: () => data };
}

test("selects the newest chat unread by the current user", () => {
  const docs = [
    doc("old", { postId: "post-old", unreadBy: ["u1"], lastMessageAt: { toMillis: () => 10 } }),
    doc("read", { postId: "post-read", unreadBy: ["u2"], lastMessageAt: { toMillis: () => 99 } }),
    doc("new", { postId: "post-new", unreadBy: ["u1", "u2"], lastMessageAt: { toMillis: () => 20 } }),
  ];
  assert.deepEqual(selectNewestUnreadCommunityChat(docs, "u1"), {
    id: "new",
    postId: "post-new",
    lastMessageAt: docs[2].data().lastMessageAt,
  });
});

test("ignores unread records without a valid post id", () => {
  const docs = [
    doc("missing", { unreadBy: ["u1"], lastMessageAt: { toMillis: () => 100 } }),
    doc("empty", { postId: "", unreadBy: ["u1"] }),
    doc("valid", { postId: "post", unreadBy: ["u1"] }),
  ];
  assert.equal(selectNewestUnreadCommunityChat(docs, "u1")?.id, "valid");
});

test("returns null when no conversation is unread by the user", () => {
  assert.equal(selectNewestUnreadCommunityChat([
    doc("other", { postId: "post", unreadBy: ["u2"] }),
  ], "u1"), null);
});

test("filters private unread chats when either participant blocked the other", () => {
  const docs = [
    doc("outgoing-block", { postId: "p1", unreadBy: ["u1"], participants: ["u1", "u2"] }),
    doc("incoming-block", { postId: "p2", unreadBy: ["u1"], participants: ["u1", "u3"] }),
    doc("available", { postId: "p3", unreadBy: ["u1"], participants: ["u1", "u4"] }),
  ];
  const visible = filterUnreadCommunityChatsByBlockedUsers(docs, "u1", new Set(["u2", "u3"]));
  assert.deepEqual(visible.map(item => item.id), ["available"]);
});

test("fails closed while the reciprocal block list is unavailable", () => {
  const docs = [doc("chat", { postId: "p1", unreadBy: ["u1"], participants: ["u1", "u2"] })];
  assert.deepEqual(filterUnreadCommunityChatsByBlockedUsers(docs, "u1", new Set(["*"])), []);
});
