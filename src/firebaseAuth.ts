import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { app } from "./firebaseApp";

export const auth = getAuth(app);

// Share one in-flight anonymous sign-in between background startup and the
// Community tab. Concurrent callers must not launch duplicate auth requests.
let anonymousAuthPromise: Promise<void> | null = null;

export async function initAnonymousAuth() {
  if (auth.currentUser) return auth.currentUser;

  if (!anonymousAuthPromise) {
    anonymousAuthPromise = signInAnonymously(auth)
      .then(() => undefined)
      .finally(() => { anonymousAuthPromise = null; });
  }

  await anonymousAuthPromise;
  return auth.currentUser;
}

export { onAuthStateChanged, signInAnonymously };
