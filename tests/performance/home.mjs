import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const runs=[];
for(let i=0;i<3;i++){
 const context=await browser.newContext({viewport:{width:393,height:851}});
 const page=await context.newPage();let requests=0,firestore=0;
 page.on('request',r=>{requests++;if(r.url().includes('firestore.googleapis.com'))firestore++;});
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
 await page.addInitScript(()=>{localStorage.setItem('confia_language','pt');window.__renders={};const hook={supportsFiber:true,inject(){return 1},onCommitFiberRoot(_,root){function walk(f){if(!f)return;const name=f.type?.displayName||f.type?.name;if(name==='App'||name==='DailyClock'||name==='ConfiaCompanionHome'){window.__renders[name]=(window.__renders[name]||0)+1}walk(f.child);walk(f.sibling)}walk(root.current)},onCommitFiberUnmount(){}};window.__REACT_DEVTOOLS_GLOBAL_HOOK__=hook;});
 const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
 await page.goto('http://127.0.0.1:4174');await page.locator('footer').waitFor();await page.waitForTimeout(2500);
 const metrics=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 runs.push({requests,firestore,...await page.evaluate(()=>({dom:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,resources:performance.getEntriesByType('resource').length,paints:performance.getEntriesByType('paint').map(p=>({name:p.name,start:p.startTime})),renders:window.__renders,overflow:document.documentElement.scrollWidth>innerWidth})),heap:metrics.JSHeapUsedSize,taskDuration:metrics.TaskDuration,scriptDuration:metrics.ScriptDuration});
 await context.close();
}
await browser.close();console.log(JSON.stringify(runs,null,2));
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(runs,null,2));
