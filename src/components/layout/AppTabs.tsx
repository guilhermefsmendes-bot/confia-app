import type React from "react";
import { lazy, memo, Suspense, useState } from "react";
import { Compass, Sparkles, Wind } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Objective, WeeklyGoal, SharePost } from "../../types";
const PartilhaFeed = lazy(() => import("../PartilhaFeed").then(m => ({ default: m.PartilhaFeed })));
const ObjectivosList = lazy(() => import("../ObjectivosList").then(m => ({ default: m.ObjectivosList })));
const WeeklyGoalSection = lazy(() => import("../WeeklyGoalSection").then(m => ({ default: m.WeeklyGoalSection })));
const HorizonExperience = lazy(() => import("../HorizonExperience"));
const AbracoTimer = lazy(() => import("../AbracoTimer").then(m => ({ default: m.AbracoTimer })));

type EmbraceTabProps = {
  onOpenSky: () => void;
  onAddXp: (amount: number) => void;
  active: boolean;
};

export const EmbraceTab = memo(function EmbraceTab({ onOpenSky, onAddXp, active }: EmbraceTabProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"pause" | "explore">("pause");
  const loadingFallback = <div role="status" aria-live="polite" className="flex min-h-24 items-center justify-center text-xs font-semibold text-[#806D65]">{t("loading")}</div>;

  return (
    <div key="embrace-tab" className="confia-motion-enter">
      <section className="mb-4 rounded-[26px] border border-[#E8DDD7] bg-white p-3.5 shadow-sm" aria-label={t("embraceModePrompt")}>
        <p className="px-1 pb-2 text-[9px] font-black uppercase tracking-[.16em] text-[#9A7668]">{t("embraceModePrompt")}</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("embraceModePrompt")}>
          <button
            type="button"
            aria-pressed={mode === "pause"}
            onClick={() => setMode("pause")}
            className={"flex min-h-[76px] items-center gap-2.5 rounded-2xl border p-3 text-left transition " + (mode === "pause" ? "border-[#A85F45] bg-[#FFF3ED] text-[#7D4536] shadow-sm" : "border-[#E8DDD7] bg-[#FFFCFA] text-[#6F5A52]")}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white"><Wind size={18}/></span>
            <span className="min-w-0"><span className="block text-[11px] font-black leading-4">{t("embraceModePause")}</span><span className="mt-1 block text-[9px] leading-3.5 opacity-75">{t("embraceModePauseHint")}</span></span>
          </button>
          <button
            type="button"
            aria-pressed={mode === "explore"}
            onClick={() => setMode("explore")}
            className={"flex min-h-[76px] items-center gap-2.5 rounded-2xl border p-3 text-left transition " + (mode === "explore" ? "border-[#587563] bg-[#F0F6F1] text-[#456151] shadow-sm" : "border-[#E8DDD7] bg-[#FFFCFA] text-[#6F5A52]")}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white"><Compass size={18}/></span>
            <span className="min-w-0"><span className="block text-[11px] font-black leading-4">{t("embraceModeExplore")}</span><span className="mt-1 block text-[9px] leading-3.5 opacity-75">{t("embraceModeExploreHint")}</span></span>
          </button>
        </div>
      </section>

      {/* Both experiences remain mounted after first visit: switching modes never discards a saved journey or an in-progress pause. */}
      <div hidden={mode !== "pause"} aria-hidden={mode !== "pause"} className="space-y-4">
        <Suspense fallback={loadingFallback}>
          <AbracoTimer onAddXp={onAddXp} active={active && mode === "pause"} />
        </Suspense>
      </div>
      <div hidden={mode !== "explore"} aria-hidden={mode !== "explore"} className="space-y-4">
        <Suspense fallback={loadingFallback}>
          <HorizonExperience onOpenSky={onOpenSky} active={active && mode === "explore"} />
        </Suspense>
      </div>
    </div>
  );
});

