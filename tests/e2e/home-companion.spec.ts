import {test,expect} from '@playwright/test';
for(const [lang,hug,sky,explore,pause] of [['pt','Abraço','Céu','Quero explorar','Preciso de uma pausa'],['en','Hug','Sky','I want to explore','I need a pause'],['es','Abrazo','Cielo','Quiero explorar','Necesito una pausa'],['fr','Câlin','Ciel','Je veux explorer',"J'ai besoin d'une pause"]])test('four tabs and sky in embrace: '+lang,async({page})=>{
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());await page.addInitScript(l=>localStorage.setItem('confia_language',l),lang);await page.goto('/');
 await page.locator('#home-habits').scrollIntoViewIfNeeded();
 const nav=page.locator('footer');await expect(nav.getByRole('button')).toHaveCount(4);await expect(page.getByTestId('challenge-clock')).toBeVisible();
 await expect(nav.getByRole('button',{name:/^(Hábitos|Habits|Habitudes)$/})).toHaveCount(0);await expect(page.getByRole('button',{name:new RegExp(sky+'$','i')})).toHaveCount(0);
 await nav.getByRole('button').nth(1).click();await page.getByRole('button',{name:pause,exact:true}).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:explore,exact:true}).click();await expect(page.getByRole('button',{name:explore,exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:pause,exact:true}).click();await expect(page.getByRole('button',{name:pause,exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:explore,exact:true}).click();const button=page.getByRole('button',{name:new RegExp(sky+'$','i')});await expect(button).toBeVisible();await button.click();await expect(page.locator('footer button[aria-current="page"]')).toHaveText(hug);await expect(page.getByTestId('challenge-clock')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await nav.getByRole('button').first().click();await expect(page.getByTestId('challenge-clock')).toBeVisible();
});
test('home loads heavy habit screens only on demand and fits 320px',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());await page.addInitScript(()=>localStorage.setItem('confia_language','pt'));
 const requested:string[]=[];page.on('request',r=>requested.push(r.url()));await page.goto('/');await page.locator('#home-habits').scrollIntoViewIfNeeded();await page.getByTestId('challenge-clock').waitFor();await page.waitForTimeout(1200);
 expect(requested.some(u=>/\/(NutritionDashboard|ExerciseDashboard|HabitHistory|WellbeingPlans)-/.test(u))).toBe(false);
 await expect(page.getByTestId('habit-mirror-insights')).toBeVisible();
 await expect(page.getByTestId('habit-mirror-insights').getByRole('status')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/confia-new-home-320.png',fullPage:true});
 await page.getByRole('button',{name:/Alimentação/}).click();await expect(page.getByRole('heading',{name:'Alimenta-me',exact:true})).toBeVisible();expect(requested.some(u=>/\/NutritionDashboard-/.test(u))).toBe(true);
});
test('companion supports a restart, shares its utterance and keeps bounded memory',async({page})=>{
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
 await page.addInitScript(()=>{localStorage.setItem('confia_language','pt');const d=new Date(),day=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');const base={date:day,updatedAt:d.toISOString(),timezone:'UTC'};localStorage.setItem('confia_habits_v1:guest',JSON.stringify({version:1,pending:{},records:[{...base,id:'h',kind:'habit',data:{active:true,type:'coffee',name:'',goal:'Pausa',icon:'☕',createdAt:d.toISOString()}},{...base,id:'restart',kind:'restart',data:{habitId:'h',reason:'once',bestBefore:7}}]}));});
 await page.goto('/');const voice=page.getByTestId('companion-voice');await voice.scrollIntoViewIfNeeded();await expect(voice).toHaveAttribute('data-rule',/^daily:restart:/);const message=await voice.locator('p').innerText();await expect(voice).toContainText('Recomeçar não apaga');
 await page.getByRole('button',{name:/CONFIA Amigo/}).click();await expect(page.getByTestId('companion-voice').locator('p')).toHaveText(message);
 const memory=await page.evaluate(()=>JSON.parse(localStorage.getItem('confia_companion_brain_memory_v2:guest')!).shownMessages);expect(memory.filter((m:any)=>m.id.startsWith('daily:restart:'))).toHaveLength(1);expect(JSON.stringify(memory)).not.toContain(message);
});
for(const action of ['home','log','setup'])test('native legacy habit link opens Home: '+action,async({page})=>{
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
 await page.addInitScript(action=>{localStorage.setItem('confia_language','pt');const w=window as any;w.androidBridge={};w.nativeCallbacks={};w.Capacitor={PluginHeaders:[{name:'ConfiaDevice',methods:['info','configure','widget','token','consumeLink','removeListener'].map(name=>({name,rtype:'promise'})).concat([{name:'addListener',rtype:'callback'}])},{name:'App',methods:[{name:'addListener',rtype:'callback'},{name:'removeListener',rtype:'promise'}]}],nativePromise:async(_:string,method:string)=>method==='info'?{deviceId:'test',permission:false}:method==='consumeLink'?{url:'confia://habits'+(action==='home'?'':'/'+action)}:{},nativeCallback:(plugin:string,method:string,options:any,callback:any)=>{w.nativeCallbacks[options.eventName]=callback;return 'test';}};},action);
 await page.goto('/');await expect(page.locator('footer button[aria-current="page"]')).toHaveText('Principal');
 if(action==='home')await expect(page.getByTestId('challenge-clock')).toBeVisible();else await expect(page.getByRole('heading',{name:'Os meus hábitos',exact:true})).toBeVisible();
 expect(await page.locator('footer button').count()).toBe(4);
});
test('personal-event listeners remain bounded after repeated records',async({page})=>{
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
 await page.addInitScript(()=>{localStorage.setItem('confia_language','pt');const set=new Set();const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);window.addEventListener=((name:any,fn:any,...args:any[])=>{if(name==='confia:personal-events-updated')set.add(fn);return add(name,fn,...args);}) as any;window.removeEventListener=((name:any,fn:any,...args:any[])=>{if(name==='confia:personal-events-updated')set.delete(fn);return remove(name,fn,...args);}) as any;(window as any).personalListenerCount=()=>set.size;});
 await page.goto('/');await page.getByTestId('challenge-clock').waitFor();await page.waitForTimeout(1500);
 const before=await page.evaluate(()=>(window as any).personalListenerCount());
 for(let i=0;i<5;i++){await page.evaluate(()=>window.dispatchEvent(new Event('confia:personal-events-updated')));await page.waitForTimeout(120);}
 await expect.poll(()=>page.evaluate(()=>(window as any).personalListenerCount())).toBe(before);
 expect(before).toBeLessThanOrEqual(4);
});

test('objectives show the next action without forcing a gendered avatar choice',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
 await page.addInitScript(()=>localStorage.setItem('confia_language','pt'));
 await page.goto('/');
 await page.locator('footer').getByRole('button').nth(2).click();
 const customize=page.getByRole('button',{name:'Personalizar explorador',exact:true});
 await expect(customize).toBeVisible();
 await expect(page.getByText('Quem vai subir contigo?',{exact:true})).toHaveCount(0);
 const mountain=page.getByTestId('objective-mountain');
 await expect(mountain).toBeVisible();
 const height=await mountain.evaluate(element=>element.getBoundingClientRect().height);
 expect(height).toBeLessThan(600);
 await customize.click();
 await expect(page.getByText('Quem vai subir contigo?',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Explorador/a',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Explorador/a',exact:true}).click();
 await expect(page.getByText('Quem vai subir contigo?',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('Espelho na Água opens its first view without a nested loading state',async({page})=>{
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
 await page.addInitScript(()=>localStorage.setItem('confia_language','pt'));
 await page.goto('/');
 await page.locator('#home-habits').scrollIntoViewIfNeeded();
 await expect(page.getByTestId('challenge-clock')).toBeVisible();
 const mirror=page.getByTestId('habit-mirror-insights');
 await expect(mirror).toBeVisible({timeout:5000});
 await expect(mirror.getByRole('status')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Calendário',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Calendário',exact:true}).click();
 await expect(page.getByText(/calendário|calendar/i).first()).toBeVisible();
 await page.getByRole('button',{name:/relatório|report/i}).click();
 await expect(page.getByRole('button',{name:/imprimir|print/i})).toBeVisible();
});
