const KEY = "confia_daily_farm";

export function canCareToday(){

  const last = localStorage.getItem(KEY);

  if(!last){
    return true;
  }

  const lastDate = new Date(last).toDateString();
  const today = new Date().toDateString();

  return lastDate !== today;

}


export function completeDailyCare(){

  localStorage.setItem(
    KEY,
    new Date().toISOString()
  );

}
