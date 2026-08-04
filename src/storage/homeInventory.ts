const INVENTORY_KEY = "home_inventory";
const EQUIPPED_KEY = "home_equipped";


export function getInventory(): string[] {

  const saved = localStorage.getItem(INVENTORY_KEY);

  if (saved) {
    return JSON.parse(saved);
  }


  // Oferta inicial para novos utilizadores
  const initialInventory = ["flower1"];

  localStorage.setItem(
    INVENTORY_KEY,
    JSON.stringify(initialInventory)
  );


  return initialInventory;

}



export function buyItem(id: string) {

  const inventory = getInventory();

  if (!inventory.includes(id)) {

    inventory.push(id);

    localStorage.setItem(
      INVENTORY_KEY,
      JSON.stringify(inventory)
    );

  }

}



export function isOwned(id: string) {

  return getInventory().includes(id);

}



export function getEquipped(): string[] {

  const saved = localStorage.getItem(EQUIPPED_KEY);

  return saved ? JSON.parse(saved) : [];

}



export function isEquipped(id: string) {

  return getEquipped().includes(id);

}



export function toggleEquip(id: string) {

  let equipped = getEquipped();


  if (equipped.includes(id)) {

    equipped = equipped.filter(
      item => item !== id
    );

  } else {

    equipped.push(id);

  }


  localStorage.setItem(
    EQUIPPED_KEY,
    JSON.stringify(equipped)
  );

}
