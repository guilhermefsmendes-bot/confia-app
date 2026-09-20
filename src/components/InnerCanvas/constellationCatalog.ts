/*
 * CONFIA — catálogo das 88 constelações
 *
 * Os nomes e abreviaturas seguem a nomenclatura
 * astronómica internacional.
 *
 * IMPORTANTE:
 * Este catálogo não atribui diagnósticos psicológicos.
 * A camada simbólica serve apenas como convite à reflexão.
 */

export type ConstellationFamily =
  | "serenity"
  | "expansion"
  | "tension"
  | "inward"
  | "balanced";

export type ConstellationDefinition = {
  id: string;
  name: string;
  abbreviation: string;

  /*
   * Família narrativa CONFIA.
   * Não é uma classificação astronómica
   * nem psicológica.
   */
  family: ConstellationFamily;

  /*
   * Coordenadas normalizadas usadas apenas
   * para desenhar a assinatura visual.
   */
  signature: number[];

  /*
   * Chave narrativa.
   * O texto final será traduzido na UI.
   */
  theme:
    | "perspective"
    | "courage"
    | "patience"
    | "connection"
    | "renewal"
    | "direction"
    | "balance"
    | "rest"
    | "curiosity"
    | "resilience"
    | "openness";
};

const S = (
  id: string,
  name: string,
  abbreviation: string,
  family: ConstellationFamily,
  theme: ConstellationDefinition["theme"],
  signature: number[]
): ConstellationDefinition => ({
  id,
  name,
  abbreviation,
  family,
  theme,
  signature,
});

