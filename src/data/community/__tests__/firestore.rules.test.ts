import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, Timestamp, runTransaction } from "firebase/firestore";

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
  it("allows users to submit reports but keeps other users' reports private", async () => {
    const report = { reporterId: "alice", reportedUserId: "bob", postId: "p1", reason: "Harassment", status: "pending", createdAt: Timestamp.fromMillis(1_700_000_000_000) };
    await assertSucceeds(setDoc(doc(db("alice"), "reports/r-alice"), report));
    await assertFails(setDoc(doc(db("alice"), "reports/r-forged-status"), { ...report, status: "dismissed" }));
    await assertFails(setDoc(doc(db("alice"), "reports/r-extra-field"), { ...report, moderator: true }));
    await assertSucceeds(getDoc(doc(db("alice"), "reports/r-alice")));
    await assertSucceeds(getDocs(query(collection(db("alice"), "reports"), where("reporterId", "==", "alice"))));
    await assertFails(getDoc(doc(db("bob"), "reports/r-alice")));
    await assertFails(getDocs(collection(db("bob"), "reports")));
  });

  it("allows only trusted moderators to review reports", async () => {
    const report = { reporterId: "alice", reportedUserId: "bob", postId: "p2", reason: "Threat", status: "pending", createdAt: Timestamp.fromMillis(1_700_000_000_000) };
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), "reports/r-review"), report);
    });
    const moderatorDb = env.authenticatedContext("moderator-1", { moderator: true }).firestore();
    await assertSucceeds(getDocs(collection(moderatorDb, "reports")));
    await assertSucceeds(updateDoc(doc(moderatorDb, "reports/r-review"), {
      status: "in_review", reviewedAt: Timestamp.fromMillis(1_700_000_100_000), reviewedBy: "moderator-1", moderatorNotes: "Analysis started"
    }));
    await assertSucceeds(updateDoc(doc(moderatorDb, "reports/r-review"), {
      status: "actioned", reviewedAt: Timestamp.fromMillis(1_700_000_200_000), reviewedBy: "moderator-1", moderatorNotes: "Resolved"
    }));
    await assertFails(updateDoc(doc(db("mallory"), "reports/r-review"), {
      status: "dismissed", reviewedAt: Timestamp.fromMillis(1_700_000_200_000), reviewedBy: "mallory"
    }));
    await assertFails(updateDoc(doc(moderatorDb, "reports/r-review"), { reportedUserId: "mallory" }));
    await assertFails(deleteDoc(doc(moderatorDb, "reports/r-review")));
  });

  it("allows moderators to inspect reported chat and group messages without granting collection-wide access", async () => {
    await env.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "chats/listen_reported"), { participants: ["alice", "bob"], authorId: "alice", postId: "listen_reported", createdAt: Timestamp.fromMillis(1_700_000_000_000) });
      await setDoc(doc(adminDb, "chats/listen_reported/messages/m1"), { senderId: "bob", text: "reported message", createdAt: Timestamp.fromMillis(1_700_000_000_100) });
      await setDoc(doc(adminDb, "experienceMatchCircles/circle_reported"), { participants: ["alice", "bob"], status: "open", experienceTag: "stress", createdAt: Timestamp.fromMillis(1_700_000_000_000) });
      await setDoc(doc(adminDb, "experienceMatchCircles/circle_reported/messages/m1"), { senderId: "bob", text: "group message", createdAt: Timestamp.fromMillis(1_700_000_000_100) });
    });
    const moderatorDb = env.authenticatedContext("moderator-1", { moderator: true }).firestore();
    await assertSucceeds(getDoc(doc(moderatorDb, "chats/listen_reported")));
    await assertSucceeds(getDoc(doc(moderatorDb, "chats/listen_reported/messages/m1")));
    await assertSucceeds(getDoc(doc(moderatorDb, "experienceMatchCircles/circle_reported")));
    await assertSucceeds(getDoc(doc(moderatorDb, "experienceMatchCircles/circle_reported/messages/m1")));
    await assertFails(getDocs(collection(moderatorDb, "chats")));
    await assertFails(getDocs(collection(moderatorDb, "experienceMatchCircles")));
    await assertFails(getDoc(doc(db("mallory"), "chats/listen_reported/messages/m1")));
  });

  it("removes a blocked member from a group while preserving access for the blocker and other members", async () => {
    await env.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "experienceMatchCircles/circle-block-pair"), {
        participants: ["alice", "bob", "carol"], status: "open", experienceTag: "stress",
        capacity: 8, createdAt: Timestamp.fromMillis(1_700_000_000_000),
        updatedAt: Timestamp.fromMillis(1_700_000_000_000),
      });
      await setDoc(doc(adminDb, "communityMatchProfiles/bob"), {
        ownerId: "bob", active: true, activeTags: ["stress"], preference: "either", conversationMode: "group",
      });
      await setDoc(doc(adminDb, "experienceMatchCircles/circle-block-pair/messages/seed"), {
        senderId: "carol", text: "group context", createdAt: Timestamp.fromMillis(1_700_000_000_100),
      });
    });

    await assertFails(updateDoc(doc(db("alice"), "experienceMatchCircles/circle-block-pair"), {
      participants: ["alice", "carol"], status: "open",
      updatedAt: Timestamp.fromMillis(1_700_000_000_190),
    }));

    await assertSucceeds(setDoc(doc(db("alice"), "blockPairs/pair_5_alice_3_bob"), {
      blockerId: "alice", blockedUserId: "bob", blockedBy: ["alice"],
      createdAt: Timestamp.fromMillis(1_700_000_000_200),
    }));

    await assertFails(updateDoc(doc(db("alice"), "experienceMatchCircles/circle-block-pair"), {
      participants: ["alice", "bob"], status: "open",
      updatedAt: Timestamp.fromMillis(1_700_000_000_240),
    }));
    await assertSucceeds(updateDoc(doc(db("alice"), "experienceMatchCircles/circle-block-pair"), {
      participants: ["alice", "carol"], status: "open",
      updatedAt: Timestamp.fromMillis(1_700_000_000_250),
    }));

    await assertSucceeds(getDoc(doc(db("alice"), "experienceMatchCircles/circle-block-pair")));
    await assertFails(getDoc(doc(db("bob"), "experienceMatchCircles/circle-block-pair")));
    await assertSucceeds(getDoc(doc(db("carol"), "experienceMatchCircles/circle-block-pair")));
    await assertSucceeds(getDoc(doc(db("alice"), "experienceMatchCircles/circle-block-pair/messages/seed")));
    await assertFails(getDoc(doc(db("bob"), "experienceMatchCircles/circle-block-pair/messages/seed")));
    await assertSucceeds(getDoc(doc(db("carol"), "experienceMatchCircles/circle-block-pair/messages/seed")));

    await assertFails(updateDoc(doc(db("bob"), "experienceMatchCircles/circle-block-pair"), {
      participants: ["alice", "bob", "carol"], status: "open",
      updatedAt: Timestamp.fromMillis(1_700_000_000_260),
    }));
    await assertFails(setDoc(doc(db("bob"), "experienceMatchCircles/circle-block-pair/messages/bob-blocked"), {
      senderId: "bob", text: "must be rejected", createdAt: Timestamp.fromMillis(1_700_000_000_300),
    }));
    await assertSucceeds(setDoc(doc(db("alice"), "experienceMatchCircles/circle-block-pair/messages/alice-ok"), {
      senderId: "alice", text: "blocker can continue with the group", createdAt: Timestamp.fromMillis(1_700_000_000_302),
    }));
    await assertSucceeds(setDoc(doc(db("carol"), "experienceMatchCircles/circle-block-pair/messages/carol-ok"), {
      senderId: "carol", text: "unrelated member can continue", createdAt: Timestamp.fromMillis(1_700_000_000_303),
    }));
  });

  it("prevents forging a block pair and permits the other participant to block back", async () => {
    await assertSucceeds(getDoc(doc(db("alice"), "blockPairs/pair_5_alice_3_bob")));
    await assertFails(getDoc(doc(db("mallory"), "blockPairs/pair_5_alice_3_bob")));
    await assertFails(setDoc(doc(db("mallory"), "blockPairs/pair_5_alice_3_bob"), {
      blockerId: "alice", blockedUserId: "bob", blockedBy: ["alice"],
      createdAt: Timestamp.fromMillis(1_700_000_000_400),
    }));
    await assertFails(deleteDoc(doc(db("alice"), "blockPairs/pair_5_alice_3_bob")));
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), "blockPairs/pair_5_alice_3_bob"), {
        blockerId: "alice", blockedUserId: "bob", blockedBy: ["alice"],
        createdAt: Timestamp.fromMillis(1_700_000_000_400),
      });
    });
    await assertSucceeds(updateDoc(doc(db("bob"), "blockPairs/pair_5_alice_3_bob"), {
      blockedBy: ["alice", "bob"],
    }));
    await assertFails(updateDoc(doc(db("mallory"), "blockPairs/pair_5_alice_3_bob"), {
      blockedBy: ["alice", "bob", "mallory"],
    }));
  });

  it("keeps an eight-member group within Firestore rule access limits when no blocks exist", async () => {
    const participants = ["alice", "bob", "carol", "dave", "erin", "frank", "grace", "heidi"];
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), "experienceMatchCircles/circle-eight"), {
        participants, status: "full", experienceTag: "stress", capacity: 8,
        createdAt: Timestamp.fromMillis(1_700_000_000_000), updatedAt: Timestamp.fromMillis(1_700_000_000_000),
      });
      await setDoc(doc(context.firestore(), "experienceMatchCircles/circle-eight/messages/seed"), {
        senderId: "heidi", text: "eight members", createdAt: Timestamp.fromMillis(1_700_000_000_100),
      });
    });
    await assertSucceeds(getDoc(doc(db("alice"), "experienceMatchCircles/circle-eight/messages/seed")));
    await assertSucceeds(setDoc(doc(db("alice"), "experienceMatchCircles/circle-eight/messages/alice-ok"), {
      senderId: "alice", text: "within access budget", createdAt: Timestamp.fromMillis(1_700_000_000_200),
    }));
  });

  it("allows a user to check missing legacy and length-prefixed block paths only for their own UID", async () => {
    await assertSucceeds(getDoc(doc(db("alice"), "blocks/alice_bob")));
    await assertSucceeds(getDoc(doc(db("alice"), "blocks/5_alice_3_bob")));
    await assertFails(getDoc(doc(db("mallory"), "blocks/5_alice_3_bob")));
  });

  it("allows each participant to read only block records involving their own UID", async () => {
    await assertSucceeds(setDoc(doc(db("alice"), "blocks/alice_bob"), { blockerId: "alice", blockedUserId: "bob", createdAt: Timestamp.fromMillis(1_700_000_000_000) }));
    await assertSucceeds(getDocs(query(collection(db("alice"), "blocks"), where("blockerId", "==", "alice"))));
    await assertSucceeds(getDocs(query(collection(db("bob"), "blocks"), where("blockedUserId", "==", "bob"))));
    await assertFails(getDocs(collection(db("mallory"), "blocks")));
  });


  it("prevents blocked users from creating a private chat or sending messages in an existing chat", async () => {
    await env.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "posts/p-blocked"), { ...post("alice"), greenLikedBy: ["bob"], greenLikes: 1 });
      await setDoc(doc(adminDb, "chats/c-blocked"), {
        participants: ["alice", "bob"], authorId: "alice", postId: "p-blocked",
        createdAt: Timestamp.fromMillis(1_700_000_000_000), lastMessage: "",
        lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
      });
    });
    await assertSucceeds(setDoc(doc(db("alice"), "blocks/alice_bob"), {
      blockerId: "alice", blockedUserId: "bob", createdAt: Timestamp.fromMillis(1_700_000_000_001),
    }));
    await assertSucceeds(setDoc(doc(db("alice"), "blockPairs/pair_5_alice_3_bob"), {
      blockerId: "alice", blockedUserId: "bob", blockedBy: ["alice"],
      createdAt: Timestamp.fromMillis(1_700_000_000_001),
    }));
    await assertFails(setDoc(doc(db("bob"), "chats/p-blocked_alice_bob"), {
      participants: ["alice", "bob"], authorId: "alice", postId: "p-blocked",
      createdAt: Timestamp.fromMillis(1_700_000_000_000), lastMessage: "",
      lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
    }));
    await assertFails(getDoc(doc(db("alice"), "chats/c-blocked")));
    await assertFails(getDoc(doc(db("bob"), "chats/c-blocked")));
    await assertFails(getDoc(doc(db("alice"), "chats/c-blocked/messages/m1")));
    await assertFails(setDoc(doc(db("bob"), "chats/c-blocked/messages/m1"), {
      senderId: "bob", text: "blocked message", createdAt: Timestamp.fromMillis(1_700_000_000_002),
    }));
  });

  it("keeps legacy-only private blocks effective during client upgrades", async () => {
    await env.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "chats/c-legacy-block"), {
        participants: ["frank", "grace"], authorId: "frank", postId: "p-legacy",
        createdAt: Timestamp.fromMillis(1_700_000_000_000), lastMessage: "",
        lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
      });
    });
    await assertSucceeds(setDoc(doc(db("frank"), "blocks/frank_grace"), {
      blockerId: "frank", blockedUserId: "grace", createdAt: Timestamp.fromMillis(1_700_000_000_001),
    }));
    await assertFails(getDoc(doc(db("frank"), "chats/c-legacy-block")));
    await assertFails(getDoc(doc(db("grace"), "chats/c-legacy-block")));
  });

  it("blocks private chat access when only the canonical pair record exists", async () => {
    await env.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "chats/c-canonical-block"), {
        participants: ["diana", "edward"], authorId: "diana", postId: "p-canonical",
        createdAt: Timestamp.fromMillis(1_700_000_000_000), lastMessage: "",
        lastMessageAt: Timestamp.fromMillis(1_700_000_000_000),
      });
      await setDoc(doc(adminDb, "blockPairs/pair_5_diana_6_edward"), {
        blockerId: "diana", blockedUserId: "edward", blockedBy: ["diana"],
        createdAt: Timestamp.fromMillis(1_700_000_000_001),
      });
    });
    await assertFails(getDoc(doc(db("diana"), "chats/c-canonical-block")));
    await assertFails(getDoc(doc(db("edward"), "chats/c-canonical-block")));
  });

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

  it("allows the unread inbox query without granting access to unrelated chat documents", async () => {
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), "chats/unread-inbox"), {
        participants: ["alice", "bob"], authorId: "bob", postId: "p-inbox",
        createdAt: Timestamp.fromMillis(1_700_000_000_000), lastMessage: "hello",
        lastMessageAt: Timestamp.fromMillis(1_700_000_100_000), lastSenderId: "bob", unreadBy: ["alice"],
      });
      await setDoc(doc(context.firestore(), "chats/unread-inbox-older"), {
        participants: ["alice", "carol"], authorId: "carol", postId: "p-older",
        createdAt: Timestamp.fromMillis(1_700_000_000_000), lastMessage: "older",
        lastMessageAt: Timestamp.fromMillis(1_700_000_050_000), lastSenderId: "carol", unreadBy: ["alice"],
      });
    });
    const newestUnread = await getDocs(query(
      collection(db("alice"), "chats"),
      where("unreadBy", "array-contains", "alice"),
      orderBy("lastMessageAt", "desc"),
      limit(1)
    ));
    if (newestUnread.size !== 1 || newestUnread.docs[0]?.id !== "unread-inbox") {
      throw new Error("A consulta deve devolver apenas a conversa não lida mais recente.");
    }
    await assertFails(setDoc(doc(db("alice"), "chats/forged-unread"), {
      participants: ["alice", "bob"], authorId: "alice", postId: "p-inbox",
      createdAt: Timestamp.fromMillis(1_700_000_000_000), lastMessage: "",
      lastMessageAt: Timestamp.fromMillis(1_700_000_000_000), unreadBy: ["mallory"],
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
  it("allows an active listener to query waiting requests for an opted-in theme", async () => {
    const now = Date.now();
    await assertSucceeds(setDoc(doc(db("bob"), "listeningProfiles/bob"), {
      ownerId: "bob", active: true, themes: ["loneliness"], updatedAt: Timestamp.fromMillis(now),
    }));
    await assertSucceeds(setDoc(doc(db("alice"), "listeningRequests/listen-inbox-query"), {
      requesterId: "alice", theme: "loneliness", note: "Need someone to listen", status: "waiting",
      acceptedBy: null, createdAt: Timestamp.fromMillis(now), expiresAt: Timestamp.fromMillis(now + 600_000),
    }));

    const inboxQuery = query(
      collection(db("bob"), "listeningRequests"),
      where("status", "==", "waiting"),
      where("theme", "==", "loneliness"),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await assertSucceeds(getDocs(inboxQuery));
    if (!snapshot.docs.some(item => item.id === "listen-inbox-query")) {
      throw new Error("the opted-in listener should receive the waiting request");
    }
  });

  it("allows a listening request to be accepted only with its private chat in the same transaction", async () => {
    const now = Date.now();
    const volunteerDb = db("bob");
    await assertSucceeds(setDoc(doc(db("bob"), "listeningProfiles/bob"), {
      ownerId: "bob", active: true, themes: ["anxiety"], updatedAt: Timestamp.fromMillis(now),
    }));
    await assertSucceeds(setDoc(doc(db("alice"), "listeningRequests/listen-test-1"), {
      requesterId: "alice", theme: "anxiety", note: "Need someone to listen", status: "waiting",
      acceptedBy: null, createdAt: Timestamp.fromMillis(now), expiresAt: Timestamp.fromMillis(now + 600_000),
    }));

    await assertSucceeds(runTransaction(volunteerDb, async tx => {
      const requestRef = doc(volunteerDb, "listeningRequests/listen-test-1");
      const requestSnap = await tx.get(requestRef);
      if (!requestSnap.exists()) throw new Error("request missing");
      tx.update(requestRef, { status: "matched", acceptedBy: "bob", matchedAt: Timestamp.fromMillis(now + 1) });
      tx.set(doc(volunteerDb, "chats/listen_listen-test-1"), {
        participants: ["alice", "bob"], authorId: "alice", postId: "listen_listen-test-1",
        listeningRequestId: "listen-test-1", listeningTheme: "anxiety",
        createdAt: Timestamp.fromMillis(now + 1), lastMessage: "",
        lastMessageAt: Timestamp.fromMillis(now + 1), unreadBy: [],
      });
    }));
  });

  it("allows a volunteer to accept multiple simultaneous listening conversations", async () => {
    const now = Date.now();
    const volunteerDb = db("bob");
    await assertSucceeds(setDoc(doc(db("bob"), "listeningProfiles/bob"), {
      ownerId: "bob", active: true, themes: ["anxiety", "stress"], updatedAt: Timestamp.fromMillis(now),
    }));
    for (const [requestId, requesterId, theme] of [
      ["listen-multi-1", "alice", "anxiety"],
      ["listen-multi-2", "carol", "stress"],
    ] as const) {
      await assertSucceeds(setDoc(doc(db(requesterId), `listeningRequests/${requestId}`), {
        requesterId, theme, note: "Need someone to listen", status: "waiting",
        acceptedBy: null, createdAt: Timestamp.fromMillis(now), expiresAt: Timestamp.fromMillis(now + 600_000),
      }));
      await assertSucceeds(runTransaction(volunteerDb, async tx => {
        const requestRef = doc(volunteerDb, `listeningRequests/${requestId}`);
        const snap = await tx.get(requestRef);
        if (!snap.exists()) throw new Error("request missing");
        tx.update(requestRef, { status: "matched", acceptedBy: "bob", matchedAt: Timestamp.fromMillis(now + 1) });
        const chatId = `listen_${requestId}`;
        tx.set(doc(volunteerDb, `chats/${chatId}`), {
          participants: [requesterId, "bob"].sort(), authorId: requesterId, postId: chatId,
          listeningRequestId: requestId, listeningTheme: theme,
          createdAt: Timestamp.fromMillis(now + 1), lastMessage: "",
          lastMessageAt: Timestamp.fromMillis(now + 1), unreadBy: [],
        });
      }));
    }
    const volunteerProfile = await getDoc(doc(db("bob"), "listeningProfiles/bob"));
    if (!volunteerProfile.exists() || volunteerProfile.data().active !== true) {
      throw new Error("volunteer should remain available for additional conversations");
    }
    const firstChat = await getDoc(doc(db("bob"), "chats/listen_listen-multi-1"));
    const secondChat = await getDoc(doc(db("bob"), "chats/listen_listen-multi-2"));
    if (!firstChat.exists() || !secondChat.exists()) throw new Error("both listening chats should exist");
  });

  it("rejects claiming a listening request without creating its chat atomically", async () => {
    const now = Date.now();
    await assertSucceeds(setDoc(doc(db("bob"), "listeningProfiles/bob"), {
      ownerId: "bob", active: true, themes: ["anxiety"], updatedAt: Timestamp.fromMillis(now),
    }));
    await assertSucceeds(setDoc(doc(db("alice"), "listeningRequests/listen-test-2"), {
      requesterId: "alice", theme: "anxiety", note: "Need someone to listen", status: "waiting",
      acceptedBy: null, createdAt: Timestamp.fromMillis(now), expiresAt: Timestamp.fromMillis(now + 600_000),
    }));
    await assertFails(updateDoc(doc(db("bob"), "listeningRequests/listen-test-2"), {
      status: "matched", acceptedBy: "bob", matchedAt: Timestamp.fromMillis(now + 1),
    }));
  });

  it("allows a matched listening participant to delete their own request but rejects unrelated users", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "listeningRequests/listen-delete-test"), {
        requesterId: "alice",
        theme: "anxiety",
        note: "Need someone to listen",
        status: "matched",
        acceptedBy: "bob",
        createdAt: Timestamp.fromMillis(1_700_000_000_000),
        expiresAt: Timestamp.fromMillis(1_700_000_600_000),
      });
    });

    await assertFails(deleteDoc(doc(db("mallory"), "listeningRequests/listen-delete-test")));
    await assertSucceeds(deleteDoc(doc(db("bob"), "listeningRequests/listen-delete-test")));
  });

  it("allows the requester to delete their own listening request", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "listeningRequests/listen-requester-delete-test"), {
        requesterId: "alice",
        theme: "stress",
        note: "",
        status: "waiting",
        acceptedBy: null,
        createdAt: Timestamp.fromMillis(1_700_000_000_000),
        expiresAt: Timestamp.fromMillis(1_700_000_600_000),
      });
    });

    await assertSucceeds(deleteDoc(doc(db("alice"), "listeningRequests/listen-requester-delete-test")));
  });

  it("allows an assigned listener to query and delete a closed SOS request and its closed chat data", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "listeningRequests/listen-closed-cleanup"), {
        requesterId: "alice",
        theme: "anxiety",
        note: "test",
        status: "closed",
        acceptedBy: "bob",
        createdAt: Timestamp.fromMillis(1_700_000_000_000),
        expiresAt: Timestamp.fromMillis(1_700_000_600_000),
        closedAt: Timestamp.fromMillis(1_700_000_100_000),
      });
      await setDoc(doc(adminDb, "chats/listen_listen-closed-cleanup"), {
        participants: ["alice"],
        authorId: "alice",
        postId: "listen_listen-closed-cleanup",
        listeningRequestId: "listen-closed-cleanup",
        closedBy: "bob",
        closedAt: Timestamp.fromMillis(1_700_000_100_000),
        createdAt: Timestamp.fromMillis(1_700_000_000_000),
        lastMessage: "",
        lastMessageAt: null,
        unreadBy: [],
      });
      await setDoc(doc(adminDb, "chats/listen_listen-closed-cleanup/messages/m1"), {
        senderId: "bob",
        text: "test message",
      });
    });

    const assignedClosedRequests = query(
      collection(db("bob"), "listeningRequests"),
      where("acceptedBy", "==", "bob"),
      where("status", "in", ["matched", "closed"]),
    );
    await assertSucceeds(getDocs(assignedClosedRequests));

    const closedChats = query(collection(db("bob"), "chats"), where("closedBy", "==", "bob"));
    await assertSucceeds(getDocs(closedChats));
    await assertFails(getDocs(query(collection(db("mallory"), "chats"), where("closedBy", "==", "bob"))));

    await assertSucceeds(getDocs(collection(db("bob"), "chats/listen_listen-closed-cleanup/messages")));
    await assertSucceeds(getDoc(doc(db("alice"), "chats/listen_listen-closed-cleanup")));
    await assertSucceeds(getDoc(doc(db("alice"), "chats/listen_listen-closed-cleanup/messages/m1")));
    await assertSucceeds(deleteDoc(doc(db("bob"), "chats/listen_listen-closed-cleanup/messages/m1")));
    await assertSucceeds(deleteDoc(doc(db("bob"), "chats/listen_listen-closed-cleanup")));
    await assertSucceeds(deleteDoc(doc(db("bob"), "listeningRequests/listen-closed-cleanup")));
  });

  it("keeps Experience Matching preferences private", async () => {
    await assertSucceeds(setDoc(doc(db("bob"), "communityMatchProfiles/bob"), {
      ownerId: "bob",
      active: true,
      activeTags: ["separation_divorce"],
      preference: "same_now",
      conversationMode: "either",
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

  it("keeps a match request pending when a block prevents atomic chat creation", async () => {
    await env.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "posts/p-blocked-match"), {
        ...post("alice"), experienceTag: "stress", supportMode: "share",
      });
      await setDoc(doc(adminDb, "communityMatchRequests/bob_p-blocked-match"), {
        requesterId: "bob", recipientId: "alice", postId: "p-blocked-match",
        experienceTag: "stress", status: "pending",
        createdAt: Timestamp.fromMillis(1_700_000_000_000),
      });
      await setDoc(doc(adminDb, "blockPairs/pair_5_alice_3_bob"), {
        blockerId: "alice", blockedUserId: "bob", blockedBy: ["alice"],
        createdAt: Timestamp.fromMillis(1_700_000_000_000),
      });
    });

    await assertFails(runTransaction(db("alice"), async transaction => {
      const requestRef = doc(db("alice"), "communityMatchRequests/bob_p-blocked-match");
      const chatRef = doc(db("alice"), "chats/match_bob_p-blocked-match");
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) throw new Error("request missing");
      transaction.update(requestRef, {
        status: "accepted", respondedAt: Timestamp.fromMillis(1_700_000_100_000),
      });
      transaction.set(chatRef, {
        participants: ["alice", "bob"], authorId: "alice", postId: "p-blocked-match",
        matchRequestId: "bob_p-blocked-match",
        createdAt: Timestamp.fromMillis(1_700_000_100_000), lastMessage: "",
        lastMessageAt: Timestamp.fromMillis(1_700_000_100_000), unreadBy: [],
      });
    }));

    const stillPending = await getDoc(doc(db("alice"), "communityMatchRequests/bob_p-blocked-match"));
    if (!stillPending.exists() || stillPending.data().status !== "pending") {
      throw new Error("a blocked match must remain pending when chat creation is rejected");
    }
    const absentChat = await getDoc(doc(db("alice"), "chats/match_bob_p-blocked-match"));
    if (absentChat.exists()) throw new Error("blocked match must not create a chat");
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

    await assertSucceeds(runTransaction(db("alice"), async transaction => {
      const requestRef = doc(db("alice"), "communityMatchRequests/bob_p-match");
      const chatRef = doc(db("alice"), "chats/match_bob_p-match");
      const requestSnap = await transaction.get(requestRef);
      const chatSnap = await transaction.get(chatRef);
      if (!requestSnap.exists() || chatSnap.exists()) throw new Error("invalid match test state");
      transaction.update(requestRef, {
        status: "accepted",
        respondedAt: Timestamp.fromMillis(1_700_000_100_000),
      });
      transaction.set(chatRef, chatPayload);
    }));
    await assertFails(updateDoc(doc(db("bob"), "communityMatchRequests/bob_p-match"), {
      status: "declined",
      respondedAt: Timestamp.fromMillis(1_700_000_200_000),
    }));
  });

});
