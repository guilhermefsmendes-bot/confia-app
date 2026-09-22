import React, { useEffect, useState } from 'react';
import { auth } from '../firebaseAuth';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquarePlus,
  Smile,
  Send,
  CheckCircle,
  Tag,
  HeartHandshake,
  MessagesSquare
} from 'lucide-react';
import { SharePost } from '../types';
import { useTranslation } from 'react-i18next';
import CommunityCircles from './CommunityCircles';
import CommunityPremiumHub from './CommunityPremiumHub';
import ExperienceMatchingPanel from './ExperienceMatchingPanel';
import { EXPERIENCE_MATCHING_IDS, type ExperienceMatchingId } from '../data/community/experienceMatching';
import { subscribeBlockedUserIds, subscribeExperienceMatchProfile, subscribeExperienceMatchRequests, type ExperienceMatchProfile, type ExperienceMatchRequest } from '../data/community/experienceMatchingService';

interface PartilhaFeedProps {
  posts: SharePost[];
  onAddPost: (feeling: string, topic: string, message: string, options?: { experienceTag?: string; supportMode?: "share" | "other_side" | "seeking_match" | "give_back"; circleExpiresAt?: number }) => Promise<void> | void;
  onLikePost: (
    id: string,
    reaction: "yellow" | "green" | "red"
  ) => void;
  onOpenChat: (post: SharePost) => void;
  onConnectMatch: (post: SharePost) => Promise<void> | void;
  onOpenMatchedChat: (post: SharePost, chatId: string) => void;
  onDeletePost: (id: string) => void;
  onReportPost: (post: SharePost, reason: string) => void;
  onBlockUser: (id: string) => void;
}

const FEELINGS_LIST = [
  {
    key: 'feelingRelieved',
    text: 'Aliviado',
    emoji: '🌿',
    color: 'bg-[#F3E3DC] text-[#934A38] border-[#B85F48]/20'
  },
  {
    key: 'feelingCalm',
    text: 'Calmo',
    emoji: '🧘‍♂️',
    color: 'bg-[#F7F5F2] text-[#8B5C4D] border-[#B85F48]/15'
  },
  {
    key: 'feelingGrateful',
    text: 'Grato',
    emoji: '🥰',
    color: 'bg-[#FFF9F6] text-[#A06050] border-[#B85F48]/15'
  },
  {
    key: 'feelingAnxious',
    text: 'Ansioso',
    emoji: '🥺',
    color: 'bg-[#F5D6C6]/20 text-[#A06050] border-[#F5D6C6]/30'
  },
  {
    key: 'feelingAgitated',
    text: 'Agitado',
    emoji: '⚡',
    color: 'bg-[#FFF5EE] text-[#7A4E43] border-[#FFF5EE]'
  },
  {
    key: 'feelingFocused',
    text: 'Focado',
    emoji: '🎯',
    color: 'bg-white text-[#934A38] border-[#B85F48]/20'
  }
];

const TOPICS_LIST = [
  { id: 'ansiedade', emoji: '🌊' }, { id: 'stress', emoji: '⚡' },
  { id: 'saude-mental', emoji: '🧠' }, { id: 'cansaco', emoji: '🌙' },
  { id: 'solidao', emoji: '🤍' }, { id: 'relacoes', emoji: '🤝' },
  { id: 'trabalho-estudos', emoji: '💼' }, { id: 'familia', emoji: '🏡' },
  { id: 'sono', emoji: '😴' }, { id: 'autoestima', emoji: '🌱' },
  { id: 'progresso', emoji: '✨' }, { id: 'outro', emoji: '💭' }
];

