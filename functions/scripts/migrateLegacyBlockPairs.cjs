// One-time migration before deploying the blockPairs Firestore rules.
// Run from functions/: node scripts/migrateLegacyBlockPairs.cjs --apply
// Without --apply, the script performs a read-only dry-run.
// Uses Application Default Credentials and never deletes or rewrites legacy blocks.
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) initializeApp();
const db = getFirestore();

function pairId(a, b) {
  const [first, second] = [a, b].sort();
  return "pair_" + first.length + "_" + first + "_" + second.length + "_" + second;
}

async function main() {
  const legacy = await db.collection("blocks").get();
  const pairs = new Map();

  for (const snapshot of legacy.docs) {
    const data = snapshot.data();
    if (typeof data.blockerId !== "string" || typeof data.blockedUserId !== "string"
      || !data.blockerId || !data.blockedUserId || data.blockerId === data.blockedUserId) continue;
    const id = pairId(data.blockerId, data.blockedUserId);
    const current = pairs.get(id) || {
      blockerId: data.blockerId,
      blockedUserId: data.blockedUserId,
      blockedBy: new Set(),
      createdAt: data.createdAt || new Date(),
    };
    current.blockedBy.add(data.blockerId);
    pairs.set(id, current);
  }

  const apply = process.argv.includes("--apply");
  let batch = db.batch();
  let writes = 0;
  for (const [id, pair] of pairs) {
    const ref = db.collection("blockPairs").doc(id);
    const existing = await ref.get();
    const existingData = existing.exists ? existing.data() : {};
    const blockedBy = new Set([
      ...(Array.isArray(existingData.blockedBy) ? existingData.blockedBy : []),
      ...pair.blockedBy,
    ]);
    if (apply) {
      batch.set(ref, {
        blockerId: existingData.blockerId || pair.blockerId,
        blockedUserId: existingData.blockedUserId || pair.blockedUserId,
        blockedBy: [...blockedBy],
        createdAt: existingData.createdAt || pair.createdAt,
      }, { merge: true });
      writes += 1;
      if (writes === 450) {
        await batch.commit();
        batch = db.batch();
        writes = 0;
      }
    }
  }
  if (apply && writes) await batch.commit();
  process.stdout.write((apply ? "Migrated canonical pairs" : "Dry-run; no writes. Pairs to migrate")
    + ": " + pairs.size + "\n");
}

main().catch(error => {
  process.stderr.write(String(error && error.stack || error) + "\n");
  process.exitCode = 1;
});
