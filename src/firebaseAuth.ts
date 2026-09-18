import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { app } from "./firebaseApp";

export const auth = getAuth(app);

export async function initAnonymousAuth() {
  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
    return auth.currentUser;
  }

  await signInAnonymously(auth);

  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
  }

  return auth.currentUser;
}

export { onAuthStateChanged, signInAnonymously };
