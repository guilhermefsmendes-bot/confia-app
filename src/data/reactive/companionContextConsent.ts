import { getHabitOwner } from "../habits/store";

const consentKey = () => "confia_companion_personal_context_v1:" + (getHabitOwner() ?? "local");

export function readCompanionPersonalContextConsent(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(consentKey()) === "enabled"; }
  catch { return false; }
}

export function writeCompanionPersonalContextConsent(enabled: boolean): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(consentKey(), enabled ? "enabled" : "disabled");
    window.dispatchEvent(new Event("confia:companion-context-consent-changed"));
    return true;
  } catch { return false; }
}
