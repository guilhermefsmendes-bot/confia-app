export interface GrowthItem {
  id: string;
  stage: number;
  lastCare: string;
}


const GROWTH_KEY = "confia_home_growth";


export function getGrowth(): Record<string, GrowthItem> {

  const saved = localStorage.getItem(GROWTH_KEY);

  if (!saved) {
    return {};
  }

  return JSON.parse(saved);

}


export function saveGrowth(
  growth: Record<string, GrowthItem>
) {

  localStorage.setItem(
    GROWTH_KEY,
    JSON.stringify(growth)
  );

}


export function careItem(id:string){

  const growth = getGrowth();


  if (!growth[id]) {

    growth[id] = {
      id,
      stage: 1,
      lastCare: new Date().toISOString()
    };

  } else {

    growth[id].stage = Math.min(
      3,
      growth[id].stage + 1
    );

    growth[id].lastCare =
      new Date().toISOString();

  }


  saveGrowth(growth);

  return growth;

}
