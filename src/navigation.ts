// Stable internal IDs preserve Community and native-link integrations.
export const TAB={home:0,embrace:1,objectives:2,community:4} as const;
export function habitDestination(action:'home'|'log'|'setup'){return {tab:TAB.home,page:action};}
export function screenName(tab:number,screen='home'){
 if(tab===TAB.embrace)return screen==='innerCanvas'?'embrace_sky':'embrace';
 if(tab===TAB.objectives)return 'objectives';
 if(tab===TAB.community)return 'community';
 return screen==='home'?'home':`home_${screen}`;
}
