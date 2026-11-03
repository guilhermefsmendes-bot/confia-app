import { arrayUnion, doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth } from "../../firebaseAuth";
import { db } from "../../firebaseFirestore";

/** Stable, direction-independent key: one Firestore lookup per blocked pair in group rules. */
export function getBlockPairId(firstUserId: string, secondUserId: string) {
  const [first, second] = [firstUserId, secondUserId].sort();
  // Length prefixes avoid collisions when a Firebase UID contains underscores.
  return "pair_" + first.length + "_" + first + "_" + second.length + "_" + second;
}

export async function blockCommunityMember(blockedUserId: string, circleId?: string) {
  const blockerId = auth.currentUser?.uid;
  if (!blockerId) throw new Error("authentication-required");
  if (!blockedUserId || blockedUserId === blockerId) throw new Error("invalid-block");

  const pairRef = doc(db, "blockPairs", getBlockPairId(blockerId, blockedUserId));
  const legacyRef = doc(
    db,
    "blocks",
    blockerId.length + "_" + blockerId + "_" + blockedUserId.length + "_" + blockedUserId
  );
  const [pairSnapshot, legacySnapshot] = await Promise.all([getDoc(pairRef), getDoc(legacyRef)]);
  const batch = writeBatch(db);
  let hasWrites = false;
  const legacyData = {
    blockerId,
    blockedUserId,
    ...(circleId ? { circleId } : {}),
    createdAt: serverTimestamp(),
  };

  if (legacySnapshot.exists()) {
    const legacy = legacySnapshot.data();
    if (legacy.blockerId !== blockerId || legacy.blockedUserId !== blockedUserId) throw new Error("invalid-legacy-block");
  } else {
    batch.set(legacyRef, legacyData);
    hasWrites = true;
  }

  if (pairSnapshot.exists()) {
    const pair = pairSnapshot.data();
    if (pair.blockerId !== blockerId && pair.blockedUserId !== blockerId) throw new Error("invalid-block-pair");
    if (pair.blockedUserId === blockerId && !(Array.isArray(pair.blockedBy) && pair.blockedBy.includes(blockerId))) {
      batch.update(pairRef, { blockedBy: arrayUnion(blockerId) });
      hasWrites = true;
    }
  } else {
    batch.set(pairRef, {
      blockerId,
      blockedUserId,
      blockedBy: [blockerId],
      createdAt: serverTimestamp(),
    });
    hasWrites = true;
  }

  if (hasWrites) await batch.commit();
}
