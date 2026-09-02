const RAMEN={
 shoyu:{name:"Shoyu Ramen",price:150,broth:"shoyu",face:"👩"},
 miso:{name:"Miso Ramen",price:180,broth:"miso",face:"👨"},
 tonkotsu:{name:"Tonkotsu Ramen",price:220,broth:"tonkotsu",face:"🧑"},
 spicy:{name:"Spicy Ramen",price:250,broth:"spicy",face:"👩‍🦰"}
};
const NOODLES={thin:"Mie Tipis",thick:"Mie Tebal",wavy:"Mie Keriting"};
const BROTH={shoyu:"Shoyu",miso:"Miso",tonkotsu:"Tonkotsu",spicy:"Pedas"};
const TOPPINGS={egg:"Telur",nori:"Nori",chashu:"Chashu",corn:"Jagung"};

let state=JSON.parse(localStorage.getItem("ramen2Save")||"null")||{
 money:1600,day:1,rating:1,served:0,combo:0,customers:[],selected:null,
 upgrades:{kitchen:0,seats:0,quality:0,decor:0},
 achievements:[],logs:["🏮 Kedai baru dibuka! Saatnya membuat ramen terbaik di kota."]
};
let recipe={noodle:null,broth:null,topping:null,cooked:false};
let cookTimer=null,cookPos=0,cookDir=1,patienceTimer=null;

