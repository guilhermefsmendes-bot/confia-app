const KEY = "confia_garden";


export interface GardenState {
  plantedAt:number | null;
}


export function getGarden():GardenState{

const saved = localStorage.getItem(KEY);

if(saved){
 return JSON.parse(saved);
}

return {
 plantedAt:null
};

}



export function plant(){

const state={
 plantedAt:Date.now()
};

localStorage.setItem(
 KEY,
 JSON.stringify(state)
);

}



export function harvest(){

localStorage.setItem(
 KEY,
 JSON.stringify({
  plantedAt:null
 })
);

}