type ObjectivesTabProps = {
  reactiveMessageKey: string | null;
  objectives: Objective[];
  weeklyGoal: WeeklyGoal | null;
  onToggleComplete: (id: string) => void;
  onAddCustomObjective: (text: string, category: 'corporeo' | 'mental' | 'social' | 'nutricao') => void;
  onDeleteObjective: (id: string) => void;
  onCreateGoal: (title: string) => void;
  onCompleteDay: (targetDate: string, ease: number, note: string, recovery: boolean) => void;
  onShareTrophy: () => void;
};

export const ObjectivesTab = memo(function ObjectivesTab({
  reactiveMessageKey,
  objectives,
  weeklyGoal,
  onToggleComplete,
  onAddCustomObjective,
  onDeleteObjective,
  onCreateGoal,
  onCompleteDay,
  onShareTrophy,
}: ObjectivesTabProps) {
  const { t } = useTranslation();
  const loadingFallback = <div role="status" aria-live="polite" className="flex min-h-24 items-center justify-center text-xs font-semibold text-[#806D65]">{t("loading")}</div>;

  return (
    <div
      key="goals-tab"

      className="confia-motion-enter">
      <div className="confia-surface-panel">
        {reactiveMessageKey && (
          <section className="mb-4 overflow-hidden rounded-[28px] border border-[#B85F48]/25 bg-gradient-to-br from-[#FFF8F4] via-white to-[#FFFDFC] shadow-[0_12px_32px_rgba(92,64,52,0.06)]">
            <div className="flex items-start gap-3.5 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#B85F48]/15 bg-white text-[#934A38] shadow-sm">
                <Sparkles size={18} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#934A38]">{t("homeNow.eyebrow")}</p>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#2F2926]">{t(reactiveMessageKey)}</p>
              </div>
            </div>
            <div aria-hidden="true" className="h-[3px] w-full bg-gradient-to-r from-[#B85F48]/10 via-[#934A38]/45 to-[#B85F48]/10" />
          </section>
        )}
        <Suspense fallback={loadingFallback}>
          <ObjectivosList
            objectives={objectives}
            onToggleComplete={onToggleComplete}
            onAddCustomObjective={onAddCustomObjective}
            onDeleteObjective={onDeleteObjective}
          />
          <WeeklyGoalSection
            weeklyGoal={weeklyGoal}
            onCreateGoal={onCreateGoal}
            onCompleteDay={onCompleteDay}
            onShareTrophy={onShareTrophy}
          />
        </Suspense>
      </div>
    </div>
  );
});

type CommunityTabProps = {
  posts: SharePost[];
  onAddPost: (
    feeling: string,
    topic: string,
    message: string,
    options?: {
      experienceTag?: string;
      supportMode?: "share" | "other_side" | "seeking_match" | "give_back";
      circleExpiresAt?: number;
    }
  ) => Promise<void>;
  onLikePost: (id: string, reaction: "yellow" | "green" | "red") => Promise<void>;
  onOpenChat: (post: SharePost) => void;
  onConnectMatch: (post: SharePost) => Promise<void>;
  onOpenMatchedChat: (post: SharePost, chatId: string) => void;
  onDeletePost: (id: string) => Promise<void>;
  onReportPost: (post: SharePost, reason: string) => Promise<void>;
  onBlockUser: (blockedUserId: string) => Promise<void>;
};

export const CommunityTab = memo(function CommunityTab(props: CommunityTabProps) {
  const { t } = useTranslation();
  return (
    <div
      key="community-tab"
      className="confia-motion-enter w-full min-w-0 overflow-x-clip"
    >
      <Suspense fallback={<div role="status" aria-live="polite" className="flex min-h-24 items-center justify-center text-xs font-semibold text-[#806D65]">{t("loading")}</div>}>
        <PartilhaFeed
          posts={props.posts}
          onAddPost={props.onAddPost}
          onLikePost={props.onLikePost}
          onOpenChat={props.onOpenChat}
          onConnectMatch={props.onConnectMatch}
          onOpenMatchedChat={props.onOpenMatchedChat}
          onDeletePost={props.onDeletePost}
          onReportPost={props.onReportPost}
          onBlockUser={props.onBlockUser}
        />
      </Suspense>
    </div>
  );
});
