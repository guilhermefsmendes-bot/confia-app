const admin = require("firebase-admin");

async function main() {
  const [uid, action = "grant"] = process.argv.slice(2);
  if (!uid || !["grant", "revoke"].includes(action)) {
    throw new Error("Uso: node scripts/set-moderator-claim.cjs <FIREBASE_UID> [grant|revoke]");
  }
  if (!admin.apps.length) admin.initializeApp({ projectId: "confia-b952e" });
  const user = await admin.auth().getUser(uid);
  const claims = { ...(user.customClaims || {}) };
  if (action === "grant") claims.moderator = true;
  else delete claims.moderator;
  await admin.auth().setCustomUserClaims(uid, claims);
  console.log(`${action === "grant" ? "Autorização de moderador atribuída a" : "Autorização de moderador removida de"} ${uid}.`);
  console.log("O utilizador deve renovar o token de autenticação para receber a alteração.");
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});
