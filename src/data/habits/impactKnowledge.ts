/**
 * Curated, population-level evidence used by the Habit Impact engine.
 * This is a local, reviewable knowledge base: the UI never invents citations.
 * Statistical estimates describe study populations, not an individual user's body.
 */
export interface HabitImpactSource {
  id: string;
  title: string;
  organization: string;
  url: string;
  evidenceType: string;
  population: string;
  statistic: string;
  certainty: string;
  limitations: string;
  checkedOn: string;
}

export const HABIT_IMPACT_SOURCES: Record<string, HabitImpactSource> = {
  sleepRestriction: {
    id: "sleepRestriction",
    title: "Impact of one night of sleep restriction on sleepiness and cognitive function: a systematic review and meta-analysis",
    organization: "Sleep Medicine Reviews / PubMed",
    url: "https://pubmed.ncbi.nlm.nih.gov/38759474/",
    evidenceType: "Systematic review and meta-analysis of 44 studies",
    population: "Adults; sleep opportunity restricted to 2–6 hours for one night",
    statistic: "One night of restricted sleep increased subjective sleepiness (standardised mean difference 0.986) and impaired sustained attention: reaction time SMD 0.512 and attentional lapses SMD 0.489.",
    certainty: "Evidence of short-term effects on sleepiness and sustained attention; effects varied by cognitive outcome.",
    limitations: "Standardised mean differences are not percentages and do not predict an individual's reaction time or emotional state.",
    checkedOn: "2026-10-29",
  },
  adultSleep: {
    id: "adultSleep",
    title: "Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement",
    organization: "American Academy of Sleep Medicine / Sleep Research Society",
    url: "https://www.aasm.org/resources/pdf/adultsleepdurationconsensus.pdf",
    evidenceType: "Expert consensus statement",
    population: "Healthy adults",
    statistic: "Adults should sleep 7 or more hours per night regularly to promote optimal health.",
    certainty: "Consensus recommendation supported by a review of health outcomes.",
    limitations: "Individual sleep needs and occasional recovery needs vary; a single short night is not a diagnosis.",
    checkedOn: "2026-10-29",
  },
  caffeine: {
    id: "caffeine",
    title: "Caffeine",
    organization: "European Food Safety Authority (EFSA)",
    url: "https://www.efsa.europa.eu/en/topics/topic/caffeine",
    evidenceType: "Scientific risk assessment and public guidance",
    population: "Healthy adults; not applicable to every medical condition or pregnancy",
    statistic: "EFSA states that up to 400 mg per day across the day does not raise safety concerns for most healthy adults; a single dose of 100 mg may affect sleep in some adults, particularly close to bedtime.",
    certainty: "Official population-level guidance; individual sensitivity varies.",
    limitations: "Confia's caffeine amounts are estimates from typical serving values, not laboratory measurements or product-label data.",
    checkedOn: "2026-10-29",
  },
  physicalActivity: {
    id: "physicalActivity",
    title: "WHO guidelines on physical activity and sedentary behaviour: at a glance",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/europe/publications/i/item/9789240014886",
    evidenceType: "Public health guideline based on evidence review",
    population: "Adults",
    statistic: "WHO recommends 150–300 minutes of moderate aerobic activity per week, or 75–150 minutes of vigorous activity, and muscle-strengthening activity on at least 2 days per week.",
    certainty: "Public health recommendation; any activity is better than none.",
    limitations: "Minutes logged without intensity cannot be reliably counted as moderate or vigorous activity. Individual ability and medical context matter.",
    checkedOn: "2026-10-29",
  },
  fruitVegetables: {
    id: "fruitVegetables",
    title: "Healthy diet",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet",
    evidenceType: "Public health guideline",
    population: "People older than 10 years",
    statistic: "WHO recommends at least 400 g of fruit and vegetables per day for people older than 10 years.",
    certainty: "Official population-level dietary recommendation.",
    limitations: "Counts of individual items cannot be converted accurately into grams without portion or weight information.",
    checkedOn: "2026-10-29",
  },
  hydrationPortugal: {
    id: "hydrationPortugal",
    title: "Conheça os Alimentos — Dia Alimentar Completo, Equilibrado e Variado",
    organization: "Programa Nacional para a Promoção da Alimentação Saudável (DGS), Portugal",
    url: "https://alimentacaosaudavel.dgs.pt/conheca-os-alimentos/",
    evidenceType: "Public health guidance",
    population: "General public; needs vary by circumstances",
    statistic: "DGS public guidance suggests drinking at least 1.5 litres of water per day and increasing intake in heat or with exercise.",
    certainty: "Practical general guidance, not an individual hydration test.",
    limitations: "Logged water is not total fluid intake; needs vary with body size, diet, temperature, activity and health.",
    checkedOn: "2026-10-29",
  },
  ultraProcessedFood: {
    id: "ultraProcessedFood",
    title: "Ultra-processed food exposure and adverse health outcomes: umbrella review of epidemiological meta-analyses",
    organization: "The BMJ / PubMed",
    url: "https://pubmed.ncbi.nlm.nih.gov/38418082/",
    evidenceType: "Umbrella review of 45 pooled analyses, including 9,888,373 participants",
    population: "Population studies; exposure to ultra-processed foods",
    statistic: "Greater ultra-processed-food exposure was associated with prevalent anxiety outcomes (odds ratio 1.48, 95% CI 1.37–1.59); the evidence quality for this outcome was rated low.",
    certainty: "Association; evidence quality low for the anxiety outcome.",
    limitations: "An odds ratio is not an individual's percentage increase in anxiety. A generic 'fast food' log does not establish NOVA processing class or quantify exposure.",
    checkedOn: "2026-10-29",
  },
  freeSugar: {
    id: "freeSugar",
    title: "Healthy diet",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet",
    evidenceType: "Public health dietary guideline",
    population: "General population; energy needs vary",
    statistic: "WHO recommends limiting free sugars to less than 10% of daily energy intake, ideally 5% or less. For an adult consuming 2,000 kcal/day, 10% is approximately 50 g.",
    certainty: "Official population-level recommendation.",
    limitations: "Confia currently records occasions or quantities of sweets, not the grams of free sugar or total daily energy needed to calculate this percentage.",
    checkedOn: "2026-10-29",
  },
  salt: {
    id: "salt",
    title: "Healthy diet / Sodium reduction",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/news-room/fact-sheets/detail/sodium-reduction",
    evidenceType: "Public health dietary guideline",
    population: "Adults",
    statistic: "WHO recommends less than 2,000 mg sodium per day, equivalent to less than 5 g of salt. High sodium intake is associated with raised blood pressure and increased cardiovascular risk.",
    certainty: "Official population-level recommendation.",
    limitations: "The current Confia category records salty foods or occasions, not the sodium content of each product or total daily salt intake.",
    checkedOn: "2026-10-29",
  },
  tobacco: {
    id: "tobacco",
    title: "Tobacco and nicotine",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/news-room/fact-sheets/detail/tobacco",
    evidenceType: "Public health fact sheet",
    population: "People who use tobacco and people exposed to second-hand smoke",
    statistic: "WHO reports that tobacco kills more than 7 million people each year and that all forms of tobacco use are harmful; there is no safe level of exposure.",
    certainty: "Established population-level evidence of harm.",
    limitations: "A generic category count does not identify the product, nicotine content, quantity or duration, so it cannot estimate an individual's exposure or risk.",
    checkedOn: "2026-10-29",
  },
  gamingDisorder: {
    id: "gamingDisorder",
    title: "Gaming disorder",
    organization: "World Health Organization (WHO), ICD-11",
    url: "https://www.who.int/standards/classifications/frequently-asked-questions/gaming-disorder",
    evidenceType: "International disease classification and expert review",
    population: "People whose gaming pattern causes significant impairment in functioning",
    statistic: "WHO defines gaming disorder by impaired control, gaming taking priority over other activities, and continuing despite negative consequences; the pattern must cause significant impairment and is normally evident for at least 12 months.",
    certainty: "Clinical classification; not a threshold for ordinary gaming duration.",
    limitations: "Gaming or a single gaming session does not imply a disorder. Confia's current habit check-in does not measure hours, impaired control or functional impairment.",
    checkedOn: "2026-10-29",
  },
  alcohol: {
    id: "alcohol",
    title: "Alcohol",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/news-room/fact-sheets/detail/alcohol",
    evidenceType: "Public health fact sheet",
    population: "General population; risk depends on amount and context",
    statistic: "WHO states that no form of alcohol consumption is risk-free; risk depends on amount, frequency and personal factors.",
    certainty: "Public health guidance.",
    limitations: "The current Confia entry does not reliably record beverage volume and alcohol concentration, so grams of ethanol cannot be calculated.",
    checkedOn: "2026-10-29",
  },
};

export const HABIT_IMPACT_SOURCE_IDS = Object.keys(HABIT_IMPACT_SOURCES);
