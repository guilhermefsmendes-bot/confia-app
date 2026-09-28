export interface VerifiedHabitSource { id:string; titleKey:string; organization:string; url:string; checkedOn:string; scope:'population'; }
export const verifiedHabitSources:VerifiedHabitSource[]=[
 {id:'caffeine',titleKey:'habitHub.sources.caffeine',organization:'EFSA',url:'https://www.efsa.europa.eu/en/topics/topic/caffeine',checkedOn:'2026-09-28',scope:'population'},
 {id:'movement',titleKey:'habitHub.sources.movement',organization:'WHO',url:'https://www.who.int/news-room/fact-sheets/detail/physical-activity',checkedOn:'2026-09-28',scope:'population'},
 {id:'plants',titleKey:'habitHub.sources.plants',organization:'WHO',url:'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',checkedOn:'2026-09-28',scope:'population'}
];
