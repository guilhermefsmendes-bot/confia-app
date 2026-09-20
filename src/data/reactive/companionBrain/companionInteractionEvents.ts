import {
  recordCompanionInteraction,
  type CompanionInteractionKind,
  type CompanionSemanticArea,
} from "./companionEventIntelligence";

/**
 * API pequena para o resto da aplicação.
 *
 * Os componentes não precisam de conhecer storage,
 * interpretação ou regras do Brain.
 */
export function emitCompanionInteraction(
  kind: CompanionInteractionKind,
  area: CompanionSemanticArea,
  metadata?: Record<
    string,
    string | number | boolean | null
  >
) {
  return recordCompanionInteraction({
    kind,
    area,
    metadata,
  });
}

export function companionAreaOpened(
  area: CompanionSemanticArea,
  from?: CompanionSemanticArea
) {
  return emitCompanionInteraction(
    "area_opened",
    area,
    from
      ? { from, to: area }
      : { to: area }
  );
}

export function companionReturnedTo(
  area: CompanionSemanticArea,
  from?: CompanionSemanticArea
) {
  return emitCompanionInteraction(
    "area_returned",
    area,
    from
      ? { from, to: area }
      : { to: area }
  );
}

export function companionContact() {
  return emitCompanionInteraction(
    "companion_contact",
    "companion"
  );
}
