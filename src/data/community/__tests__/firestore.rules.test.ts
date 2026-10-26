import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, Timestamp, runTransaction } from "firebase/firestore";

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
