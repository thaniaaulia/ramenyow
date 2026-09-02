const RAMEN={
 shoyu:{name:"Shoyu Ramen",price:150},
 miso:{name:"Miso Ramen",price:180},
 tonkotsu:{name:"Tonkotsu Ramen",price:220},
 spicy:{name:"Spicy Ramen",price:250}
};

const names=["Aiko","Ryo","Mika","Kenji","Hana","Yuki","Sora","Emi","Daiki","Nana"];

let state=JSON.parse(localStorage.getItem("ramenSave")||"null")||{
 money:1300,rep:1,day:1,served:0,customers:[],selected:null,
 upgrades:{kitchen:0,seat:0,quality:0},
 logs:["🍜 Selamat datang! Kedai ramen-mu resmi dibuka."]
};

function save(){localStorage.setItem("ramenSave",JSON.stringify(state));render()}
function addLog(text){state.logs.unshift(text);state.logs=state.logs.slice(0,9)}
function pickRamen(){
 const keys=Object.keys(RAMEN);
 let key=keys[Math.floor(Math.random()*keys.length)];
 if(state.upgrades.quality>0 && Math.random()<0.25) key="tonkotsu";
 if(state.upgrades.quality>1 && Math.random()<0.2) key="spicy";
 return key;
}
function spawn(){
 const max=Math.min(3+state.upgrades.seat,5);
 while(state.customers.length<max){
   const ramen=pickRamen();
   state.customers.push({
     id:Date.now()+Math.random(),
     name:names[Math.floor(Math.random()*names.length)],
     ramen
   });
 }
}
function selectCustomer(id){
 state.selected=id;
 render();
}
function serve(){
 const c=state.customers.find(x=>x.id===state.selected);
 if(!c)return;
 const item=RAMEN[c.ramen];
 const bonus=state.upgrades.quality*35;
 const reward=item.price+bonus;
 state.money+=reward;
 state.served++;
 state.rep=Math.min(5,Math.round((state.rep+0.04)*100)/100);
 addLog(`🍜 ${c.name} menikmati ${item.name}! +¥${reward}`);
 state.customers=state.customers.filter(x=>x.id!==c.id);
 state.selected=null;
 spawn();
 save();
}
function buyUpgrade(type,base,label){
 const level=state.upgrades[type];
 if(level>=2){addLog("✨ Upgrade itu sudah maksimal.");save();return}
 const cost=base*(level+1);
 if(state.money<cost){addLog("💸 Uangmu belum cukup.");save();return}
 state.money-=cost;
 state.upgrades[type]++;
 addLog(`🔧 ${label} naik ke level ${state.upgrades[type]}!`);
 save();
}
function nextDay(){
 state.day++;
 const income=Math.round(250+state.rep*100+state.upgrades.kitchen*80);
 state.money+=income;
 state.customers=[];
 state.selected=null;
 addLog(`🌙 Hari ${state.day-1} selesai. Pendapatan harian +¥${income}.`);
 spawn();
 save();
}
function render(){
 document.querySelector("#money").textContent=Math.floor(state.money);
 document.querySelector("#rep").textContent=state.rep.toFixed(2);
 document.querySelector("#day").textContent=state.day;
 document.querySelector("#served").textContent=state.served;

 const list=document.querySelector("#customerList");
 list.innerHTML="";
 state.customers.forEach(c=>{
   const el=document.createElement("div");
   el.className="customer"+(c.id===state.selected?" active":"");
   el.innerHTML=`<strong>👤 ${c.name}</strong><small>Minta: ${RAMEN[c.ramen].name} · ¥${RAMEN[c.ramen].price}</small>`;
   el.onclick=()=>selectCustomer(c.id);
   list.appendChild(el);
 });

 const selected=state.customers.find(x=>x.id===state.selected);
 document.querySelector("#orderText").textContent=
   selected?`${selected.name} memesan ${RAMEN[selected.ramen].name}!`: "Pilih pelanggan untuk melihat pesanannya.";
 document.querySelector("#serveBtn").disabled=!selected;

 document.querySelector("#kitchenBtn").textContent=`🔥 Kompor lebih cepat — ¥${450*(state.upgrades.kitchen+1)} (${state.upgrades.kitchen}/2)`;
 document.querySelector("#seatBtn").textContent=`🪑 Tambah kursi — ¥${700*(state.upgrades.seat+1)} (${state.upgrades.seat}/2)`;
 document.querySelector("#qualityBtn").textContent=`🥚 Bahan premium — ¥${900*(state.upgrades.quality+1)} (${state.upgrades.quality}/2)`;

 document.querySelector("#log").innerHTML=state.logs.map(x=>`<div>${x}</div>`).join("");
}

document.querySelector("#serveBtn").onclick=serve;
document.querySelector("#kitchenBtn").onclick=()=>buyUpgrade("kitchen",450,"Kompor");
document.querySelector("#seatBtn").onclick=()=>buyUpgrade("seat",700,"Kursi");
document.querySelector("#qualityBtn").onclick=()=>buyUpgrade("quality",900,"Bahan premium");
document.querySelector("#dayBtn").onclick=nextDay;
document.querySelector("#resetBtn").onclick=()=>{
 if(confirm("Hapus semua progress Ramen Shop Simulator?")){
   localStorage.removeItem("ramenSave");
   location.reload();
 }
};

document.querySelectorAll("[data-ramen]").forEach(btn=>{
 btn.onclick=()=>{
   const item=RAMEN[btn.dataset.ramen];
   addLog(`👀 Kamu memilih ${item.name}. Ingat, sajikan sesuai pesanan pelanggan!`);
   save();
 };
});

spawn();
render();
