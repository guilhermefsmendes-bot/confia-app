import test from "node:test";
import assert from "node:assert/strict";
import { filterBlockedCommunityPosts, normalizeCommunityPost } from "../communityService";

test("community feed removes blocked authors from every incoming snapshot", () => {
  const posts = [
    { id: "a", authorId: "alice" },
    { id: "b", authorId: "bob" },
    { id: "c", authorId: "carol" },
  ];
  const blocked = new Set(["bob"]);
  assert.deepEqual(filterBlockedCommunityPosts(posts, blocked), [posts[0], posts[2]]);
  // A later Firestore snapshot is filtered by the same persisted block set.
  const laterSnapshot = [...posts, { id: "d", authorId: "bob" }];
  assert.deepEqual(filterBlockedCommunityPosts(laterSnapshot, blocked), [posts[0], posts[2]]);
});

test("community feed preserves all posts when there are no blocks", () => {
  const posts = [{ id: "a", authorId: "alice" }];
  assert.equal(filterBlockedCommunityPosts(posts, new Set()), posts);
});

test("community post normalization prevents malformed Firestore fields from crashing the feed", () => {
  const post = normalizeCommunityPost("post-1", {
    authorId: 42,
    userName: { invalid: true },
    feeling: null,
    message: "Mensagem válida",
    topic: ["invalid"],
    yellowLikes: { invalid: true },
    greenLikes: "3",
    redLikes: 2,
    yellowLikedBy: [7, "user-1"],
    createdAt: { toDate: () => { throw new Error("invalid timestamp"); } },
  }, "user-1", "Agora");

  assert.ok(post);
  assert.equal(post.userName, "Guardião Anon");
  assert.equal(post.feeling, "Calmo");
  assert.equal(post.message, "Mensagem válida");
  assert.equal(post.topic, undefined);
  assert.equal(post.yellowLikes, 0);
  assert.equal(post.greenLikes, 0);
  assert.equal(post.redLikes, 2);
  assert.deepEqual(post.yellowLikedBy, ["user-1"]);
  assert.equal(post.userReaction, "yellow");
  assert.equal(post.timestamp, "Agora");
});

test("community post normalization skips records without a valid message", () => {
  assert.equal(normalizeCommunityPost("post-2", { message: { text: "invalid" } }, "user-1", "Agora"), null);
  assert.equal(normalizeCommunityPost("post-3", null, "user-1", "Agora"), null);
});
