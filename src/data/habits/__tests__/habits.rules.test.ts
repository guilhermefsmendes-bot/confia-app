import { before,after,it } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment,assertFails,assertSucceeds,type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc,setDoc,getDoc,deleteDoc,collection,getDocs,query,orderBy,limit,serverTimestamp } from "firebase/firestore";
let env:RulesTestEnvironment;
before(async()=>{env=await initializeTestEnvironment({projectId:"demo-confia-habits",firestore:{rules:readFileSync("firestore.rules","utf8")}});});
after(async()=>env.cleanup());
const entry=(id:string,userId="alice")=>({id,userId,kind:"nutrition",date:"2026-09-28",updatedAt:"2026-09-28T10:00:00.000Z",timezone:"Europe/Lisbon",data:{coffee:2,water:0}});
const db=(uid:string)=>env.authenticatedContext(uid).firestore();
it("allows the owner to write, query and delete private habit records",async()=>{
 const d=db("alice");const ref=doc(d,"users/alice/habitRecords/n1");
 await assertSucceeds(setDoc(ref,entry("n1")));
 await assertSucceeds(getDocs(query(collection(d,"users/alice/habitRecords"),orderBy("date","desc"),limit(150))));
 await assertSucceeds(deleteDoc(ref));
});
it("rejects other users and unauthenticated access",async()=>{
 await assertSucceeds(setDoc(doc(db("alice"),"users/alice/habitRecords/n2"),entry("n2")));
 await assertFails(getDoc(doc(db("bob"),"users/alice/habitRecords/n2")));
 await assertFails(setDoc(doc(db("bob"),"users/alice/habitRecords/n2"),entry("n2","bob")));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),"users/alice/habitRecords/n2")));
});
it("rejects negative quantities, unknown keys, forged ownership and invalid exercise",async()=>{
 const ref=doc(db("alice"),"users/alice/habitRecords/n3");
 await assertFails(setDoc(ref,{...entry("n3"),data:{coffee:-1}}));
 await assertFails(setDoc(ref,{...entry("n3"),data:{diagnosis:"something"}}));
 await assertFails(setDoc(ref,entry("n3","bob")));
 await assertFails(setDoc(ref,{...entry("n3"),kind:"exercise",data:{activity:"walk",minutes:2000}}));
});
it("accepts all record kinds and rejects older overwrites",async()=>{
 const samples=[
 {id:"h",kind:"habit",data:{type:"custom",name:"My habit",icon:"🌱",goal:"A small step",active:true,createdAt:"2026-09-28T00:00:00Z"}},
 {id:"settings",kind:"settings",data:{primaryId:"h"}},
 {id:"l",kind:"habitLog",data:{habitId:"h",completed:true}},
 {id:"r",kind:"restart",data:{habitId:"h",reason:"once",bestBefore:5}},
 {id:"s",kind:"summary",data:{habitId:"h",best:5,total:5,runStart:"",runEnd:"",cycleAt:"",cycleDate:""}},
 {id:"e",kind:"exercise",data:{activity:"walk",minutes:30,intensity:"light"}}];
 for(const sample of samples)await assertSucceeds(setDoc(doc(db("alice"),"users/alice/habitRecords/"+sample.id),{...entry(sample.id),...sample}));
 await assertFails(setDoc(doc(db("alice"),"users/alice/habitRecords/e"),{...entry("e"),kind:"exercise",updatedAt:"2020-01-01T00:00:00.000Z",data:{activity:"walk",minutes:5}}));
});
it('validates detailed food items, times, properties and new plan schemas',async()=>{
 const d=db('alice'),base=entry('food');const ref=doc(d,'users/alice/habitRecords/food');
 const food={category:'coffee',subtype:'espresso',quantity:2,unit:'item',time:'17:30',period:'afternoon',deleted:false};
 await assertSucceeds(setDoc(ref,{...base,kind:'foodItem',data:food}));
 for(const patch of [{quantity:-1},{time:'25:30'},{subtype:'unknown-subtype'},{caffeine:'500mg'},{diagnosis:'no'}])await assertFails(setDoc(ref,{...base,kind:'foodItem',data:{...food,...patch}}));
 await assertSucceeds(setDoc(ref,{...base,kind:'foodItem',data:{...food,deleted:true}}));
 await assertFails(getDoc(doc(db('bob'),'users/alice/habitRecords/food')));
 const sample={mean:4,days:5,moodMean:0,moodDays:0};
 const plan={templateId:'caffeine',status:'active',startDate:'2026-09-28',endDate:'2026-10-12',pausedAt:'',pausedDays:0,gentle:false,baseline:sample};
 await assertSucceeds(setDoc(doc(d,'users/alice/habitRecords/p'),{...entry('p'),kind:'wellbeingPlan',data:plan}));
 await assertFails(setDoc(doc(d,'users/alice/habitRecords/p'),{...entry('p'),kind:'wellbeingPlan',data:{...plan,status:'prescribed'}}));
 await assertSucceeds(setDoc(doc(d,'users/alice/habitRecords/pc'),{...entry('pc'),kind:'planCheck',data:{planId:'p',day:1,outcome:'done'}}));
 await assertFails(setDoc(doc(d,'users/alice/habitRecords/pc'),{...entry('pc'),kind:'planCheck',data:{planId:'p',day:16,outcome:'done'}}));
 await assertSucceeds(setDoc(doc(d,'users/alice/habitRecords/plan_preference'),{...entry('plan_preference'),kind:'planPreference',data:{dismissedUntil:'2026-10-05'}}));
 await assertSucceeds(setDoc(doc(d,'users/alice/habitRecords/experiod'),{...entry('experiod'),kind:'exercise',data:{activity:'walk',minutes:5,period:'morning'}}));
});

it('notification tokens and preferences are private, schema-bound and owner-only',async()=>{
 const d=db('alice'),ref=doc(d,'users/alice/devices/android_one');
 const token={fcmToken:'a'.repeat(100),platform:'android',language:'pt',notificationsEnabled:true,updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(ref,token));
 await assertFails(getDoc(doc(db('bob'),'users/alice/devices/android_one')));
 await assertFails(getDocs(collection(db('bob'),'users/alice/devices')));
 await assertFails(setDoc(doc(db('bob'),'users/alice/devices/android_one'),token));
 await assertFails(setDoc(ref,{...token,privateMessage:'sensitive'}));
 await assertFails(setDoc(ref,{...token,fcmToken:'short'}));
 await assertFails(setDoc(ref,{...token,updatedAt:'yesterday'}));
 const pref=doc(d,'users/alice/preferences/notifications');
 await assertSucceeds(setDoc(pref,{community:false,milestones:false,updatedAt:serverTimestamp()}));
 await assertFails(getDoc(doc(db('bob'),'users/alice/preferences/notifications')));
 await assertFails(setDoc(doc(d,'notificationDeliveries/forged'),{status:'sent'}));
 await assertSucceeds(deleteDoc(ref));
});
