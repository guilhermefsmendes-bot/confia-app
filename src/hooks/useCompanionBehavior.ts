import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCompanionBehaviorContext,
} from "../data/reactive/companionBrain/companionBehaviorContext";

import {
  resolveCompanionBehaviorResponse,
} from "../data/reactive/companionBrain/companionBehaviorResponse";

/**
 * Mantém a UI sincronizada com a memória comportamental.
 *
 * Não cria polling.
 * Só recalcula quando existe uma interação V3 real.
 */
export function useCompanionBehavior() {
  const [revision, setRevision] =
    useState(0);

  useEffect(() => {
    const handleInteraction = () => {
      setRevision(
        current => current + 1
      );
    };

    window.addEventListener(
      "confia-companion-interaction",
      handleInteraction
    );

    return () => {
      window.removeEventListener(
        "confia-companion-interaction",
        handleInteraction
      );
    };
  }, []);

  const behavior =
    useMemo(
      () =>
        getCompanionBehaviorContext(),
      [revision]
    );

  const response =
    useMemo(
      () =>
        resolveCompanionBehaviorResponse(
          behavior
        ),
      [behavior]
    );

  return {
    behavior,
    response,
  };
}
