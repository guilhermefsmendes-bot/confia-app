import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";

let env: RulesTestEnvironment;
const rules = readFileSync("firestore.rules", "utf8");
const projectId = "confia-circles-rules-test";
const now = Timestamp.fromMillis(1_700_000_300_000);

before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: { rules } });
  await env.withSecurityRulesDisabled(async context => {
    const adminDb = context.firestore();
    for (const uid of ["u1","u2","u3","u4","u5","u6","u7","u8","u9"]) {
      await setDoc(doc(adminDb, "communityMatchProfiles/" + uid), {
        ownerId: uid, active: true, activeTags: ["stress"],
        preference: "either", conversationMode: "group", updatedAt: now
      });
    }
  });
});
after(async () => env.cleanup());
const db = (uid: string) => env.authenticatedContext(uid).firestore();

describe("Experience Matching circles", () => {  it("enforces the eight member capacity", async () => {
    const circle = "experienceMatchCircles/circle_stress_test";
    await assertSucceeds(setDoc(doc(db("u1"), circle), {
      experienceTag: "stress",
      participants: ["u1"],
      capacity: 8,
      status: "open",
      createdAt: now,
      updatedAt: now
    }));
    let members = ["u1"];
    for (const uid of ["u2","u3","u4","u5","u6","u7","u8"]) {
      members = [...members, uid];
      await assertSucceeds(updateDoc(doc(db(uid), circle), {
        participants: members,
        status: members.length === 8 ? "full" : "open",
        updatedAt: now
      }));
    }
    await assertFails(updateDoc(doc(db("u9"), circle), {
      participants: [...members, "u9"],
      status: "full",
      updatedAt: now
    }));
  });
  it("protects circle membership and messages", async () => {
    const circle = "experienceMatchCircles/circle_stress_test";
    const snap = await getDoc(doc(db("u1"), circle));
    const members = snap.data()!.participants as string[];
    await assertFails(updateDoc(doc(db("u1"), circle), {
      participants: members.filter(x => x !== "u2"),
      status: "open",
      updatedAt: now
    }));
    await assertSucceeds(updateDoc(doc(db("u8"), circle), {
      participants: members.filter(x => x !== "u8"),
      status: "open",
      updatedAt: now
    }));
    const message = circle + "/messages/m1";
    await assertSucceeds(setDoc(doc(db("u1"), message), {
      senderId: "u1",
      text: "hello group",
      createdAt: now
    }));
    await assertFails(getDoc(doc(db("u9"), message)));
  });
  it("does not let one member expel another directly", async () => {
    const circle = "experienceMatchCircles/circle_safety_direct";
    await assertSucceeds(setDoc(doc(db("u1"), circle), { experienceTag:"stress", participants:["u1"], capacity:8, status:"open", createdAt:now, updatedAt:now }));
    await assertSucceeds(updateDoc(doc(db("u2"), circle), { participants:["u1","u2"], status:"open", updatedAt:now }));
    await assertSucceeds(updateDoc(doc(db("u3"), circle), { participants:["u1","u2","u3"], status:"open", updatedAt:now }));
    await assertFails(updateDoc(doc(db("u1"), circle), { participants:["u1","u3"], status:"open", updatedAt:now }));
  });


});
