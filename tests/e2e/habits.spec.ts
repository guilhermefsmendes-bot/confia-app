import { test,expect,type Page } from "@playwright/test";
async function openHabits(page:Page,lang="pt",label="Hábitos") {
  await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,route=>route.abort());
  await page.addInitScript(l=>localStorage.setItem("confia_language",l),lang);
  await page.goto("/");
  await page.getByTestId("challenge-clock").waitFor();
  await expect(page.getByTestId("challenge-clock")).toBeVisible();
}
test("habits: create, confirm, restart, retain history and switch main habit",async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await openHabits(page);
 await page.getByText("O meu dia: análises e planos",{exact:true}).click();
  await expect(page.getByText("Espaço Efémero",{exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Escolher um hábito",exact:true}).click();
  await page.getByRole("button",{name:"☕ Café em excesso",exact:true}).click();
  await page.getByLabel("O que gostavas de fazer diferente?").fill("Até dois cafés");
  await page.getByRole("button",{name:"Criar desafio",exact:true}).click();
  await expect(page.getByText("DIA 0",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Registar",exact:true}).click();
  await page.getByRole("button",{name:"Cumpri o meu objetivo",exact:true}).click();
  await expect(page.getByText("DIA 1",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Recomeçar ciclo",exact:true}).click();
  await page.getByRole("button",{name:"Aconteceu uma vez",exact:true}).click();
  await expect(page.getByText("DIA 0",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Ver histórico",exact:true}).click();
  await expect(page.getByText("Cumprido",{exact:true})).toBeVisible();
  await expect(page.locator("dl").getByText("1",{exact:true})).toHaveCount(3);
  await page.getByRole("button",{name:/Voltar/}).click();
  await page.getByRole("button",{name:"Mudar hábito",exact:true}).click();
  await page.getByRole("button",{name:"Outro hábito",exact:false}).click();
  await page.getByLabel("Nome do hábito").fill("Pausas");
  await page.getByLabel("O que gostavas de fazer diferente?").fill("Fazer uma pausa");
  await page.getByRole("button",{name:"Criar desafio",exact:true}).click();
  await page.getByRole("button",{name:"Mudar hábito",exact:true}).click();
  await page.getByRole("button",{name:"🌱 Pausas",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Pausas",exact:true})).toBeVisible();
  await page.reload();
  await page.getByTestId("challenge-clock").waitFor();
  await expect(page.getByRole("heading",{name:"Pausas",exact:true})).toBeVisible();
  await page.screenshot({path:"/tmp/confia-habits-dashboard.png",fullPage:true});
  expect(errors).toEqual([]);
});
test("habits: food, movement, explicit zero, offline durability",async({page,context})=>{
  await openHabits(page);
 await page.getByText("O meu dia: análises e planos",{exact:true}).click();
  await page.getByRole("button",{name:/Alimenta-me/}).click();
  await page.getByRole("button",{name:/Café Adicionar/}).click();
  await page.getByLabel("Quantidade exata").fill("3");
  await page.getByRole("button",{name:"Guardar alimento ou bebida",exact:true}).click();
  await page.getByRole("button",{name:/Água Adicionar/}).click();
  await page.getByLabel("Quantidade exata").fill("6");
  await page.getByRole("button",{name:"Guardar alimento ou bebida",exact:true}).click();
  await context.setOffline(true);
  await page.getByRole("button",{name:"Concluir e ver o meu dia",exact:true}).click();
  await expect(page.getByText("Hoje: 2 categorias registadas.",{exact:true})).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("button",{name:/Exercício/}).click();
  await page.getByRole("button",{name:"30 min",exact:true}).click();
  await page.getByRole("button",{name:"Guardar registo",exact:true}).click();
  await expect(page.getByText("30 min",{exact:true}).first()).toBeVisible();
  await page.reload();await page.getByTestId("challenge-clock").waitFor();
  await expect(page.getByText("Hoje: 2 categorias registadas.",{exact:true})).toBeVisible();
  await expect(page.getByText("30 min",{exact:true}).first()).toBeVisible();
  await page.getByText("O meu dia: análises e planos",{exact:true}).click();
  await expect(page.getByText("A CONFIA precisa de conhecer um pouco mais", {exact:false})).toBeVisible();
});
for(const [lang,label,choose,nutrition,exercise] of [
 ["en","Habits","Choose a habit","Nourish me","Exercise"],
 ["es","Hábitos","Elegir un hábito","Aliméntame","Ejercicio"],
 ["fr","Habitudes","Choisir une habitude","Me nourrir","Activité physique"],
])test("habits: complete "+lang+" surface and mobile fit",async({page})=>{
  await openHabits(page,lang,label);
  await expect(page.getByRole("button",{name:choose,exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:nutrition,exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:exercise,exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  expect(await page.locator("main").innerText()).not.toContain("habitHub.");
});

test("habits: populated weekly reviews, evidence and 30-day trophy",async({page})=>{
 await page.clock.install({time:new Date("2026-09-24T12:00:00Z")});
 await page.addInitScript(()=>{
  const fmt=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
  const day=(n:number)=>{const d=new Date();d.setDate(d.getDate()+n);return fmt(d);};
  const stamp=(d:string)=>d+"T10:00:00.000Z";
  const record=(id:string,kind:string,date:string,data:object)=>({id,kind,date,updatedAt:stamp(date),timezone:"UTC",data});
  const records:any[]=[record("habit_seed","habit",day(-40),{type:"tobacco",name:"",icon:"🚬",goal:"O meu objetivo",active:true,createdAt:stamp(day(-40))}),record("settings","settings",day(-40),{primaryId:"habit_seed"})];
  const events:any[]=[];
  for(let n=0;n<30;n++)records.push(record("log_"+n,"habitLog",day(-n),{habitId:"habit_seed",completed:true}));
  for(let n=0;n<14;n++){
   records.push(record("nutrition_"+n,"nutrition",day(-n),{coffee:n%2?3:0,water:5,fruit:1}));
   records.push(record("exercise_"+n,"exercise",day(-n),{activity:"walk",minutes:n%2?20:0}));
   events.push({id:"mood_"+n,type:"mood",source:"daily_rating",timestamp:stamp(day(-n)),localDate:day(-n),schemaVersion:1,value:n%2?7:3,metadata:{moment:"morning"}});
  }
  localStorage.setItem("confia_habits_v1:guest",JSON.stringify({version:1,records,pending:{}}));
  localStorage.setItem("confia_personal_events_v1",JSON.stringify(events));
 });
 await openHabits(page);
 await page.getByText("O meu dia: análises e planos",{exact:true}).click();
 await expect(page.getByText("DIA 30",{exact:true})).toBeVisible();
 await expect(page.getByText("30 dias e um caminho que continua.",{exact:false})).toBeVisible();
 await expect(page.getByRole("heading",{name:"O que a CONFIA está a perceber",exact:true})).toBeVisible();
 await page.getByRole("button",{name:/Alimenta-me/}).click();
 await expect(page.getByText("Média:",{exact:false}).first()).toBeVisible();
 await page.getByRole("button",{name:/Voltar/}).click();
 await page.getByRole("button",{name:/Exercício/}).click();
 await expect(page.getByText("2 dias com movimento registado",{exact:true})).toBeVisible();
 await expect(page.getByText("40 min",{exact:true})).toBeVisible();
});
