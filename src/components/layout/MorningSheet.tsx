import type React from "react";
import { lazy, memo, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
const DailyCheckIn = lazy(() => import("../DailyCheckIn/DailyCheckIn"));

function LazySection({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export type MorningSheetProps = {
  onComplete: () => void;
  onOpenSky: () => void;
  onOpenMountain: () => void;
  onOpenSea: () => void;
  onOpenCommunity: () => void;
  onOpenChest: () => void;
};

export const MorningSheet = memo(function MorningSheet({
  onComplete,
  onOpenSky,
  onOpenMountain,
  onOpenSea,
  onOpenCommunity,
  onOpenChest,
}: MorningSheetProps) {
  const { t } = useTranslation();
  const [showDestinations, setShowDestinations] = useState(false);

  const destinations = [
    {
      key: "sky",
      title: t("morningSheet.sky.title", { defaultValue: "CÉU" }),
      text: t("morningSheet.sky.text", { defaultValue: "Deslumbra a tua constelação hoje" }),
      icon: "✨",
      onClick: onOpenSky,
      className: "bg-gradient-to-br from-[#172B4D] via-[#355B78] to-[#B8CFE0]",
    },
    {
      key: "mountain",
      title: t("morningSheet.mountain.title", { defaultValue: "MONTANHA" }),
      text: t("morningSheet.mountain.text", { defaultValue: "De degrau a degrau, progride hoje" }),
      icon: "🏔️",
      onClick: onOpenMountain,
      className: "bg-gradient-to-br from-[#D9E3E5] via-[#9FAEAE] to-[#685B55]",
    },
    {
      key: "sea",
      title: t("morningSheet.sea.title", { defaultValue: "MAR" }),
      text: t("morningSheet.sea.text", { defaultValue: "Traça e descobre a rota do teu eu" }),
      icon: "🌊",
      onClick: onOpenSea,
      className: "bg-gradient-to-br from-[#A9D8DF] via-[#4D9AA7] to-[#245D70]",
    },
    {
      key: "community",
      title: t("morningSheet.community.title", { defaultValue: "COMUNIDADE" }),
      text: t("morningSheet.community.text", { defaultValue: "Humaniza os teus sentimentos" }),
      icon: "🤝",
      onClick: onOpenCommunity,
      className: "bg-gradient-to-br from-[#F3D7C8] via-[#D49D88] to-[#8E6559]",
    },
    {
      key: "chest",
      title: t("morningSheet.chest.title", { defaultValue: "COFRE · TERRA" }),
      text: t("morningSheet.chest.text", { defaultValue: "Guarda o que conquistaste e continua a caminhar" }),
      icon: "🗝️",
      onClick: onOpenChest,
      className: "bg-gradient-to-br from-[#D9C19D] via-[#9E7A51] to-[#4E3A2C]",
    },
  ];

  if (!showDestinations) {
    return (
      <div className="flex min-h-[calc(100vh-150px)] items-start justify-center">
        <div className="w-full max-w-md">
          <div className="mb-4 px-1 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#934A38]">
              {t("morningSheet.eyebrow", { defaultValue: "FOLHA DE BOM DIA" })}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2F2926]">
              {t("morningSheet.title", { defaultValue: "Como te sentes neste momento?" })}
            </h1>
            <p className="mx-auto mt-1.5 max-w-sm text-[11px] font-semibold leading-relaxed text-[#806D65]">
              {t("morningSheet.subtitle", { defaultValue: "Começa pelo que está presente em ti. Depois, escolhe por onde queres caminhar hoje." })}
            </p>
          </div>

          <LazySection>
            <DailyCheckIn
              onComplete={() => {
                onComplete();
                setShowDestinations(true);
              }}
            />
          </LazySection>
        </div>
      </div>
    );
  }

  return (
    <div
      key="morning-destinations"
      className="confia-motion-enter flex min-h-[calc(100vh-150px)] items-start justify-center"
    >
      <div className="w-full max-w-md">
        <div className="mb-4 px-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#934A38]">
            {t("morningSheet.eyebrow", { defaultValue: "FOLHA DE BOM DIA" })}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2F2926]">
            {t("morningSheet.portalTitle", { defaultValue: "Por onde queres começar hoje?" })}
          </h1>
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#806D65]">
            {t("morningSheet.portalSubtitle", { defaultValue: "Cinco caminhos. Um só dia. Escolhe o que te chama." })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {destinations.map((destination, index) => (
            <button
              key={destination.key}
              type="button"
              onClick={destination.onClick}
              className={[
                "group relative min-h-[150px] overflow-hidden rounded-[26px] border border-white/40 p-4 text-left shadow-[0_12px_28px_rgba(47,41,38,0.14)] transition-transform active:scale-[0.98]",
                destination.className,
                index === 4 ? "col-span-2 min-h-[118px]" : "",
              ].join(" ")}
            >
              <div aria-hidden="true" className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              <div aria-hidden="true" className="absolute bottom-2 right-3 text-5xl opacity-80 transition-transform duration-300 group-hover:scale-110">
                {destination.icon}
              </div>
              <div className="relative z-10 max-w-[82%]">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
                  {destination.title}
                </p>
                <p className="mt-2 text-[15px] font-black leading-snug text-white drop-shadow-sm">
                  {destination.text}
                </p>
                <span className="mt-3 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-black text-white">
                  {t("morningSheet.open", { defaultValue: "Entrar →" })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
