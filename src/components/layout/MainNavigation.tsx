import { motion } from "motion/react";
import { House, Wind, Target, Zap, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  currentTab: number;
  onNavigate: (index: number) => void;
  hasUnreadCommunityMessage?: boolean;
};

export function MainNavigation({
  currentTab,
  onNavigate,
  hasUnreadCommunityMessage = false
}: Props) {
  const { t } = useTranslation();
  const tabs = [
    { label: t("home"), icon: House, index: 0 },
    { label: t("hug"), icon: Wind, index: 1 },
    { label: t("objectives"), icon: Target, index: 2 },
    { label: t("impulse"), icon: Zap, index: 3 },
    { label: t("community"), icon: Users, index: 4 },
  ];
  return (
    <footer className="confia-nav fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(.6rem+env(safe-area-inset-bottom))] pt-2.5" aria-label={t("mainNavigation")}>
      <div className="confia-nav-inner mx-auto flex items-center justify-between">
        {tabs.map(({ label, icon: Icon, index }) => {
          const active = currentTab === index;
          return (
            <button key={index} type="button" aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 flex-1 flex-col items-center justify-center rounded-xl py-1 transition-all ${active ? "confia-nav-active font-black" : "confia-nav-inactive"}`}
              onClick={() => { window.dispatchEvent(new Event("stop-background-audio")); onNavigate(index); }}>
              {active && <motion.div layoutId="confia-nav-indicator" className="absolute top-1 h-1.5 w-2 rounded-full bg-[var(--cf-primary)]" aria-hidden="true" />}
              <div className="relative">
                <Icon
                  size={19}
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden="true"
                />

                {index === 4 && hasUnreadCommunityMessage && (
                  <span
                    className="absolute -right-2 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"
                    aria-label={t("newMessage")}
                    title={t("newMessage")}
                  />
                )}
              </div>

              <span className="mt-0.5 text-[9px] font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