export const CONSTELLATIONS: ConstellationDefinition[] = [
  S("andromeda","Andromeda","And","inward","resilience",[.12,.42,.70,.36,.84,.55,.23,.68]),
  S("antlia","Antlia","Ant","serenity","rest",[.30,.55,.62,.41,.75,.28,.47,.64]),
  S("apus","Apus","Aps","expansion","openness",[.71,.23,.54,.82,.35,.63,.18,.48]),
  S("aquarius","Aquarius","Aqr","balanced","renewal",[.42,.73,.25,.64,.51,.86,.32,.57]),
  S("aquila","Aquila","Aql","expansion","courage",[.82,.35,.67,.21,.74,.53,.40,.69]),
  S("ara","Ara","Ara","serenity","balance",[.55,.27,.76,.48,.34,.61,.83,.42]),
  S("aries","Aries","Ari","expansion","direction",[.78,.44,.22,.65,.38,.81,.57,.29]),
  S("auriga","Auriga","Aur","balanced","direction",[.46,.81,.37,.62,.73,.28,.55,.68]),
  S("bootes","Boötes","Boo","expansion","direction",[.84,.31,.58,.76,.20,.69,.45,.63]),
  S("caelum","Caelum","Cae","serenity","curiosity",[.29,.61,.43,.78,.52,.34,.70,.46]),
  S("camelopardalis","Camelopardalis","Cam","balanced","patience",[.38,.75,.61,.24,.83,.49,.57,.32]),
  S("cancer","Cancer","Cnc","inward","connection",[.44,.26,.73,.51,.62,.35,.80,.48]),
  S("canes_venatici","Canes Venatici","CVn","expansion","connection",[.69,.52,.31,.77,.45,.63,.24,.85]),
  S("canis_major","Canis Major","CMa","expansion","courage",[.87,.42,.65,.30,.74,.56,.21,.68]),
  S("canis_minor","Canis Minor","CMi","serenity","connection",[.52,.34,.71,.48,.26,.63,.79,.41]),
  S("capricornus","Capricornus","Cap","balanced","patience",[.33,.72,.54,.81,.46,.25,.67,.59]),
  S("carina","Carina","Car","expansion","direction",[.76,.29,.83,.47,.61,.35,.68,.52]),
  S("cassiopeia","Cassiopeia","Cas","balanced","perspective",[.25,.76,.38,.84,.43,.71,.32,.65]),
  S("centaurus","Centaurus","Cen","expansion","resilience",[.81,.53,.27,.69,.42,.75,.34,.60]),
  S("cepheus","Cepheus","Cep","balanced","perspective",[.62,.28,.77,.45,.83,.36,.51,.69]),
  S("cetus","Cetus","Cet","inward","openness",[.31,.67,.48,.79,.26,.55,.72,.40]),
  S("chamaeleon","Chamaeleon","Cha","serenity","patience",[.43,.70,.32,.58,.81,.25,.64,.49]),
  S("circinus","Circinus","Cir","serenity","balance",[.68,.24,.51,.73,.39,.82,.46,.30]),
  S("columba","Columba","Col","serenity","renewal",[.57,.35,.76,.42,.69,.28,.84,.51]),
  S("coma_berenices","Coma Berenices","Com","serenity","connection",[.36,.82,.47,.63,.25,.71,.54,.40]),
  S("corona_australis","Corona Australis","CrA","serenity","renewal",[.73,.41,.29,.65,.84,.37,.56,.48]),
  S("corona_borealis","Corona Borealis","CrB","serenity","renewal",[.65,.32,.78,.46,.24,.83,.51,.69]),
  S("corvus","Corvus","Crv","tension","perspective",[.27,.74,.53,.38,.81,.62,.45,.30]),
  S("crater","Crater","Crt","inward","openness",[.49,.28,.68,.75,.34,.57,.82,.43]),
  S("crux","Crux","Cru","balanced","direction",[.86,.40,.61,.22,.73,.55,.31,.79]),
  S("cygnus","Cygnus","Cyg","serenity","balance",[.58,.77,.33,.69,.45,.82,.26,.54]),
  S("delphinus","Delphinus","Del","expansion","connection",[.74,.36,.59,.81,.43,.27,.68,.52]),
  S("dorado","Dorado","Dor","expansion","curiosity",[.67,.45,.80,.31,.56,.72,.24,.63]),
  S("draco","Draco","Dra","tension","resilience",[.23,.81,.46,.68,.35,.75,.52,.29]),
  S("equuleus","Equuleus","Equ","serenity","courage",[.54,.31,.72,.48,.85,.39,.62,.26]),
  S("eridanus","Eridanus","Eri","inward","direction",[.30,.69,.44,.83,.57,.25,.76,.51]),
  S("fornax","Fornax","For","tension","renewal",[.79,.26,.64,.47,.32,.85,.53,.70]),
  S("gemini","Gemini","Gem","balanced","connection",[.41,.78,.55,.29,.67,.84,.36,.62]),
  S("grus","Grus","Gru","expansion","openness",[.83,.37,.60,.72,.28,.51,.76,.44]),
  S("hercules","Hercules","Her","expansion","resilience",[.88,.34,.71,.49,.63,.25,.80,.56]),
  S("horologium","Horologium","Hor","serenity","patience",[.35,.64,.82,.43,.58,.27,.73,.50]),
  S("hydra","Hydra","Hya","inward","resilience",[.21,.68,.37,.79,.54,.31,.74,.46]),
  S("hydrus","Hydrus","Hyi","serenity","renewal",[.61,.24,.75,.52,.33,.81,.47,.69]),
  S("indus","Indus","Ind","balanced","curiosity",[.45,.83,.29,.66,.51,.74,.38,.57]),
  S("lacerta","Lacerta","Lac","serenity","curiosity",[.70,.33,.56,.78,.42,.25,.65,.84]),
  S("leo","Leo","Leo","expansion","courage",[.85,.47,.30,.72,.59,.81,.36,.64]),
  S("leo_minor","Leo Minor","LMi","expansion","courage",[.77,.25,.62,.49,.83,.40,.55,.71]),
  S("lepus","Lepus","Lep","tension","openness",[.32,.80,.51,.67,.24,.73,.46,.58]),
  S("libra","Libra","Lib","balanced","balance",[.50,.72,.28,.81,.44,.63,.35,.76]),
  S("lupus","Lupus","Lup","tension","resilience",[.26,.73,.48,.82,.37,.61,.54,.29]),
  S("lynx","Lynx","Lyn","serenity","curiosity",[.63,.29,.84,.45,.52,.76,.34,.68]),
  S("lyra","Lyra","Lyr","serenity","connection",[.72,.38,.81,.27,.59,.44,.75,.53]),
  S("mensa","Mensa","Men","serenity","rest",[.40,.65,.31,.78,.56,.24,.70,.49]),
  S("microscopium","Microscopium","Mic","serenity","curiosity",[.53,.82,.36,.61,.27,.74,.45,.68]),
  S("monoceros","Monoceros","Mon","balanced","openness",[.68,.43,.25,.77,.52,.84,.39,.60]),
  S("musca","Musca","Mus","tension","curiosity",[.24,.79,.55,.32,.71,.48,.83,.36]),
  S("norma","Norma","Nor","balanced","balance",[.47,.30,.76,.58,.82,.35,.64,.51]),
  S("octans","Octans","Oct","serenity","direction",[.59,.26,.73,.41,.85,.54,.32,.67]),
  S("ophiuchus","Ophiuchus","Oph","balanced","renewal",[.37,.81,.50,.68,.29,.75,.43,.62]),
  S("orion","Orion","Ori","expansion","courage",[.89,.52,.31,.74,.46,.83,.60,.27]),
  S("pavo","Pavo","Pav","expansion","openness",[.75,.28,.63,.86,.41,.54,.32,.70]),
  S("pegasus","Pegasus","Peg","expansion","openness",[.80,.44,.67,.25,.73,.58,.34,.85]),
  S("perseus","Perseus","Per","expansion","courage",[.84,.39,.57,.76,.30,.68,.51,.82]),
  S("phoenix","Phoenix","Phe","balanced","renewal",[.66,.24,.82,.47,.35,.73,.59,.41]),
  S("pictor","Pictor","Pic","serenity","curiosity",[.48,.71,.33,.80,.55,.26,.64,.42]),
  S("pisces","Pisces","Psc","inward","connection",[.34,.76,.49,.62,.27,.83,.53,.40]),
  S("piscis_austrinus","Piscis Austrinus","PsA","inward","direction",[.28,.69,.45,.81,.36,.57,.74,.52]),
  S("puppis","Puppis","Pup","balanced","direction",[.71,.35,.79,.48,.26,.66,.54,.83]),
  S("pyxis","Pyxis","Pyx","balanced","direction",[.60,.27,.84,.42,.56,.73,.31,.65]),
  S("reticulum","Reticulum","Ret","serenity","connection",[.51,.74,.30,.68,.43,.82,.37,.59]),
  S("sagitta","Sagitta","Sge","expansion","direction",[.82,.23,.69,.47,.75,.34,.58,.86]),
  S("sagittarius","Sagittarius","Sgr","expansion","direction",[.78,.50,.29,.85,.61,.37,.72,.44]),
  S("scorpius","Scorpius","Sco","tension","resilience",[.22,.84,.41,.70,.33,.77,.56,.28]),
  S("sculptor","Sculptor","Scl","inward","curiosity",[.39,.73,.25,.65,.81,.46,.58,.32]),
  S("scutum","Scutum","Sct","balanced","resilience",[.69,.31,.80,.43,.55,.74,.26,.62]),
  S("serpens","Serpens","Ser","inward","renewal",[.30,.82,.52,.67,.23,.75,.44,.59]),
  S("sextans","Sextans","Sex","serenity","perspective",[.57,.24,.70,.49,.83,.36,.61,.45]),
  S("taurus","Taurus","Tau","expansion","resilience",[.86,.46,.28,.73,.55,.81,.38,.64]),
  S("telescopium","Telescopium","Tel","serenity","perspective",[.42,.79,.34,.66,.51,.85,.27,.58]),
  S("triangulum","Triangulum","Tri","balanced","balance",[.64,.32,.77,.48,.25,.83,.55,.69]),
  S("triangulum_australe","Triangulum Australe","TrA","balanced","balance",[.73,.27,.61,.84,.39,.52,.76,.33]),
  S("tucana","Tucana","Tuc","expansion","curiosity",[.81,.36,.54,.72,.25,.67,.43,.85]),
  S("ursa_major","Ursa Major","UMa","balanced","resilience",[.76,.41,.83,.29,.65,.52,.34,.71]),
  S("ursa_minor","Ursa Minor","UMi","serenity","direction",[.58,.30,.74,.46,.82,.35,.63,.51]),
  S("vela","Vela","Vel","expansion","direction",[.79,.33,.68,.47,.84,.26,.57,.72]),
  S("virgo","Virgo","Vir","serenity","renewal",[.62,.43,.28,.80,.54,.71,.35,.66]),
  S("volans","Volans","Vol","expansion","openness",[.74,.29,.85,.50,.37,.63,.78,.42]),
  S("vulpecula","Vulpecula","Vul","serenity","curiosity",[.55,.81,.32,.69,.44,.76,.27,.60]),
];

if (CONSTELLATIONS.length !== 88) {
  throw new Error(
    `Expected 88 constellations, found ${CONSTELLATIONS.length}`
  );
}
