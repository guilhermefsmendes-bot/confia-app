import type { FoodType } from './types';
export const PERIODS = ['morning','lunch','afternoon','evening'] as const;
export type DayPeriod = typeof PERIODS[number];
export type FoodUnit = 'item'|'portion'|'cup'|'can'|'bottle'|'ml'|'occasion'|'meal';
export interface FoodItem { category:FoodType; subtype:string; quantity:number; unit:FoodUnit; servingMl?:number; period?:DayPeriod; time?:string; size?:'small'|'medium'|'large'; intensity?:'mild'|'medium'|'strong'; caffeine?:'yes'|'no'|'unknown'; sugar?:'yes'|'no'|'unknown'; deleted:boolean; }
export const FOOD_CATALOG: Record<FoodType,readonly string[]> = {
 coffee:['espresso','short','long','americano','filter','capsule','instant','decaf','other'],
 tea:['black','green','herbal','other'],
 fruit:['apple','banana','orange','pear','kiwi','strawberry','berries','grapes','mango','pineapple','peach','melon','watermelon','other'],
 vegetables:['salad','soup','boiled','grilled','other'],
 soda:['cocaCola','cocaColaZero','pepsi','pepsiMax','sprite','sevenUp','fanta','guarana','orangeJuice','appleJuice','nectar','iceTea','freshJuice','other'],
 water:['still','sparkling'],energy:['energy','sugarFree','other'],
 cereals:['oats','wholegrain','rice','pasta','bread','other'],
 protein:['fish','chicken','eggs','legumes','yogurt','other'],
 fats:['oliveOil','nuts','avocado','butter','other'],
 salty:['chips','processedMeat','saltySnack','other'],
 alcohol:['other'],tobacco:['other'],fastFood:['meal','other'],sweets:['occasion','other']
};
export function defaultUnit(category:FoodType,subtype:string):FoodUnit {
 if(category==='fruit')return ['strawberry','berries','grapes','melon','watermelon','pineapple'].includes(subtype)?'portion':'item';
 return category==='vegetables'||category==='cereals'||category==='protein'?'portion':category==='sweets'||category==='salty'?'occasion':category==='fastFood'?'meal':['water','soda','alcohol','tea'].includes(category)?'cup':category==='energy'?'can':'item';
}
export const isDrink=(category:FoodType)=>['coffee','tea','water','soda','energy','alcohol'].includes(category);
// Brands are display choices, not a nutritional database. Ask the user to check
// the label: formulations vary by market. Unknown never means caffeine-free.
export function foodProperties(item:FoodItem) {
 return {caffeine:item.category==='coffee'?(item.subtype==='decaf'?'unknown':'yes'):item.caffeine??'unknown',sugar:item.sugar??'unknown',water:item.category==='water',juice:['orangeJuice','appleJuice','nectar','freshJuice'].includes(item.subtype),energy:item.category==='energy'};
}
export function validFoodItem(d:FoodItem):boolean {
 return !!d && (FOOD_CATALOG[d.category]?.includes(d.subtype)||d.subtype==='unspecified'&&d.category in FOOD_CATALOG) && Number.isFinite(d.quantity) && d.quantity>=0 && d.quantity<=10000 &&
 ['item','portion','cup','can','bottle','ml','occasion','meal'].includes(d.unit) && typeof d.deleted==='boolean' &&
 (d.unit==='ml'||Number.isInteger(d.quantity)) && (d.unit==='ml'||d.quantity<=100) &&
 (d.servingMl===undefined||(Number.isInteger(d.servingMl)&&d.servingMl>=1&&d.servingMl<=2000)) &&
 (!d.period||PERIODS.includes(d.period)) && (!d.time||/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) &&
 (!d.size||['small','medium','large'].includes(d.size)) && (!d.intensity||['mild','medium','strong'].includes(d.intensity)) &&
 (!d.caffeine||['yes','no','unknown'].includes(d.caffeine)) && (!d.sugar||['yes','no','unknown'].includes(d.sugar));
}
export const itemVolume=(item:FoodItem)=>item.unit==='ml'?item.quantity:item.servingMl?item.quantity*item.servingMl:undefined;
export const itemCount=(item:FoodItem)=>item.category==='water'?(itemVolume(item)??item.quantity*250)/250:item.unit==='ml'?item.quantity/250:item.quantity;

export const FRUIT_ICONS:Record<string,string>={apple:"🍎",banana:"🍌",orange:"🍊",pear:"🍐",kiwi:"🥝",strawberry:"🍓",berries:"🫐",grapes:"🍇",mango:"🥭",pineapple:"🍍",peach:"🍑",melon:"🍈",watermelon:"🍉"};
