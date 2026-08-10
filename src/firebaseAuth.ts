import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

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

export { onAuthStateChanged };
