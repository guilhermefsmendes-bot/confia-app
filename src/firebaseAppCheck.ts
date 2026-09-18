import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { app } from "./firebaseApp";

let initialized = false;

export function initAppCheck() {
  if (initialized || typeof window === "undefined") return;
  const siteKey = String(import.meta.env.VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY || "");
  if (!siteKey) {
    console.warn("[Confia] App Check is not configured. Set VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY for production hardening.");
    return;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    initialized = true;
  } catch (error) {
    console.warn("[Confia] App Check could not be initialized.", error);
  }
}
