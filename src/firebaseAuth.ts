import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { app } from "./firebaseApp";

export const auth = getAuth(app);

export async function initAnonymousAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  await signInAnonymously(auth);

  return auth.currentUser;
}

export { onAuthStateChanged, signInAnonymously };
