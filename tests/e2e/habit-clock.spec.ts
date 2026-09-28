import { test,expect,type Page } from "@playwright/test";
async function prepare(page:Page,days=0,lang="pt") {
  await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
  await page.addInitScript(({days,lang})=>{
    localStorage.setItem("confia_language",lang);
    if(!days)return;
    const fmt=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
    const today=fmt(new Date());
    const shift=(n:number)=>{const d=new Date();d.setDate(d.getDate()+n);return fmt(d);};
    const stamp=(date:string)=>date+"T12:00:00.000Z";
    const base=(id:string,kind:string,date:string,data:object)=>({id,kind,date,updatedAt:stamp(date),timezone:"UTC",data});
    const records=[
      base("clock_habit","habit",shift(-days-2),{type:"tobacco",name:"",icon:"🚬",goal:"O meu objetivo",active:true,createdAt:stamp(shift(-days-2))}),
      base("settings","settings",today,{primaryId:"clock_habit"}),
      base("today","habitLog",today,{habitId:"clock_habit",completed:true}),
      base("yesterday","habitLog",shift(-1),{habitId:"clock_habit",completed:true}),
      base("summary","summary",today,{habitId:"clock_habit",best:days,total:days,runStart:shift(1-days),runEnd:today,cycleAt:"",cycleDate:""}),
    ];
    localStorage.setItem("confia_habits_v1:guest",JSON.stringify({version:1,records,pending:{}}));
  },{days,lang});
  await page.goto("/");
  await page.getByTestId("challenge-clock").waitFor();
  await expect(page.getByTestId("challenge-clock")).toBeVisible();
}
test("clock: circular invitation at 320px, accessible action and reduced motion",async({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.emulateMedia({reducedMotion:"reduce"});
  await prepare(page);
  const circle=await page.getByTestId("challenge-clock").boundingBox();
  expect(Math.abs(circle!.width-circle!.height)).toBeLessThan(1);
  expect(circle!.x).toBeGreaterThanOrEqual(0);
  expect(circle!.x+circle!.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await page.getByTestId("challenge-clock").evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
  await expect(page.getByText("Há alguma coisa que gostavas de fazer um pouco diferente?",{exact:true})).toBeVisible();
  await page.screenshot({path:"/tmp/confia-clock-empty.png",fullPage:true});
  await page.getByRole("button",{name:"Escolher um hábito",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Os meus hábitos",exact:true})).toBeVisible();
});
test("clock: 105 days fit, trophy, translated labels and keyboard actions",async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await prepare(page,105,"en");
  await expect(page.getByLabel("DAY 105",{exact:true})).toBeVisible();
  await expect(page.getByRole("timer")).toHaveAttribute("aria-label",/Day 105 of your challenge/);
  await expect(page.getByRole("img",{name:/30 days/})).toBeVisible();
  const circle=await page.getByTestId("challenge-clock").boundingBox();
  const number=await page.locator(".challenge-clock-number").boundingBox();
  expect(number!.x).toBeGreaterThan(circle!.x);expect(number!.x+number!.width).toBeLessThan(circle!.x+circle!.width);
  await page.evaluate(()=>document.documentElement.style.fontSize="20px");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const enlarged=await page.locator(".challenge-clock-content").boundingBox();
  const enlargedCircle=await page.getByTestId("challenge-clock").boundingBox();
  expect(enlarged!.y).toBeGreaterThanOrEqual(enlargedCircle!.y);
  expect(enlarged!.y+enlarged!.height).toBeLessThanOrEqual(enlargedCircle!.y+enlargedCircle!.height);
  await page.evaluate(()=>document.documentElement.style.fontSize="");
  await page.screenshot({path:"/tmp/confia-clock-active.png",fullPage:true});
  await page.getByRole("button",{name:"View history",exact:true}).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading",{name:"My journey",exact:true})).toBeVisible();
});
test("clock: midnight recalculates locally and preserves days and history",async({page})=>{
  await page.clock.install({time:new Date("2026-09-28T23:59:45Z")});
  await prepare(page,7);
  await page.clock.pauseAt(new Date("2026-09-28T23:59:58Z"));
  const before=await page.evaluate(()=>localStorage.getItem("confia_habits_v1:guest"));
  await expect(page.getByTestId("challenge-countdown")).toHaveText("00:00:02");
  expect(Number(await page.getByTestId("challenge-day-ring").getAttribute("stroke-dashoffset"))).toBeLessThan(.01);
  await page.clock.runFor(2100);
  await expect(page.getByTestId("challenge-countdown")).toHaveText("24:00:00");
  expect(Number(await page.getByTestId("challenge-day-ring").getAttribute("stroke-dashoffset"))).toBeGreaterThan(99.99);
  await expect(page.getByLabel("DIA 7",{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem("confia_habits_v1:guest"))).toBe(before);
  await page.clock.setSystemTime(new Date("2026-09-29T08:30:00Z"));
  await page.evaluate(()=>window.dispatchEvent(new Event("pageshow")));
  await expect(page.getByTestId("challenge-countdown")).toHaveText("15:30:00");
});
test("clock: ticks do not rerender dashboard/card or write data",async({page})=>{
  await page.addInitScript(()=>{
    const previous=new Map<string,unknown>();const changes={dashboard:0,card:0,app:0,voice:0};
    const hook={
      supportsFiber:true,inject:()=>1,onCommitFiberUnmount:()=>{},
      onCommitFiberRoot:(_id:number,root:any)=>{
        const visit=(node:any)=>{
          if(!node)return;
          if(typeof node.type==="function"){
            const p=node.memoizedProps;
            const name=p?.records && p?.onOpen?"card":p?.onAddXp && "openSupport" in p?"dashboard":p?.input&&p?.onEmotion?"voice":node.child?.type==="div"&&String(node.child?.memoizedProps?.className).startsWith("confia-app ")?"app":undefined;
            if(name){if(previous.has(name) && previous.get(name)!==node.memoizedState)changes[name]++;previous.set(name,node.memoizedState);}
          }
          visit(node.child);visit(node.sibling);
        };visit(root.current);
      },
    };
    Object.assign(window,{__REACT_DEVTOOLS_GLOBAL_HOOK__:hook,__clockChanges:changes,__clockTracked:()=>previous.size});
  });
  await page.clock.install({time:new Date("2026-09-28T12:00:00Z")});
  await prepare(page,7);
  await page.clock.pauseAt(new Date("2026-09-28T12:00:10Z"));
  expect(await page.evaluate(()=>(window as any).__clockTracked())).toBe(4);
  const snapshot=await page.evaluate(()=>({changes:{...(window as any).__clockChanges},storage:JSON.stringify({...localStorage})}));
  const time=await page.getByTestId("challenge-countdown").textContent();
  await page.clock.runFor(4000);
  expect(await page.getByTestId("challenge-countdown").textContent()).not.toBe(time);
  expect(await page.evaluate(()=>(window as any).__clockChanges)).toEqual(snapshot.changes);
  expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(snapshot.storage);
});
