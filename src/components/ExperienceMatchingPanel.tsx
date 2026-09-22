import { useEffect, useMemo, useState } from "react";
import { HeartHandshake, MessageCircle, ShieldCheck, UserRoundSearch, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auth } from "../firebaseAuth";
import type { SharePost } from "../types";
import {
  EXPERIENCE_MATCHING_IDS,
  type ExperienceMatchingId,
  type ExperienceMatchPreference
} from "../data/community/experienceMatching";
import {
  joinExperienceMatchCircle,
  leaveExperienceMatchCircle,
  requestExperienceMatch,
  respondToExperienceMatch,
  saveExperienceMatchProfile,
  subscribeExperienceMatchCircles,
  type ExperienceConversationMode,
  type ExperienceMatchCircle,
  type ExperienceMatchProfile,
  type ExperienceMatchRequest
} from "../data/community/experienceMatchingService";

interface Props {
  posts: SharePost[];
  profile: ExperienceMatchProfile;
  requests: ExperienceMatchRequest[];
  blockedUserIds: string[];
  onOpenMatchedChat: (post: SharePost, chatId: string) => void;
}

export default function ExperienceMatchingPanel({ posts, profile, requests, blockedUserIds, onOpenMatchedChat }: Props) {
  const { t } = useTranslation();
  const uid = auth.currentUser?.uid;
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [circles, setCircles] = useState<ExperienceMatchCircle[]>([]);

  useEffect(() => subscribeExperienceMatchCircles(setCircles), []);

  const requestByPost = useMemo(() => new Map(
    requests.filter(r => r.requesterId === uid).map(r => [r.postId, r])
  ), [requests, uid]);

  const candidates = useMemo(() => posts.filter(post =>
    post.authorId !== uid &&
    !blockedUserIds.includes(post.authorId) &&
    !!post.experienceTag &&
    profile.activeTags.includes(post.experienceTag as ExperienceMatchingId) &&
    (
      profile.preference === "either" ||
      (profile.preference === "been_there" && ["other_side", "give_back"].includes(post.supportMode || "")) ||
      (profile.preference === "same_now" && !["other_side", "give_back"].includes(post.supportMode || ""))
    ) &&
    !["declined", "cancelled"].includes(requestByPost.get(post.id)?.status || "")
  ).slice(0, 8), [posts, profile.activeTags, profile.preference, requestByPost, blockedUserIds, uid]);

  const incoming = requests.filter(r => r.recipientId === uid && r.status === "pending" && !blockedUserIds.includes(r.requesterId));
  const accepted = requests.filter(r => r.status === "accepted");

  const toggleTag = async (tag: ExperienceMatchingId) => {
    const next = profile.activeTags.includes(tag)
      ? profile.activeTags.filter(x => x !== tag)
      : profile.activeTags.length < 3 ? [...profile.activeTags, tag] : profile.activeTags;
    setSaving(true);
    try {
      await saveExperienceMatchProfile({ ...profile, activeTags: next, active: next.length > 0 });
    } finally { setSaving(false); }
  };

  const setPreference = async (preference: ExperienceMatchPreference) => {
    setSaving(true);
    try { await saveExperienceMatchProfile({ ...profile, preference }); }
    finally { setSaving(false); }
  };

  const setConversationMode = async (conversationMode: ExperienceConversationMode) => {
    setSaving(true);
    try { await saveExperienceMatchProfile({ ...profile, conversationMode }); }
    finally { setSaving(false); }
  };

  const setActive = async (active: boolean) => {
    setSaving(true);
    try { await saveExperienceMatchProfile({ ...profile, active: active && profile.activeTags.length > 0 }); }
    finally { setSaving(false); }
  };

  const findPost = (id: string) => posts.find(p => p.id === id);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E5D4CC] bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#F7E8E1] p-2 text-[#A85F45]"><UserRoundSearch size={19}/></div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-[#332925]">{t("experienceMatching.setupTitle")}</h4>
            <p className="mt-1 text-[10px] leading-4 text-[#806D65]">{t("experienceMatching.setupText")}</p>
          </div>
          <button type="button" disabled={saving || profile.activeTags.length === 0} onClick={() => setActive(!profile.active)}
            className={(profile.active ? "bg-[#587563] text-white" : "bg-[#EFE7E3] text-[#795B50]") + " rounded-full px-3 py-2 text-[9px] font-black disabled:opacity-40"}>
            {profile.active ? t("experienceMatching.active") : t("experienceMatching.inactive")}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXPERIENCE_MATCHING_IDS.map(tag => (
            <button type="button" key={tag} disabled={saving} onClick={() => toggleTag(tag)}
              className={(profile.activeTags.includes(tag) ? "border-[#A85F45] bg-[#A85F45] text-white" : "border-[#E8DDD7] bg-[#FFF9F6] text-[#6F554B]") + " rounded-full border px-3 py-2 text-[9px] font-bold"}>
              {t("experienceMatching.experiences." + tag)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[9px] text-[#9A8278]">{t("experienceMatching.maxThree")}</p>

        <div className="mt-4">
          <p className="mb-2 text-[10px] font-black text-[#4A3933]">{t("experienceMatching.whoTitle")}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["same_now","been_there","either"] as ExperienceMatchPreference[]).map(pref => (
              <button type="button" key={pref} disabled={saving} onClick={() => setPreference(pref)}
                className={(profile.preference === pref ? "border-[#587563] bg-[#EDF4EF] text-[#456151]" : "border-[#E8DDD7] bg-white text-[#806D65]") + " rounded-xl border p-2 text-[9px] font-bold"}>
                {t("experienceMatching.preference." + pref)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-black text-[#4A3933]">{t("experienceMatching.conversationModeTitle")}</p>
          <div className="grid grid-cols-3 gap-2">
            {(["one_to_one","group","either"] as ExperienceConversationMode[]).map(mode => (
              <button type="button" key={mode} disabled={saving} onClick={() => setConversationMode(mode)}
                className={(profile.conversationMode === mode ? "border-[#A85F45] bg-[#FFF2EC] text-[#934A38]" : "border-[#E8DDD7] bg-white text-[#806D65]") + " rounded-xl border p-2 text-[9px] font-bold"}>
                {t("experienceMatching.conversationMode." + mode)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex gap-2 rounded-xl bg-[#F7F5F2] p-3 text-[9px] leading-4 text-[#806D65]">
          <ShieldCheck size={16} className="shrink-0 text-[#587563]"/>
          <span>{t("experienceMatching.privacy")}</span>
        </div>
      </div>

      {incoming.length > 0 && (
        <div className="rounded-2xl border border-[#D7E4DA] bg-[#F3F8F4] p-4">
          <h4 className="flex items-center gap-2 text-xs font-black text-[#456151]"><HeartHandshake size={17}/>{t("experienceMatching.incomingTitle")}</h4>
          <div className="mt-3 space-y-2">
            {incoming.map(req => {
              const post = findPost(req.postId);
              if (!post) return null;
              return <div key={req.id} className="rounded-xl bg-white p-3">
                <b className="text-[10px] text-[#456151]">{t("experienceMatching.experiences." + req.experienceTag)}</b>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#6F554B]">{post.message}</p>
                <p className="mt-2 text-[9px] text-[#8C756C]">{t("experienceMatching.incomingText")}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" disabled={busyId===req.id} onClick={async()=>{setBusyId(req.id);try{const chatId=await respondToExperienceMatch(req,true);if(chatId)onOpenMatchedChat(post,chatId)}finally{setBusyId(null)}}} className="rounded-xl bg-[#587563] px-3 py-2 text-[9px] font-black text-white">{t("experienceMatching.accept")}</button>
                  <button type="button" disabled={busyId===req.id} onClick={async()=>{setBusyId(req.id);try{await respondToExperienceMatch(req,false)}finally{setBusyId(null)}}} className="rounded-xl bg-white px-3 py-2 text-[9px] font-black text-[#806D65] ring-1 ring-[#DED2CC]">{t("experienceMatching.decline")}</button>
                </div>
              </div>;
            })}
          </div>
        </div>
      )}

      {profile.active && profile.conversationMode !== "group" && (
        <div>
          <h4 className="text-xs font-black text-[#332925]">{t("experienceMatching.matchesTitle")}</h4>
          <p className="mt-1 text-[9px] leading-4 text-[#806D65]">{t("experienceMatching.matchesText")}</p>
          <div className="mt-3 space-y-2">
            {candidates.length === 0 && <div className="rounded-xl bg-white p-4 text-[10px] text-[#806D65]">{t("experienceMatching.waiting")}</div>}
            {candidates.map(post => {
              const req = requestByPost.get(post.id);
              const label = t("experienceMatching.experiences." + post.experienceTag);
              return <div key={post.id} className="rounded-2xl border border-[#E8DDD7] bg-white p-3">
                <div className="flex items-center justify-between gap-2"><b className="text-[10px] text-[#934A38]">{label}</b><span className="text-[8px] font-black uppercase tracking-wider text-[#9A8278]">{t("experienceMatching.compatible")}</span></div>
                <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-[#5E4A43]">{post.message}</p>
                {req?.status === "pending" ? <div className="mt-2 rounded-xl bg-[#FFF7F2] p-2 text-center text-[9px] font-bold text-[#934A38]">{t("experienceMatching.requestSent")}</div>
                : req?.status === "accepted" ? <button type="button" onClick={()=>onOpenMatchedChat(post, "match_"+req.id)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#587563] px-3 py-2.5 text-[10px] font-black text-white"><MessageCircle size={14}/>{t("experienceMatching.openConversation")}</button>
                : <button type="button" disabled={busyId===post.id} onClick={async()=>{setBusyId(post.id);try{await requestExperienceMatch(post,post.experienceTag as ExperienceMatchingId)}finally{setBusyId(null)}}} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#A85F45] px-3 py-2.5 text-[10px] font-black text-white"><MessageCircle size={14}/>{t("experienceMatching.wantToTalk")}</button>}
              </div>;
            })}
          </div>
        </div>
      )}

      {profile.active && profile.conversationMode !== "one_to_one" && (
        <div className="rounded-2xl border border-[#D9D5E8] bg-[#F8F7FC] p-4">
          <h4 className="flex items-center gap-2 text-xs font-black text-[#51496B]"><Users size={17}/>{t("experienceMatching.groupsTitle")}</h4>
          <p className="mt-1 text-[9px] leading-4 text-[#756E88]">{t("experienceMatching.groupsText")}</p>
          <div className="mt-3 space-y-2">
            {profile.activeTags.map(tag => {
              const circle = circles.find(c => c.experienceTag === tag);
              return <div key={tag} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
                <div><b className="block text-[10px] text-[#51496B]">{t("experienceMatching.experiences." + tag)}</b><span className="text-[9px] text-[#8B849A]">{circle ? t("experienceMatching.groupMembers", { count: circle.participants.length }) : t("experienceMatching.groupWaiting")}</span></div>
                {circle ? <div className="flex gap-1"><button type="button" onClick={()=>onOpenMatchedChat({ ...posts.find(p=>p.experienceTag===tag)!, id: circle.id, authorId: circle.participants[0], userName: t("experienceMatching.groupName"), feeling: "🫂", topic: "", message: t("experienceMatching.groupContext", { experience: t("experienceMatching.experiences."+tag) }) } as SharePost, circle.id)} className="rounded-xl bg-[#51496B] px-3 py-2 text-[9px] font-black text-white">{t("experienceMatching.openGroup")}</button><button type="button" onClick={()=>leaveExperienceMatchCircle(circle.id)} className="rounded-xl px-2 text-[9px] font-bold text-[#8B849A]">{t("experienceMatching.leaveGroup")}</button></div>
                : <button type="button" disabled={busyId===tag} onClick={async()=>{setBusyId(tag);try{await joinExperienceMatchCircle(tag)}finally{setBusyId(null)}}} className="rounded-xl bg-[#6A617F] px-3 py-2 text-[9px] font-black text-white">{t("experienceMatching.joinGroup")}</button>}
              </div>;
            })}
          </div>
        </div>
      )}

      {accepted.filter(r => r.recipientId === uid).map(req => {
        const post=findPost(req.postId); if(!post)return null;
        return <button key={"accepted-"+req.id} type="button" onClick={()=>onOpenMatchedChat(post,"match_"+req.id)} className="flex w-full items-center justify-between rounded-2xl bg-[#2F2926] p-4 text-left text-white"><span><b className="block text-xs">{t("experienceMatching.matchReady")}</b><span className="mt-1 block text-[9px] text-white/70">{t("experienceMatching.openPrivateChat")}</span></span><MessageCircle size={18}/></button>
      })}
    </div>
  );
}