export const PartilhaFeed: React.FC<PartilhaFeedProps> = ({
  posts,
  onAddPost,
  onLikePost,
  onOpenChat,
  onConnectMatch,
  onOpenMatchedChat,
  onDeletePost,
  onReportPost,
  onBlockUser
}) => {
  const { t } = useTranslation();

  const [selectedFeeling, setSelectedFeeling] = useState('Calmo');
  const [selectedTopic, setSelectedTopic] = useState('ansiedade');
  const [activeTopic, setActiveTopic] = useState('all');
  const [message, setMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [confirmIdentify, setConfirmIdentify] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<ExperienceMatchingId | "">("");
  const [communityView, setCommunityView] = useState<"feed" | "matching">("feed");
  const [matchProfile, setMatchProfile] = useState<ExperienceMatchProfile>({ active: false, activeTags: [], preference: "either" });
  const [matchRequests, setMatchRequests] = useState<ExperienceMatchRequest[]>([]);
  const [blockedMatchUsers, setBlockedMatchUsers] = useState<string[]>([]);

  useEffect(() => subscribeExperienceMatchProfile(setMatchProfile), []);
  useEffect(() => subscribeExperienceMatchRequests(setMatchRequests), []);
  useEffect(() => subscribeBlockedUserIds(setBlockedMatchUsers), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    onAddPost(selectedFeeling, selectedTopic, message.trim(), selectedExperience ? {
      experienceTag: selectedExperience,
      supportMode: "share"
    } : undefined);

    setMessage('');
    setSelectedExperience('');
    setShowCompose(false);
    setSuccessMsg(true);

    setTimeout(() => {
      setSuccessMsg(false);
    }, 3000);
  };

  const getFeelingStyles = (feeling: string) => {
    const found = FEELINGS_LIST.find(
      f => f.text.toLowerCase() === feeling.toLowerCase()
    );

    return found || {
      key: '',
      text: feeling,
      emoji: '💭',
      color: 'bg-[#F7F5F2] text-[#8B5C4D] border-slate-200'
    };
  };

  return (
    <div className="max-w-md mx-auto space-y-5 py-4">

      {/* Header Banner */}
      <div className="text-center px-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-[#B85F48] text-2xl">🤝</span>
          <h2 className="text-xl font-black text-[#2F2926] font-display">
            {t("shareCornerTitle")}
          </h2>
        </div>

        <p className="text-xs text-[var(--cf-text-soft)] leading-relaxed max-w-sm mx-auto font-medium">
          {t("shareCornerDescription")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-1">
        <button type="button" onClick={() => setCommunityView("feed")} className={(communityView === "feed" ? "bg-[#2F2926] text-white" : "bg-white text-[#6F554B] border border-[#E8DDD7]") + " flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-[10px] font-black"}>
          <MessagesSquare size={16}/>{t("experienceMatching.community")}
        </button>
        <button type="button" onClick={() => setCommunityView("matching")} className={(communityView === "matching" ? "bg-[#A85F45] text-white" : "bg-white text-[#934A38] border border-[#E5CFC5]") + " relative flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-[10px] font-black"}>
          <HeartHandshake size={16}/>{t("experienceMatching.menu")}
          {matchRequests.some(r => r.recipientId === auth.currentUser?.uid && r.status === "pending") && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white ring-2 ring-[#A85F45]"/>}
        </button>
      </div>

      {communityView === "matching" ? (
        <ExperienceMatchingPanel posts={posts} profile={matchProfile} requests={matchRequests} blockedUserIds={blockedMatchUsers} onOpenMatchedChat={onOpenMatchedChat}/>
      ) : <>
      {/* Success Notification */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-[#F3E3DC] border border-[#B85F48]/25 rounded-2xl flex items-center gap-2 text-[#934A38] text-xs font-bold shadow-sm"
          >
            <CheckCircle size={16} className="shrink-0" />
            <span>{t("shareSuccess")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Write Post */}
      {!showCompose ? (
        <button
          type="button"
          onClick={() => setShowCompose(true)}
          className="w-full p-5 bg-gradient-to-r from-[#B85F48]/10 to-[#F3E3DC]/5 border border-[#B85F48]/20 rounded-[24px] flex items-center justify-between text-left group transition-all hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-[#B85F48] rounded-xl shadow-sm">
              <MessageSquarePlus size={18} />
            </div>

            <div>
              <h3 className="text-xs font-bold text-[#2F2926]">
                {t("howDoYouFeel")}
              </h3>

              <p className="text-[10px] text-[#934A38] font-semibold mt-0.5">
                {t("safeSharing")}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#934A38] group-hover:translate-x-1 transition-transform">
            {t("write")} &rarr;
          </span>
        </button>
      ) : (
        <motion.form
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleSubmit}
          className="bg-white border border-[#B85F48]/15 rounded-[32px] p-6 space-y-4 shadow-xl shadow-amber-100/15"
        >
          {/* Tag Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2F2926] flex items-center gap-1">
              <Smile size={14} className="text-[#B85F48]" />
              {t("currentFeeling")}
            </label>

            <div className="flex flex-wrap gap-1.5">
              {FEELINGS_LIST.map(feeling => (
                <button
                  key={feeling.text}
                  type="button"
                  onClick={() => setSelectedFeeling(feeling.text)}
                  className={
                    "px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer " +
                    (
                      selectedFeeling === feeling.text
                        ? "bg-[#B85F48] border-[#B85F48] text-white shadow-md shadow-[#B85F48]/20"
                        : "bg-[#F7F5F2] border-[var(--cf-border)] text-[var(--cf-text-soft)] hover:border-slate-200"
                    )
                  }
                >
                  <span>{feeling.emoji}</span>
                  <span>{t(feeling.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2F2926] flex items-center gap-1">
              <Tag size={14} className="text-[#B85F48]" />
              {t("communityTopics.question")}
            </label>
            <p className="text-[10px] text-[var(--cf-muted)]">
              {t("communityTopics.hint")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS_LIST.map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopic(topic.id)}
                  className={
                    "px-3 py-2 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer " +
                    (selectedTopic === topic.id
                      ? "bg-[#2F2926] border-[#2F2926] text-white shadow-sm"
                      : "bg-white border-[#E8DDD7] text-[#795B50] hover:border-[#B85F48]/40")
                  }
                >
                  <span>{topic.emoji}</span>
                  <span>{t("communityTopics." + topic.id)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-1.5">
            <textarea
              placeholder={t("sharePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={220}
              rows={3}
              required
              className="w-full p-4 text-xs border border-slate-200/80 rounded-2xl focus:outline-none focus:border-[#B85F48] focus:ring-2 focus:ring-[#B85F48]/15 bg-[#F7F5F2] resize-none leading-relaxed text-[#2F2926]"
            />

            <div className="flex justify-end text-[10px] text-[var(--cf-muted)] font-mono">
              {message.length} / 220 {t("characters")}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowCompose(false)}
              className="flex-1 py-3 text-xs text-[var(--cf-text-soft)] hover:bg-[var(--cf-surface-soft)] rounded-xl font-bold border border-slate-200/60 cursor-pointer"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              className="flex-1 py-3 bg-[#B85F48] hover:bg-[#D59375] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#B85F48]/20 cursor-pointer"
            >
              <Send size={13} />
              {t("sendMessage")}
            </button>
          </div>
        </motion.form>
      )}

      <CommunityPremiumHub posts={posts} onConnect={onConnectMatch} onCreate={onAddPost} onOpenChat={onOpenChat} />

      <CommunityCircles posts={posts} onOpenChat={onOpenChat} />

      {/* Topic filters */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-2 pb-1 min-w-max">
          <button
            type="button"
            onClick={() => setActiveTopic('all')}
            className={
              "px-3 py-2 rounded-full text-[10px] font-black border transition " +
              (activeTopic === 'all'
                ? "bg-[#B85F48] text-white border-[#B85F48]"
                : "bg-white text-[#795B50] border-[#E8DDD7]")
            }
          >
            {t("communityTopics.all")}
          </button>
          {TOPICS_LIST.map(topic => (
            <button
              key={topic.id}
              type="button"
              onClick={() => setActiveTopic(topic.id)}
              className={
                "px-3 py-2 rounded-full text-[10px] font-bold border transition " +
                (activeTopic === topic.id
                  ? "bg-[#B85F48] text-white border-[#B85F48]"
                  : "bg-white text-[#795B50] border-[#E8DDD7]")
              }
            >
              {topic.emoji} {t("communityTopics." + topic.id)}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Stack */}
      <div className="space-y-3.5">
        <AnimatePresence initial={false}>
          {posts
            .filter(post => activeTopic === 'all' || post.topic === activeTopic)
            .map(post => {
            const tag = getFeelingStyles(post.feeling);
            const topic = TOPICS_LIST.find(item => item.id === post.topic);

            const canChat =
              post.userReaction !== undefined ||
              (
                post.authorId === auth.currentUser?.uid &&
                (
                  (post.yellowLikedBy?.length ?? 0) > 0 ||
                  (post.greenLikedBy?.length ?? 0) > 0 ||
                  (post.redLikedBy?.length ?? 0) > 0
                )
              );

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 bg-white border border-[#B85F48]/15 rounded-[32px] shadow-sm hover:shadow-md transition-all space-y-3.5"
              >

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">

                    <div className="w-8 h-8 rounded-full bg-[#B85F48]/10 border border-[#B85F48]/15 flex items-center justify-center text-[10px] font-black text-[#B85F48]">
                      {post.userName.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-[#2F2926]">
                        {post.userName}
                      </h4>

                      <p className="text-[9px] text-[var(--cf-muted)] font-bold">
                        {post.timestamp}
                      </p>
                    </div>

                  </div>

                  <span
                    className={
                      "px-2.5 py-1 rounded-xl border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 " +
                      tag.color
                    }
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.text}</span>
                  </span>
                </div>

                {topic && (
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7F2] border border-[#E8CFC2] px-2.5 py-1 text-[10px] font-black text-[#934A38]">
                      <span>{topic.emoji}</span>
                      <span>{t("communityTopics." + topic.id)}</span>
                    </span>
                  </div>
                )}

                {/* Message text */}
                <p className="text-xs text-[#2F2926] leading-relaxed font-semibold">
                  {post.message}
                </p>

                {/* Moderation Actions */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  {post.authorId === auth.currentUser?.uid && (
                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id)}
                      className="text-[10px] text-red-400 font-bold hover:text-red-600 cursor-pointer"
                    >
                      🗑️ Apagar
                    </button>
                  )}

                  {post.authorId !== auth.currentUser?.uid && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onReportPost(
                            post,
                            t("inappropriateContent")
                          )
                        }
                        className="text-[10px] text-orange-400 font-bold hover:text-orange-600 cursor-pointer"
                      >
                        {t("report")}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t("blockConfirm"))) {
                            onBlockUser(post.authorId);
                          }
                        }}
                        className="text-[10px] text-[var(--cf-muted)] font-bold hover:text-slate-600 cursor-pointer"
                      >
                        {t("blockUser")}
                      </button>
                    </>
                  )}
                </div>

                {/* Reactions */}
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--cf-border)]">

                  {/* 💛 Apoio */}
                  <button
                    type="button"
                    onClick={() => onLikePost(post.id, "yellow")}
                    className={
                      "flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer " +
                      (
                        post.userReaction === "yellow"
                          ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
                          : "bg-[#F7F5F2] text-[var(--cf-muted)] border border-[#B85F48]/10 hover:bg-yellow-50 hover:text-yellow-600"
                      )
                    }
                  >
                    <span className="text-sm">💛</span>
                    <span>{post.yellowLikes}</span>
                  </button>

                  {/* 💚 Estou contigo */}
                  <button
                    type="button"
                    onClick={() => onLikePost(post.id, "green")}
                    className={
                      "flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer " +
                      (
                        post.userReaction === "green"
                          ? "bg-green-100 text-green-600 border border-green-200"
                          : "bg-[#F7F5F2] text-[var(--cf-muted)] border border-[#B85F48]/10 hover:bg-green-50 hover:text-green-600"
                      )
                    }
                  >
                    <span className="text-sm">💚</span>
                    <span>{post.greenLikes}</span>
                  </button>

                  {/* ❤️ Identifico-me */}
                  <button
                    type="button"
                    onClick={() => {
                      if (post.userReaction === "red") {
                        onLikePost(post.id, "red");
                        return;
                      }

                      setConfirmIdentify(post.id);
                    }}
                    className={
                      "flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer " +
                      (
                        post.userReaction === "red"
                          ? "bg-red-100 text-red-600 border border-red-200"
                          : "bg-[#F7F5F2] text-[var(--cf-muted)] border border-[#B85F48]/10 hover:bg-red-50 hover:text-red-600"
                      )
                    }
                  >
                    <span className="text-sm">❤️</span>
                    <span>{t("communityPremium.passedThrough")} · {post.redLikes}</span>
                  </button>

                  {/* Chat */}
                  <button
                    type="button"
                    onClick={() => {
                      if (canChat) {
                        onOpenChat(post);
                      }
                    }}
                    disabled={!canChat}
                    title={
                      canChat
                        ? t("communityChat")
                        : t("identifyFirstChat")
                    }
                    className={
                      "flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all " +
                      (
                        canChat
                          ? "text-[#934A38] bg-[#F3E3DC] border border-[#B85F48]/20 hover:bg-[#FFE5D8] cursor-pointer"
                          : "text-slate-300 bg-[var(--cf-surface-soft)] border border-[var(--cf-border)] opacity-50 cursor-not-allowed"
                      )
                    }
                  >
                    <span className="text-sm">💬</span>
                    <span>{t("communityChat")}</span>
                  </button>

                  {/* Hashtag */}
                  <div className="text-[10px] text-slate-300 font-mono select-none flex-1 text-right">
                    #comunidadeConfia
                  </div>
                </div>

                {/* Modal de confirmação ❤️ */}
                {confirmIdentify === post.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5">
                    <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">

                      <div className="text-center">
                        <div className="text-4xl mb-3">❤️</div>

                        <h3 className="text-base font-black text-[#2F2926]">
                          {t("identifyTitle")}
                        </h3>

                        <p className="text-xs text-[var(--cf-text-soft)] mt-2 leading-relaxed">
                          {t("identifyMessage")}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <button
                          type="button"
                          onClick={() => setConfirmIdentify(null)}
                          className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-[var(--cf-text-soft)]"
                        >
                          {t("identifyCancel")}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onLikePost(post.id, "red");
                            setConfirmIdentify(null);
                          }}
                          className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-bold"
                        >
                          {t("identifyConfirm")}
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      </>}
    </div>
  );
};
