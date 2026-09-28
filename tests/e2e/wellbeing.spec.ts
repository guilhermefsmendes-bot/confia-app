import { test,expect,type Page } from '@playwright/test';
async function open(page:Page,lang='pt') {
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
 await page.addInitScript(l=>localStorage.setItem('confia_language',l),lang);await page.goto('/');
  await page.getByTestId("challenge-clock").waitFor();
  await page.locator("#home-habits details").filter({has:page.locator("summary",{hasText:/O meu dia|My day|Mi día|Ma journée/})}).locator("summary").first().click();
}
async function seed(page:Page,mode='baseline') {
 await page.clock.install({time:new Date('2026-09-28T12:00:00Z')});
 await page.addInitScript(mode=>{
  const shift=(n:number)=>{const d=new Date();d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const rec=(id:string,kind:string,date:string,data:object)=>({id,kind,date,data,updatedAt:date+'T10:00:00.000Z',timezone:'UTC'});
  const records:any[]=[];
  for(let n=1;n<=(mode==='insufficient'?2:14);n++){records.push(rec('nutrition_'+n,'nutrition',shift(-n),{coffee:4,fruit:1,water:5}));records.push(rec('exercise_'+n,'exercise',shift(-n),{activity:'walk',minutes:20}));}
  if(mode==='completed')records.push(rec('plan_old','wellbeingPlan',shift(-16),{templateId:'caffeine',status:'active',startDate:shift(-16),endDate:shift(-2),pausedAt:'',pausedDays:0,gentle:false,baseline:{mean:5,days:10,moodMean:0,moodDays:0}}));
  localStorage.setItem('confia_habits_v1:guest',JSON.stringify({version:1,records,pending:{}}));
 },mode);
}
test('detailed foods: multiple fruits, timed coffee, drinks, edits and offline persistence',async({page,context})=>{
 test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
 await page.getByRole('button',{name:/Alimenta-me/}).click();
 async function category(name:RegExp){await page.getByRole('button',{name}).click();await expect(page.getByRole('dialog')).toBeVisible();}
 async function save(){await page.getByRole('button',{name:'Guardar alimento ou bebida',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);}
 await category(/Fruta Adicionar/);await page.getByRole('button',{name:'Maçã',exact:true}).click();await page.getByLabel('Quantidade exata').fill('2');await save();
 await category(/Fruta Adicionar/);await page.getByRole('button',{name:'Banana',exact:true}).click();await save();
 await category(/Café Adicionar/);await page.getByRole('button',{name:'Café de filtro',exact:true}).click();await page.getByLabel('Quantidade exata').fill('3');await page.getByLabel('Período do dia (opcional)').selectOption('afternoon');await page.getByText('Mais detalhes (opcional)',{exact:true}).click();await page.getByLabel('Hora aproximada').fill('17:30');await page.getByLabel('Intensidade percebida').selectOption('strong');await save();
 await category(/Refrigerantes e sumos Adicionar/);await page.getByRole('button',{name:'Coca-Cola',exact:true}).click();await page.getByLabel('Unidade',{exact:true}).selectOption('can');await page.getByLabel('ml por recipiente').fill('330');await save();
 await category(/Água Adicionar/);await page.getByLabel('Unidade',{exact:true}).selectOption('ml');await page.getByLabel('Quantidade exata').fill('1500');await context.setOffline(true);await save();
 const apple=page.locator('li').filter({hasText:/maçã/i});await apple.getByRole('button',{name:'Editar',exact:true}).click();await page.getByLabel('Quantidade exata').fill('4');await save();
 await expect(apple).toContainText('4 maçãs');await expect(page.getByText('17:30',{exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Algo a observar',exact:true})).toBeVisible();await expect(page.getByText(/Registaste cafeína à tarde/)).toBeVisible();
 const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('confia_habits_v1:guest')!));
 expect(snapshot.records.filter((r:any)=>r.kind==='foodItem')).toHaveLength(5);
 expect(snapshot.records.find((r:any)=>r.kind==='nutrition').data).toMatchObject({fruit:5,coffee:3,water:6,soda:1});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/confia-detailed-nutrition.png',fullPage:true});
 await context.setOffline(false);await page.getByRole('button',{name:'Concluir e ver o meu dia',exact:true}).click();
 await page.getByRole('button',{name:/Exercício/}).click();await page.getByRole('button',{name:'30 min',exact:true}).click();await page.getByLabel('Período do dia (opcional)').selectOption('evening');await page.getByRole('button',{name:'Guardar registo',exact:true}).click();
 await expect(page.getByText('Registaste 30 minutos de movimento.',{exact:false})).toBeVisible();
  await page.reload();await page.getByTestId("challenge-clock").waitFor();
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('confia_habits_v1:guest')!));
 expect(restored.records.filter((r:any)=>r.kind==='foodItem')).toHaveLength(5);expect(restored.records.find((r:any)=>r.kind==='exercise').data.period).toBe('evening');expect(errors).toEqual([]);
});
test('plans: explicit consent, local day progression, pause, adaptation, resume and preserved abandonment',async({page})=>{
 test.setTimeout(60000);
 await seed(page);await open(page);const plans=page.getByRole('region',{name:'Planos de 15 dias'});
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('confia_habits_v1:guest')!).records.some((r:any)=>r.kind==='wellbeingPlan'))).toBe(false);
 await plans.getByLabel('Escolhe uma experiência').selectOption('caffeine');await plans.getByRole('button',{name:'Experimentar',exact:true}).click();
 await expect(plans.getByText('Dia 1 de 15',{exact:false})).toBeVisible();await plans.getByRole('button',{name:'Hoje experimentei',exact:true}).click();
 await page.clock.setSystemTime(new Date('2026-09-29T12:00:00Z'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(plans.locator('p').filter({hasText:/^Dia 2 de 15 ·/})).toBeVisible();await plans.getByRole('button',{name:'Hoje não aconteceu',exact:true}).click();await expect(plans.getByText('Hoje não aconteceu como estava previsto.',{exact:false})).toBeVisible();
 await plans.getByRole('button',{name:'Ajustar para uma versão mais leve',exact:true}).click();await expect(plans.getByText('Hoje basta reparar na hora da última bebida com cafeína.',{exact:true})).toBeVisible();
 await plans.getByRole('button',{name:'Pausar',exact:true}).click();await page.clock.setSystemTime(new Date('2026-10-02T12:00:00Z'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(plans.locator('p').filter({hasText:/^Dia 2 de 15 ·/})).toBeVisible();
 await plans.getByRole('button',{name:'Continuar',exact:true}).click();await expect(plans.locator('p').filter({hasText:/^Dia 2 de 15 ·/})).toBeVisible();
 await page.screenshot({path:'/tmp/confia-plan.png',fullPage:true});
 await plans.getByRole('button',{name:'Abandonar o plano',exact:true}).click();await plans.getByRole('button',{name:'Sim, terminar esta experiência',exact:true}).click();
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('confia_habits_v1:guest')!).records);
 expect(records.find((r:any)=>r.kind==='wellbeingPlan').data).toMatchObject({status:'abandoned',pausedDays:3});expect(records.filter((r:any)=>r.kind==='planCheck')).toHaveLength(2);expect(records.filter((r:any)=>r.kind==='nutrition')).toHaveLength(14);
});
test('plans: automatic completion preserves comparison and needs enough emotional data',async({page})=>{
 await seed(page,'completed');await open(page);
 const summary=page.locator('summary').filter({hasText:/Cafeína e equilíbrio · Concluído/});await expect(summary).toBeVisible();await summary.click();
 await expect(page.getByText('Antes: 5 · Durante: 4 cafés por dia registado',{exact:true})).toBeVisible();await expect(page.getByText('Humor médio registado:',{exact:false})).toHaveCount(0);
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('confia_habits_v1:guest')!).records);expect(records.find((r:any)=>r.id==='plan_old').data.status).toBe('completed');
});
test('insufficient data: no personal association or invitation after two days',async({page})=>{
 await seed(page,'insufficient');await open(page);await expect(page.getByRole('button',{name:'Experimentar',exact:true})).toHaveCount(0);await expect(page.getByText('Há um sinal inicial.',{exact:true})).toHaveCount(0);
 await expect(page.getByText('As propostas surgem após pelo menos cinco dias',{exact:false})).toBeVisible();
});
for(const [lang,food,fruit,plans] of [['pt','Alimenta-me','Fruta','Planos de 15 dias'],['en','Nourish me','Fruit','15-day plans'],['es','Aliméntame','Fruta','Planes de 15 días'],['fr','Me nourrir','Fruits','Parcours de 15 jours']])test('four-language detail, plans and mountain: '+lang,async({page})=>{
 await page.setViewportSize({width:320,height:740});await open(page,lang);await expect(page.getByTestId('challenge-mountain')).toBeVisible();await expect(page.getByRole('heading',{name:plans,exact:true})).toBeVisible();
 await page.screenshot({path:'/tmp/confia-mountain-'+lang+'.png',fullPage:true});
 await page.getByRole('button',{name:new RegExp(food)}).click();await page.getByRole('button',{name:new RegExp(fruit)}).first().click();await expect(page.getByRole('dialog')).toBeVisible();
 expect(await page.getByRole('dialog').innerText()).not.toContain('habitHub.');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
