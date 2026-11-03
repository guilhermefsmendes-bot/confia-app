import { httpsCallable, getFunctions } from "firebase/functions";
import { reload, signOut } from "firebase/auth";
import { auth } from "../firebaseAuth";
import { clearNativeNotices } from "../notifications/service";
import { pauseHabitSyncForDeletion, resumeHabitSyncAfterDeletionError } from "../data/habits/sync";
import { app } from "../firebaseApp";

const functions = getFunctions(app, "europe-west1");

function clearLocalAccountData() {
  try { localStorage.clear(); } catch { /* Storage may be unavailable in restricted contexts. */ }
  try { sessionStorage.clear(); } catch { /* Storage may be unavailable in restricted contexts. */ }
}

async function authIdentityWasDeleted(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    await reload(user);
    return false;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
    return code === "auth/user-not-found";
  }
}

export async function deleteAllUserData(): Promise<void> {
  await clearNativeNotices();
  await pauseHabitSyncForDeletion();
  try {
    const deleteAccountData = httpsCallable(functions, "deleteAccountData", { timeout: 540_000 });
    await deleteAccountData({});
    // The server removes the Firebase Auth identity after the remote data pass.
    // Clear local-only data only after the server confirms completion.
    try { await signOut(auth); } catch { /* The server-side Auth deletion already succeeded. */ }
    clearLocalAccountData();
  } catch (error) {
    // A network response can be lost after the server has deleted Auth.
    // Reload distinguishes that completed operation from a retryable partial failure.
    if (await authIdentityWasDeleted()) {
      try { await signOut(auth); } catch { /* The identity no longer exists. */ }
      clearLocalAccountData();
      return;
    }
    resumeHabitSyncAfterDeletionError();
    throw error;
  }
}
