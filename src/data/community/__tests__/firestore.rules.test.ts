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
});
