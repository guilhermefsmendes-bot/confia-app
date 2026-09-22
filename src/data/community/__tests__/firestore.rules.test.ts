import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, getDoc, Timestamp } from "firebase/firestore";

let env: RulesTestEnvironment;
const rules = readFileSync("firestore.rules", "utf8");
const projectId = "confia-b952e-rules-test";

const post = (authorId: string) => ({
  authorId,
  userName: "Test User",
  feeling: "calm",
  topic: "stress",
  message: "A valid test post",
  yellowLikes: 0,
  greenLikes: 0,
  redLikes: 0,
  yellowLikedBy: [],
  greenLikedBy: [],
  redLikedBy: [],
  createdAt: Timestamp.fromMillis(1_700_000_000_000),
});

before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: { rules } });
});
after(async () => { await env.cleanup(); });

const db = (uid: string) => env.authenticatedContext(uid).firestore();

describe("Firestore security rules", () => {
  it("allows an authenticated user to create their own valid post", async () => {
    await assertSucceeds(setDoc(doc(db("alice"), "posts/p1"), post("alice")));
  });

  it("rejects creating a post for another user", async () => {
    await assertFails(setDoc(doc(db("alice"), "posts/p2"), post("bob")));
  });

  it("rejects an unknown community topic", async () => {
    await assertFails(setDoc(doc(db("alice"), "posts/p-topic-invalid"), {
      ...post("alice"),
      topic: "unsupported-topic",
    }));
  });

  it("allows a user to add exactly one reaction", async () => {
    await assertSucceeds(updateDoc(doc(db("alice"), "posts/p1"), {
      greenLikes: 1,
      greenLikedBy: ["alice"],
    }));
  });
  it("rejects a user holding two reaction types", async () => {
    await assertFails(updateDoc(doc(db("alice"), "posts/p1"), {
      yellowLikes: 1,
      yellowLikedBy: ["alice"],
      greenLikes: 1,
      greenLikedBy: ["alice"],
    }));
  });

  it("rejects a non-participant reading an existing chat", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "chats/c1"), {
        participants: ["alice", "bob"], authorId: "alice", postId: "p1",
        createdAt: Timestamp.fromMillis(1_700_000_000_000), lastMessage: "",
        lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
      });
    });
    await assertFails(getDoc(doc(db("mallory"), "chats/c1")));
  });

  it("allows the post author and a reactor to create the same private chat", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "posts/p-chat"), {
        ...post("alice"),
        greenLikedBy: ["bob"],
        greenLikes: 1,
      });
    });

    await assertSucceeds(setDoc(doc(db("bob"), "chats/p-chat_alice_bob"), {
      participants: ["alice", "bob"],
      authorId: "alice",
      postId: "p-chat",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      lastMessage: "",
      lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
    }));

    await assertSucceeds(setDoc(doc(db("alice"), "chats/p-chat_alice_bob"), {
      participants: ["alice", "bob"],
      authorId: "alice",
      postId: "p-chat",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      lastMessage: "",
      lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
    }));
  });

  it("allows chat unread state to be written by the sender and cleared by the recipient", async () => {
    await assertSucceeds(updateDoc(doc(db("bob"), "chats/p-chat_alice_bob"), {
      lastMessage: "hello",
      lastMessageAt: Timestamp.fromMillis(1_700_000_100_000),
      lastSenderId: "bob",
      unreadBy: ["alice"],
    }));

    await assertSucceeds(updateDoc(doc(db("alice"), "chats/p-chat_alice_bob"), {
      unreadBy: [],
    }));

    await assertFails(updateDoc(doc(db("bob"), "chats/p-chat_alice_bob"), {
      lastSenderId: "alice",
      unreadBy: ["bob"],
    }));
  });

  it("allows one community experience poll vote and rejects a second vote", async () => {
    const options = [
      { id: "no", label: "no", count: 0, voterIds: [] },
      { id: "yes", label: "yes", count: 0, voterIds: [] },
      { id: "a_lot", label: "a_lot", count: 0, voterIds: [] },
      { id: "with_you", label: "with_you", count: 0, voterIds: [] },
    ];
    await assertSucceeds(setDoc(doc(db("alice"), "communityPolls/q1"), { authorId: "alice", question: "Has anyone felt this?", topic: "experiencia", options, createdAt: Timestamp.fromMillis(1_700_000_000_000) }));
    const voted = options.map((o, i) => i === 1 ? { ...o, count: 1, voterIds: ["bob"] } : o);
    await assertSucceeds(updateDoc(doc(db("bob"), "communityPolls/q1"), { options: voted }));
    const second = voted.map((o, i) => i === 2 ? { ...o, count: 1, voterIds: ["bob"] } : o);
    await assertFails(updateDoc(doc(db("bob"), "communityPolls/q1"), { options: second }));
  });

  it("rejects an unrelated user from creating a chat", async () => {
    await assertFails(setDoc(doc(db("mallory"), "chats/p-chat_alice_mallory"), {
      participants: ["alice", "mallory"],
      authorId: "alice",
      postId: "p-chat",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      lastMessage: "",
      lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
    }));
  });

  it("allows participants to send their own message but rejects impersonation", async () => {
    await assertSucceeds(setDoc(doc(db("bob"), "chats/p-chat_alice_bob/messages/m1"), {
      senderId: "bob",
      text: "hello",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
    }));

    await assertFails(setDoc(doc(db("bob"), "chats/p-chat_alice_bob/messages/m2"), {
      senderId: "mallory",
      text: "impersonation",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
    }));
  });
  it("keeps Experience Matching preferences private", async () => {
    await assertSucceeds(setDoc(doc(db("bob"), "communityMatchProfiles/bob"), {
      ownerId: "bob",
      active: true,
      activeTags: ["separation_divorce"],
      preference: "same_now",
      updatedAt: Timestamp.fromMillis(1_700_000_000_000),
    }));
    await assertSucceeds(getDoc(doc(db("bob"), "communityMatchProfiles/bob")));
    await assertFails(getDoc(doc(db("alice"), "communityMatchProfiles/bob")));
  });

  it("requires a valid active experience before creating a match request", async () => {
    await assertSucceeds(setDoc(doc(db("alice"), "posts/p-match"), {
      ...post("alice"),
      topic: "relacoes",
      experienceTag: "separation_divorce",
      supportMode: "share",
    }));

    await assertSucceeds(setDoc(doc(db("bob"), "communityMatchRequests/bob_p-match"), {
      requesterId: "bob",
      recipientId: "alice",
      postId: "p-match",
      experienceTag: "separation_divorce",
      status: "pending",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
    }));

    await assertFails(setDoc(doc(db("mallory"), "communityMatchRequests/mallory_p-match"), {
      requesterId: "mallory",
      recipientId: "alice",
      postId: "p-match",
      experienceTag: "separation_divorce",
      status: "pending",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
    }));
  });

  it("creates an Experience Matching chat only after recipient acceptance", async () => {
    const chatPayload = {
      participants: ["alice", "bob"],
      authorId: "alice",
      postId: "p-match",
      matchRequestId: "bob_p-match",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      lastMessage: "",
      lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
      unreadBy: [],
    };

    await assertFails(setDoc(doc(db("alice"), "chats/match_bob_p-match"), chatPayload));

    await assertSucceeds(updateDoc(doc(db("alice"), "communityMatchRequests/bob_p-match"), {
      status: "accepted",
      respondedAt: Timestamp.fromMillis(1_700_000_100_000),
    }));

    await assertSucceeds(setDoc(doc(db("alice"), "chats/match_bob_p-match"), chatPayload));
    await assertFails(updateDoc(doc(db("bob"), "communityMatchRequests/bob_p-match"), {
      status: "declined",
      respondedAt: Timestamp.fromMillis(1_700_000_200_000),
    }));
  });

});
