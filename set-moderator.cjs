const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp({
  projectId: "confia-b952e"
});

const auth = getAuth();

const UID = "lc8WMgRjWtVmXwQUFzRiGG8QXHf1";

async function main() {
  await auth.setCustomUserClaims(UID, {
    moderator: true
  });

  console.log("Moderador definido com sucesso.");
  console.log("UID:", UID);
}

main().catch((error) => {
  console.error("Erro:", error);
  process.exit(1);
});