function save(){localStorage.setItem("ramen2Save",JSON.stringify(state));render()}
function log(x){state.logs.unshift(x);state.logs=state.logs.slice(0,10)}
function level(){return Math.min(10,1+Math.floor(state.served/5)+state.upgrades.decor)}
function spawn(){
 const max=Math.min(3+state.upgrades.seats,6);
 const keys=Object.keys(RAMEN);
 const names=["Aiko","Ryo","Mika","Kenji","Hana","Yuki","Sora","Emi","Daiki","Nana","Ren","Kira"];
 while(state.customers.length<max){
  const k=keys[Math.floor(Math.random()*keys.length)];
  state.customers.push({id:Date.now()+Math.random(),name:names[Math.floor(Math.random()*names.length)],ramen:k,patience:100});
 }
}
function selected(){return state.customers.find(c=>c.id===state.selected)}
function selectCustomer(id){
 stopPatience(); state.selected=id; resetRecipe(); startPatience(); render();
}
function resetRecipe(){recipe={noodle:null,broth:null,topping:null,cooked:false};stopCook()}
function startPatience(){
 stopPatience(); patienceTimer=setInterval(()=>{
  const c=selected(); if(!c)return;
  const speed=.55-(state.upgrades.kitchen*.07);
  c.patience=Math.max(0,c.patience-speed);
  if(c.patience<=0){
   log(`😤 ${c.name} pergi karena terlalu lama menunggu.`);
   state.customers=state.customers.filter(x=>x.id!==c.id);state.selected=null;state.combo=0;resetRecipe();spawn();save();
  } else render();
 },700);
}
function stopPatience(){if(patienceTimer){clearInterval(patienceTimer);patienceTimer=null}}
function choose(step){
 const options=step==="noodle"?NOODLES:step==="broth"?BROTH:TOPPINGS;
 const box=document.querySelector("#choiceBox");box.classList.remove("hidden");
 box.innerHTML=Object.entries(options).map(([k,v])=>`<button data-key="${k}">${v}</button>`).join("");
 box.querySelectorAll("button").forEach(b=>b.onclick=()=>{
   recipe[step]=b.dataset.key;box.classList.add("hidden");render();
 });
}
function startCook(){
 if(!recipe.noodle||!recipe.broth||!recipe.topping){flash("Lengkapi mie, kuah, dan topping dulu!");return}
 document.querySelector("#cookBox").classList.remove("hidden");
 document.querySelector("#serve").disabled=true;
 stopCook();cookPos=0;cookDir=1;
 cookTimer=setInterval(()=>{
  cookPos+=cookDir*(3.2+state.upgrades.kitchen*.4);
  if(cookPos>=100){cookPos=100;cookDir=-1} if(cookPos<=0){cookPos=0;cookDir=1}
  const n=document.querySelector("#heatNeedle");if(n)n.style.left=cookPos+"%";
 },40);
}
function stopCook(){
 if(cookTimer){clearInterval(cookTimer);cookTimer=null}
}
function finishCook(){
 if(!cookTimer)return;
 const good=cookPos>=30&&cookPos<=70;
 stopCook();recipe.cooked=true;
 document.querySelector("#cookBox").classList.add("hidden");
 if(good){flash("🔥 Pas! Ramen matang sempurna.");}
 else {flash("😅 Kurang pas... pelanggan tetap bisa dilayani, tapi rating bisa turun.")}
 render();
}
function expectedRecipe(){
 const c=selected();if(!c)return null;
 const r=RAMEN[c.ramen];
 return {noodle:"wavy",broth:r.broth,topping:r.ramen==="spicy"?"chashu":r.ramen==="tonkotsu"?"egg":"nori"};
}
function serve(){
 const c=selected();if(!c||!recipe.cooked)return;
 const exp=expectedRecipe();
 let score=0;
 if(recipe.broth===exp.broth)score+=1;
 if(recipe.topping===exp.topping)score+=1;
 if(recipe.noodle===exp.noodle)score+=1;
 if(c.patience>55)score+=1;
 const perfect=score>=4;
 const item=RAMEN[c.ramen];
 let reward=item.price+state.upgrades.quality*40+(perfect?70:0);
 if(score<=1)reward=Math.floor(reward*.65);
 state.money+=reward;state.served++;
 if(perfect){state.combo++;state.rating=Math.min(5,Math.round((state.rating+.07)*100)/100);log(`✨ PERFECT! ${c.name} memberi senyum lebar. +¥${reward}`)}
 else {state.combo=0;state.rating=Math.max(1,Math.round((state.rating-.02)*100)/100);log(`🍜 ${c.name} selesai makan. +¥${reward}`)}
 state.customers=state.customers.filter(x=>x.id!==c.id);state.selected=null;resetRecipe();spawn();checkAchievements();save();
}
function buy(type,base,label){
 const lv=state.upgrades[type];if(lv>=2){flash("Upgrade sudah maksimal!");return}
 const cost=base*(lv+1);
 if(state.money<cost){flash("💸 Uang belum cukup.");return}
 state.money-=cost;state.upgrades[type]++;log(`🔧 ${label} naik ke level ${state.upgrades[type]}.`);save();
}
function endDay(){
 stopPatience();stopCook();
 const bonus=Math.round(350+state.rating*120+state.served*12+state.upgrades.decor*90);
 state.money+=bonus;state.day++;state.customers=[];state.selected=null;state.combo=0;resetRecipe();
 log(`🌙 Hari selesai. Pendapatan kedai +¥${bonus}. Besok akan lebih ramai!`);
 if(state.day%3===0)log("🔥 Besok ada kemungkinan RUSH HOUR!");
 spawn();checkAchievements();save();
}
function flash(msg){document.querySelector("#result").textContent=msg;setTimeout(()=>{document.querySelector("#result").textContent=""},1800)}
function checkAchievements(){
 const tests=[
  ["first","🍜 Ramen Pertama","Layani 1 pelanggan",state.served>=1],
  ["ten","🥢 Sepuluh Mangkok","Layani 10 pelanggan",state.served>=10],
  ["perfect","✨ Chef Sempurna","Capai combo 5",state.combo>=5],
  ["star","⭐ Kedai Bintang","Rating mencapai 4.5",state.rating>=4.5],
  ["rich","💴 Juragan Ramen","Punya ¥5000",state.money>=5000],
  ["level","🏮 Kedai Legenda","Capai level 5",level()>=5]
 ];
 tests.forEach(a=>{if(a[3]&&!state.achievements.includes(a[0])){state.achievements.push(a[0]);log(`🏆 Achievement: ${a[1]}!`)}})
}
function render(){
 document.querySelector("#money").textContent=Math.floor(state.money);
 document.querySelector("#day").textContent=state.day;
 document.querySelector("#rating").textContent=state.rating.toFixed(2);
 document.querySelector("#served").textContent=state.served;
 document.querySelector("#combo").textContent=state.combo;
 document.querySelector("#level").textContent=level();
 document.querySelector("#rush").classList.toggle("hidden",!(state.day%3===0&&state.customers.length>=5));

 const list=document.querySelector("#customers");list.innerHTML="";
 state.customers.forEach(c=>{
  const d=document.createElement("div");d.className="customer"+(c.id===state.selected?" active":"");
  d.innerHTML=`<span class="face">${RAMEN[c.ramen].face}</span><strong>${c.name}</strong><small>🍜 ${RAMEN[c.ramen].name} · ¥${RAMEN[c.ramen].price}</small><div class="miniBar"><i style="width:${c.patience}%"></i></div>`;
  d.onclick=()=>selectCustomer(c.id);list.appendChild(d);
 });
 const c=selected();
 document.querySelector("#order").innerHTML=c?`<strong>${c.name}</strong> memesan <b>${RAMEN[c.ramen].name}</b><br><small>Racik sesuai pesanan lalu masak dengan timing yang tepat.</small>`:"Pilih pelanggan untuk menerima pesanan.";
 document.querySelector("#patienceLabel").textContent=c?`Kesabaran ${Math.round(c.patience)}%`:"Pilih pelanggan";
 document.querySelector("#patienceBar").style.width=c?c.patience+"%":"0%";
 document.querySelector("#serve").disabled=!(c&&recipe.cooked);

 document.querySelectorAll(".steps button").forEach(b=>{
  const s=b.dataset.step;b.classList.toggle("done",!!recipe[s]||(s==="cook"&&recipe.cooked));
  b.classList.toggle("current",s==="cook"&&!recipe.cooked);
 });
 document.querySelector("#upKitchen").innerHTML=`🔥 Kompor <small>level ${state.upgrades.kitchen} · ¥${450*(state.upgrades.kitchen+1)}</small>`;
 document.querySelector("#upSeats").innerHTML=`🪑 Kursi <small>level ${state.upgrades.seats} · ¥${650*(state.upgrades.seats+1)}</small>`;
 document.querySelector("#upQuality").innerHTML=`🥚 Bahan <small>level ${state.upgrades.quality} · ¥${850*(state.upgrades.quality+1)}</small>`;
 document.querySelector("#upDecor").innerHTML=`🏮 Dekorasi <small>level ${state.upgrades.decor} · ¥${750*(state.upgrades.decor+1)}</small>`;
 document.querySelector("#logs").innerHTML=state.logs.map(x=>`<div>${x}</div>`).join("");
 const ach=[
  ["first","🍜 Ramen Pertama","Layani 1 pelanggan"],["ten","🥢 Sepuluh Mangkok","Layani 10 pelanggan"],
  ["perfect","✨ Chef Sempurna","Capai combo 5"],["star","⭐ Kedai Bintang","Rating 4.5"],
  ["rich","💴 Juragan Ramen","Punya ¥5000"],["level","🏮 Kedai Legenda","Level 5"]
 ];
 document.querySelector("#achievements").innerHTML=ach.map(a=>`<div class="achievement ${state.achievements.includes(a[0])?"":"locked"}"><b>${a[1]}</b><small>${a[2]}</small></div>`).join("");
 document.querySelector("#seats").innerHTML="🪑".repeat(3+state.upgrades.seats)+"　🍵　"+"🪑".repeat(3+state.upgrades.seats);
}
document.querySelectorAll(".steps button").forEach(b=>b.onclick=()=>b.dataset.step==="cook"?startCook():choose(b.dataset.step));
document.querySelector("#stopCook").onclick=finishCook;
document.querySelector("#serve").onclick=serve;
document.querySelector("#upKitchen").onclick=()=>buy("kitchen",450,"Kompor");
document.querySelector("#upSeats").onclick=()=>buy("seats",650,"Kursi");
document.querySelector("#upQuality").onclick=()=>buy("quality",850,"Bahan premium");
document.querySelector("#upDecor").onclick=()=>buy("decor",750,"Dekorasi");
document.querySelector("#endDay").onclick=endDay;
document.querySelector("#reset").onclick=()=>{if(confirm("Hapus seluruh progress?")){localStorage.removeItem("ramen2Save");location.reload()}};

spawn();render();
