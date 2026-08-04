export interface FarmState {
  lastCare: number;
}

const KEY = "confia_farm_state";


export function getFarmState(): FarmState {

  const saved = localStorage.getItem(KEY);

  if(saved){
    return JSON.parse(saved);
  }

  return {
    lastCare: Date.now()
  };

}


export function careFarm(){

  const state = {
    lastCare: Date.now()
  };

  localStorage.setItem(
    KEY,
    JSON.stringify(state)
  );

}
