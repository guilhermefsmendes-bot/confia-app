import { useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, Clock3, Ear, HeartHandshake, LoaderCircle, MessageCircle, ShieldCheck, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auth } from "../firebaseAuth";
import {
  acceptListeningRequest, cancelListeningRequest, createListeningRequest,
  listeningRequestToPost, saveListeningProfile, subscribeListeningProfile, subscribeListeningRequests,
  type ListeningProfile, type ListeningRequest, type ListeningTheme
} from "../data/community/listeningSupportService";
import type { SharePost } from "../types";

interface Props {
  isOpen: boolean;
  initialView?: "talk" | "listen";
  onOpen: () => void;
  onClose: () => void;
  onOpenMatchedChat: (post: SharePost, chatId: string) => void;
  onIncomingRequestsChange?: (count: number) => void;
}
const THEME_KEYS: ListeningTheme[] = ["anxiety", "depression", "loneliness", "stress", "relationships", "grief", "selfEsteem", "other"];
const initialProfile: ListeningProfile = { active: false, themes: [] };

export function ListeningSupportModal({ isOpen, initialView = "talk", onOpen, onClose, onOpenMatchedChat, onIncomingRequestsChange }: Props) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ListeningProfile>(initialProfile);
  const [selectedThemes, setSelectedThemes] = useState<ListeningTheme[]>([]);
  const [available, setAvailable] = useState(false);
  const [requests, setRequests] = useState<ListeningRequest[]>([]);
  const [theme, setTheme] = useState<ListeningTheme>("anxiety");
  const [note, setNote] = useState("");
  const [view, setView] = useState<"talk" | "listen">("talk");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyRequest, setBusyRequest] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [subscriptionErrors, setSubscriptionErrors] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [localPendingRequest, setLocalPendingRequest] = useState<{ id: string; theme: ListeningTheme; expiresAtMs: number } | null>(null);
  const [noMatchNotice, setNoMatchNotice] = useState(false);

  useEffect(() => {
    // Só atualiza o relógio quando o modal está aberto ou há pedidos a expirar.
    // O intervalo não é recriado a cada tick; quando o último pedido expira
    // com o modal fechado, termina sozinho até chegar uma nova atualização.
    const hasUnexpiredRequest = (at: number) => requests.some(
      request => request.status === "waiting" && request.expiresAtMs > at
    );
    if (!isOpen && !hasUnexpiredRequest(Date.now())) return;
    const timer = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (!isOpen && !hasUnexpiredRequest(at)) window.clearInterval(timer);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [isOpen, requests]);
  useEffect(() => subscribeListeningProfile(next => {
    setProfile(next);
    setSelectedThemes(next.themes);
    setAvailable(next.active);
  }), []);
  useEffect(() => {
    setSubscriptionErrors([]);
    return subscribeListeningRequests(profile, setRequests, (channel, subscriptionError) => {
      setSubscriptionErrors(current => subscriptionError
        ? (current.includes(channel) ? current : [...current, channel])
        : current.filter(item => item !== channel));
    });
  }, [profile.active, profile.themes.join("|")]);
  useEffect(() => { if (isOpen) setView(initialView); }, [isOpen, initialView]);

  const uid = auth.currentUser?.uid;
  const outgoing = useMemo(() => requests.filter(r => r.requesterId === uid), [requests, uid]);
  const matched = outgoing.find(r => r.status === "matched" && r.acceptedBy);
  const waitingFromServer = outgoing.find(r => r.status === "waiting" && r.expiresAtMs > now);
  const waiting = matched ? undefined : waitingFromServer || (localPendingRequest && localPendingRequest.expiresAtMs > now ? {
    id: localPendingRequest.id, requesterId: uid || "", theme: localPendingRequest.theme,
    note: "", status: "waiting" as const, acceptedBy: null, createdAtMs: now, expiresAtMs: localPendingRequest.expiresAtMs
  } : undefined);
  const incoming = requests.filter(r => r.requesterId !== uid && r.status === "waiting" && r.expiresAtMs > now);
  const activeConversations = requests.filter(r => r.requesterId !== uid && r.acceptedBy === uid && r.status === "matched");

  // Mantém o botão de entrada atualizado mesmo quando o modal está fechado.
  useEffect(() => {
    onIncomingRequestsChange?.(incoming.length);
  }, [incoming.length, onIncomingRequestsChange]);
  useEffect(() => () => onIncomingRequestsChange?.(0), [onIncomingRequestsChange]);
  useEffect(() => {
    if (!localPendingRequest) return;
    const latest = requests.find(r => r.id === localPendingRequest.id);
    if (latest?.status === "matched") {
      setLocalPendingRequest(null);
      setNoMatchNotice(false);
      return;
    }
    if (latest && latest.status !== "waiting") {
      setLocalPendingRequest(null);
      if (latest.status === "expired") setNoMatchNotice(true);
      return;
    }
    if (localPendingRequest.expiresAtMs <= now) {
      setLocalPendingRequest(null);
      setNoMatchNotice(true);
    }
  }, [requests, localPendingRequest, now]);
  useEffect(() => {
    if (!matched && outgoing[0]?.status === "expired") setNoMatchNotice(true);
  }, [outgoing, matched]);
  const themeLabel = (value: ListeningTheme) => t("listeningSupport.themes." + value);

  if (!isOpen) {
    if (incoming.length === 0) return null;
    return (
      <button type="button" onClick={() => { setView("listen"); onOpen(); }} className="fixed left-3 right-3 top-4 z-[95] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-[#C9DCCB] bg-white p-3 text-left shadow-xl">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5EEE3] text-[#4E7457]"><BellRing size={20}/></span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black text-[#354B3B]">{t("listeningSupport.incomingToastTitle")}</span>
          <span className="mt-1 block text-[11px] text-[#6C766A]">{t("listeningSupport.incomingToastText", { theme: themeLabel(incoming[0].theme) })}</span>
        </span>
        <span className="text-lg text-[#64816A]">→</span>
      </button>
    );
  }

  const saveProfile = async () => {
    setSaving(true); setError("");
    try {
      await saveListeningProfile({ active: available && selectedThemes.length > 0, themes: selectedThemes });
      setProfile({ active: available && selectedThemes.length > 0, themes: selectedThemes });
    } catch (e) {
      console.error("[ListeningSupport] save profile:", e);
      setError(t("listeningSupport.errors.save"));
    } finally { setSaving(false); }
  };

  const requestTalk = async () => {
    if (waiting || matched || submitting) return;
    setSubmitting(true); setError(""); setNoMatchNotice(false);
    try {
      const id = await createListeningRequest(theme, note);
      setLocalPendingRequest({ id, theme, expiresAtMs: Date.now() + 10 * 60 * 1000 });
      setNote("");
    } catch (e) {
      console.error("[ListeningSupport] create request:", e);
      setError(t("listeningSupport.errors.request"));
    } finally { setSubmitting(false); }
  };

  const accept = async (request: ListeningRequest) => {
    setBusyRequest(request.id); setError("");
    try {
      const chatId = await acceptListeningRequest(request);
      onClose();
      onOpenMatchedChat(listeningRequestToPost({ ...request, status: "matched", acceptedBy: uid || "" }), chatId);
    } catch (e) {
      console.error("[ListeningSupport] accept request:", e);
      setError(t("listeningSupport.errors.accept"));
    } finally { setBusyRequest(null); }
  };

  const openMatched = (request: ListeningRequest) => {
    if (!request.acceptedBy) return;
    onClose();
    onOpenMatchedChat(listeningRequestToPost(request), "listen_" + request.id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="listening-support-title">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-[#FBFAF6] shadow-2xl sm:rounded-[28px]">
        <header className="flex items-center gap-3 border-b border-[#E5E3D9] px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E5EEE3] text-[#4E7457]"><HeartHandshake size={24}/></div>
          <div className="min-w-0 flex-1">
            <h2 id="listening-support-title" className="text-lg font-black text-[#354B3B]">{t("listeningSupport.title")}</h2>
            <p className="text-xs leading-5 text-[#6C766A]">{t("listeningSupport.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("close")} className="rounded-full p-2 text-[#6C766A] hover:bg-[#EDEFE8]"><X size={20}/></button>
        </header>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <div className="mb-4 flex rounded-xl bg-[#ECEFE7] p-1">
            <button type="button" onClick={() => setView("talk")} className={"flex-1 rounded-lg px-3 py-2.5 text-xs font-black " + (view === "talk" ? "bg-white text-[#3F6547] shadow-sm" : "text-[#697367]")}>{t("listeningSupport.tabs.talk")}</button>
            <button type="button" onClick={() => setView("listen")} className={"flex-1 rounded-lg px-3 py-2.5 text-xs font-black " + (view === "listen" ? "bg-white text-[#3F6547] shadow-sm" : "text-[#697367]")}>{t("listeningSupport.tabs.listen")}</button>
          </div>

          {error && <p role="alert" className="mb-3 rounded-xl border border-[#E8C7BD] bg-[#FFF1EC] p-3 text-xs leading-5 text-[#934A38]">{error}</p>}
          {subscriptionErrors.length > 0 && <p role="alert" className="mb-3 rounded-xl border border-[#E8C7BD] bg-[#FFF1EC] p-3 text-xs leading-5 text-[#934A38]">{t("listeningSupport.errors.connection")}</p>}

          {view === "talk" ? (
            <section className="space-y-4">
              <div className="rounded-2xl border border-[#D6E3D4] bg-white p-4">
                <h3 className="text-sm font-black text-[#354B3B]">{t("listeningSupport.chooseTheme")}</h3>
                <p className="mt-1 text-xs leading-5 text-[#6C766A]">{t("listeningSupport.chooseThemeText")}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {THEME_KEYS.map(key => (
                    <button key={key} type="button" onClick={() => setTheme(key)} className={"flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-bold transition-colors " + (theme === key ? "border-[#628568] bg-[#EEF5EC] text-[#3F6547]" : "border-[#E5E7DE] bg-white text-[#626B60]")}>
                      <span className={"flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " + (theme === key ? "border-[#628568] bg-[#628568] text-white" : "border-[#B7C0B4]")}>{theme === key ? "✓" : ""}</span>
                      <span>{themeLabel(key)}</span>
                    </button>
                  ))}
                </div>
                <label className="mt-4 block text-xs font-bold text-[#4B5E4D]">{t("listeningSupport.noteLabel")}</label>
                <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 300))} maxLength={300} rows={3} placeholder={t("listeningSupport.notePlaceholder")} className="mt-2 w-full resize-y rounded-xl border border-[#E0E4DA] bg-[#FCFCF9] p-3 text-sm text-[#344536] outline-none focus:border-[#7D9C7F] focus:ring-2 focus:ring-[#7D9C7F]/20"/>
                <p className="mt-1 text-right text-[10px] text-[#8A9386]">{note.length}/300</p>
                {noMatchNotice && <p role="status" className="mt-3 rounded-xl border border-[#E5D8B8] bg-[#FFF9E9] p-3 text-xs leading-5 text-[#806A3C]">{t("listeningSupport.noMatch")}</p>}
                {waiting ? (
                  <div className="mt-3 rounded-xl bg-[#F0F5ED] p-3">
                    <p className="flex items-center gap-2 text-xs font-black text-[#3F6547]"><Clock3 size={16}/>{t("listeningSupport.waitingTitle")}</p>
                    <p className="mt-1 text-xs leading-5 text-[#647260]">{t("listeningSupport.waitingText", { theme: themeLabel(waiting.theme) })}</p>
                    <button type="button" onClick={async () => { setSubmitting(true); try { await cancelListeningRequest(waiting); setLocalPendingRequest(null); } catch { setError(t("listeningSupport.errors.cancel")); } finally { setSubmitting(false); } }} disabled={submitting} className="mt-2 text-xs font-bold text-[#8B5142] underline">{t("listeningSupport.cancelRequest")}</button>
                  </div>
                ) : matched ? (
                  <button type="button" onClick={() => openMatched(matched)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#55795D] px-4 py-3 text-sm font-black text-white"><MessageCircle size={17}/>{t("listeningSupport.openConversation")}</button>
                ) : (
                  <button type="button" disabled={submitting} onClick={requestTalk} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#55795D] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                    {submitting ? <LoaderCircle size={17} className="animate-spin"/> : <Users size={17}/>}
                    {submitting ? t("listeningSupport.sending") : t("listeningSupport.requestButton")}
                  </button>
                )}
              </div>
              <div className="flex gap-2 rounded-xl border border-[#E3E3D9] bg-[#F4F3ED] p-3 text-[11px] leading-5 text-[#6F766B]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#64816A]"/><p>{t("listeningSupport.safetyNote")}</p></div>
              {matched && <div className="rounded-xl border border-[#D6E3D4] bg-white p-3"><p className="text-xs font-black text-[#3F6547]">{t("listeningSupport.matchedTitle")}</p><p className="mt-1 text-xs text-[#6C766A]">{themeLabel(matched.theme)}</p><button type="button" onClick={() => openMatched(matched)} className="mt-2 text-xs font-bold text-[#55795D] underline">{t("listeningSupport.openConversation")}</button></div>}
            </section>
          ) : (
            <section className="space-y-4">
              <div className="rounded-2xl border border-[#D6E3D4] bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#E5EEE3] p-2 text-[#4E7457]"><Ear size={20}/></div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-[#354B3B]">{t("listeningSupport.volunteerTitle")}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#6C766A]">{t("listeningSupport.volunteerText")}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {THEME_KEYS.map(key => {
                    const checked = selectedThemes.includes(key);
                    return <button key={key} type="button" onClick={() => setSelectedThemes(old => checked ? old.filter(x => x !== key) : [...old, key])} className={"flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-bold " + (checked ? "border-[#628568] bg-[#EEF5EC] text-[#3F6547]" : "border-[#E5E7DE] bg-white text-[#626B60]")}>
                      <span className={"flex h-4 w-4 shrink-0 items-center justify-center rounded border " + (checked ? "border-[#628568] bg-[#628568] text-white" : "border-[#B7C0B4]")}>{checked ? "✓" : ""}</span>
                      <span>{themeLabel(key)}</span>
                    </button>;
                  })}
                </div>
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-[#F4F6F0] p-3">
                  <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} className="h-4 w-4 accent-[#55795D]"/>
                  <span className="text-xs font-bold text-[#405944]">{t("listeningSupport.availableToggle")}</span>
                </label>
                <button type="button" disabled={saving || (available && selectedThemes.length === 0)} onClick={saveProfile} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#55795D] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                  {saving ? <LoaderCircle size={17} className="animate-spin"/> : <CheckCircle2 size={17}/>}
                  {saving ? t("listeningSupport.saving") : t("listeningSupport.saveAvailability")}
                </button>
                {profile.active && <p className="mt-2 text-center text-[11px] font-bold text-[#4F7556]">{t("listeningSupport.currentlyAvailable", { count: profile.themes.length })}</p>}
              </div>
              <div className="rounded-xl bg-[#F4F3ED] p-3 text-[11px] leading-5 text-[#6F766B]">{t("listeningSupport.volunteerSafety")}</div>
              {activeConversations.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-[#354B3B]"><MessageCircle size={17}/>{t("listeningSupport.openConversation")} ({activeConversations.length})</h3>
                  <div className="space-y-2">
                    {activeConversations.map(req => <article key={req.id} className="flex items-center gap-3 rounded-xl border border-[#D6E3D4] bg-white p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF5EC] text-[#55795D]"><MessageCircle size={17}/></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-[#354B3B]">{themeLabel(req.theme)}</p>
                        <p className="mt-1 truncate text-[10px] text-[#7B8578]">{req.note || t("listeningSupport.noNote")}</p>
                      </div>
                      <button type="button" onClick={() => openMatched(req)} className="shrink-0 rounded-lg bg-[#55795D] px-3 py-2 text-[10px] font-black text-white">{t("listeningSupport.openConversation")}</button>
                    </article>)}
                  </div>
                </div>
              )}
              {incoming.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-[#354B3B]"><BellRing size={17}/>{t("listeningSupport.incomingTitle", { count: incoming.length })}</h3>
                  <div className="space-y-3">
                    {incoming.map(req => <article key={req.id} className="rounded-2xl border border-[#D6E3D4] bg-white p-4">
                      <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-[#EEF5EC] px-3 py-1 text-[10px] font-black text-[#3F6547]">{themeLabel(req.theme)}</span><span className="text-[10px] text-[#899184]">{t("listeningSupport.newRequest")}</span></div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#465447]">{req.note || t("listeningSupport.noNote")}</p>
                      <p className="mt-2 text-[10px] leading-4 text-[#899184]">{t("listeningSupport.acceptDisclaimer")}</p>
                      <button type="button" disabled={busyRequest === req.id} onClick={() => accept(req)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#55795D] px-4 py-3 text-xs font-black text-white disabled:opacity-50">{busyRequest === req.id ? <LoaderCircle size={16} className="animate-spin"/> : <HeartHandshake size={16}/>} {t("listeningSupport.acceptButton")}</button>
                    </article>)}
                  </div>
                </div>
              )}
              {incoming.length === 0 && <div className="rounded-xl border border-dashed border-[#D6DDD0] p-5 text-center"><BellRing className="mx-auto text-[#91A28D]" size={24}/><p className="mt-2 text-xs leading-5 text-[#7A8577]">{t("listeningSupport.noIncoming")}</p></div>}
            </section>
          )}
        </div>
        <footer className="border-t border-[#E5E3D9] bg-white/80 px-5 py-3 text-[10px] leading-4 text-[#8A8F84]">{t("listeningSupport.footer")}</footer>
      </div>
    </div>
  );
}
