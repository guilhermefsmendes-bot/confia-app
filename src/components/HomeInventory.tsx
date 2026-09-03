import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  homeItems,
  getCompanionAccessories,
  isCompanionAccessory,
} from "../data/homeItems";

import {
  getInventory,
  getEquipped,
  toggleEquip,
  toggleCompanionAccessory,
} from "../storage/homeInventory";

import { getWeeklyTrophies } from "../storage/weeklyTrophies";
import ConfiaCreature from "./Companheiro/ConfiaCreature";

interface HomeInventoryProps {
  onBack: () => void;
  companionLevel: number;
}

/**
 * ============================================================
 * CONFIA — PERSONALIZAÇÃO PREMIUM A5.5A
 * ============================================================
 *
 * A mochila antiga passa a ser uma área de personalização.
 *
 * A lógica A5.4 mantém-se:
 * - home_inventory preservado
 * - home_equipped preservado
 * - acessórios por slot preservados
 * - itens legacy preservados
 * - troféus preservados
 *
 * Este passo altera apenas apresentação e organização.
 */
const HomeInventory: React.FC<HomeInventoryProps> = ({
  onBack,
  companionLevel,
}) => {
  const { t } = useTranslation();
  const [, setRefresh] = useState(0);

  const inventory = getInventory();
  const equipped = getEquipped();

  const items = homeItems.filter(item =>
    inventory.includes(item.id)
  );

  const companionItems =
    items.filter(isCompanionAccessory);

  const weeklyTrophies = getWeeklyTrophies();

  /**
   * A5.5B — acessórios atualmente visíveis na CONFIA.
   *
   * A lista continua derivada do catálogo + home_equipped.
   * IDs legacy e troféus não são enviados para o preview.
   */
  const equippedCompanionAccessoryIds =
    getCompanionAccessories()
      .filter(accessory =>
        equipped.includes(accessory.id)
      )
      .map(accessory => accessory.id);

  /**
   * A5.4 — acessórios da CONFIA agrupados por slot.
   *
   * Continua derivado diretamente do catálogo.
   */
  const accessoryIdsBySlot =
    getCompanionAccessories().reduce<
      Record<string, string[]>
    >((acc, accessory) => {
      if (!accessory.companionSlot) {
        return acc;
      }

      const slot = accessory.companionSlot;

      if (!acc[slot]) {
        acc[slot] = [];
      }

      acc[slot].push(accessory.id);

      return acc;
    }, {});

  const getSlotLabel = (
    slot?: string
  ): string => {
    const slotKey =
      slot === "head" ||
      slot === "face" ||
      slot === "neck" ||
      slot === "body" ||
      slot === "hand" ||
      slot === "aura" ||
      slot === "skin" ||
      slot === "mark" ||
      slot === "flame" ||
      slot === "eyes"
        ? slot
        : "other";

    return t(
      `companionCustomization.slots.${slotKey}`
    );
  };

  const getAccessoryName = (
    id: string
  ): string =>
    t(`companionCustomization.items.${id}`);

  return (
    <div className="space-y-7 pb-8">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className="relative overflow-hidden rounded-[30px] border border-[#E7D8CC] bg-gradient-to-br from-[#FFF9F3] via-white to-[#F8ECE4] px-5 pb-6 pt-5 shadow-[0_14px_36px_rgba(118,81,67,0.09)]">

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#E9B99F]/20 blur-2xl"
        />

        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7D8CC] bg-white/80 text-xl text-[#654A42] shadow-sm"
        >
          ←
        </button>

        <div className="relative mt-5 text-center">

          <div
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E7CDBD] bg-white/80 text-3xl shadow-sm"
          >
            ✦
          </div>

          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-[#4E3B36]">
            {t("companionCustomization.title")}
          </h1>

          <p className="mx-auto mt-2 max-w-[310px] text-sm leading-relaxed text-[#826D65]">
            {t("companionCustomization.subtitle")}
          </p>

          {/* A5.5B — preview real da CONFIA */}
          <div className="relative mx-auto mt-5 flex h-[210px] max-w-[260px] items-center justify-center overflow-hidden rounded-[28px] border border-[#EBD8CC] bg-white/55 shadow-inner">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2D4BD]/25 blur-2xl"
            />

            <div className="relative flex h-[195px] w-[195px] items-center justify-center">
              <ConfiaCreature
                level={companionLevel}
                equippedAccessoryIds={
                  equippedCompanionAccessoryIds
                }
              />
            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          ACESSÓRIOS DA CONFIA
      ===================================================== */}

      <section className="space-y-4">

        <div className="px-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="text-lg"
            >
              ✦
            </span>

            <h2 className="font-extrabold text-[#4E3B36]">
              {t(
                "companionCustomization.accessoriesTitle"
              )}
            </h2>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-[#8A756D]">
            {t(
              "companionCustomization.accessoriesSubtitle"
            )}
          </p>
        </div>

        {companionItems.length === 0 ? (

          <div className="rounded-[24px] border border-dashed border-[#DFC8B9] bg-[#FFF9F5] px-5 py-7 text-center">
            <div
              aria-hidden="true"
              className="text-3xl"
            >
              ✧
            </div>

            <p className="mt-2 text-sm font-medium text-[#8A756D]">
              {t(
                "companionCustomization.accessoriesEmpty"
              )}
            </p>
          </div>

        ) : (

          <div className="grid grid-cols-2 gap-3">

            {companionItems.map(item => {
              const isEquipped =
                equipped.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`relative overflow-hidden rounded-[24px] border p-4 transition-colors ${
                    isEquipped
                      ? "border-[#D6A283] bg-[#FFF7F1] shadow-[0_10px_24px_rgba(177,112,82,0.12)]"
                      : "border-[#E9DDD5] bg-white shadow-[0_8px_22px_rgba(92,67,58,0.06)]"
                  }`}
                >

                  {isEquipped && (
                    <div className="absolute right-3 top-3 rounded-full bg-[#C87960] px-2.5 py-1 text-[10px] font-extrabold text-white">
                      {t(
                        "companionCustomization.equipped"
                      )}
                    </div>
                  )}

                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#EFE0D6] bg-gradient-to-br from-[#FFFDFB] to-[#F8E9DF] text-4xl shadow-inner">
                    {item.emoji}
                  </div>

                  <div className="mt-4 min-h-[58px]">
                    <p className="pr-1 text-sm font-extrabold leading-snug text-[#4E3B36]">
                      {getAccessoryName(item.id)}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#B07760]">
                      {getSlotLabel(
                        item.companionSlot
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        item.companionSlot
                      ) {
                        toggleCompanionAccessory(
                          item.id,
                          item.companionSlot,
                          accessoryIdsBySlot
                        );
                      }

                      setRefresh(v => v + 1);
                    }}
                    className={`mt-3 w-full rounded-xl px-3 py-2.5 text-xs font-extrabold transition-colors ${
                      isEquipped
                        ? "bg-[#C87960] text-white"
                        : "bg-[#F2E8E1] text-[#684F46]"
                    }`}
                  >
                    {isEquipped
                      ? `✓ ${t(
                          "companionCustomization.equipped"
                        )}`
                      : t(
                          "companionCustomization.equip"
                        )}
                  </button>

                </div>
              );
            })}

          </div>
        )}

      </section>



    </div>
  );
};

export default HomeInventory;
