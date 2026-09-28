// ===== Kit do Dia — tudo em localStorage =====
const $ = id => document.getElementById(id);
const store = {
  get:(k,f)=>{ try{const v=JSON.parse(localStorage.getItem(k));return v??f;}catch{return f;} },
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};

// ---------- Pomodoro ----------
let secs = 25*60, total = 25*60, tick = null, cycle = 1, resting = false;
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
function paint(){ $("timer").textContent = fmt(secs); document.title = fmt(secs)+" • Kit do Dia"; }
function beep(n=3){ try{
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  [...Array(n)].forEach((_,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);o.frequency.value=880;
    o.start(ctx.currentTime+i*0.35);o.stop(ctx.currentTime+i*0.35+0.25); });
}catch{} }
function setMode(m){ clearInterval(tick); tick=null; secs=m*60; total=m*60;
  resting = m!==25; $("phase").textContent = resting?"Pausa — respira, bebe água 💧":"Pronto para focar?";
  $("startBtn").textContent="▶ Começar"; paint();
  document.querySelectorAll("#pomodoro .chip").forEach(c=>c.classList.toggle("active",+c.dataset.m===m)); }
document.querySelectorAll("#pomodoro .chip").forEach(c=>c.onclick=()=>setMode(+c.dataset.m));
$("startBtn").onclick = ()=>{
  if(tick){ clearInterval(tick); tick=null; $("startBtn").textContent="▶ Continuar"; return; }
  $("phase").textContent = resting?"Em pausa…":"Focando… não mexe no celular 📵";
  $("startBtn").textContent="⏸ Pausar";
  tick = setInterval(()=>{ secs--; paint();
    if(secs<=0){ clearInterval(tick); tick=null; beep();
      if(!resting){ const d=store.get("kit-done",0)+1; store.set("kit-done",d); $("doneCount").textContent=d;
        if(cycle>=4){ cycle=1; setMode(15); $("phase").textContent="4 ciclos! Pausa longa merecida 🏆"; }
        else { cycle++; setMode(5); }
        $("cycleInfo").textContent=`ciclo ${cycle} de 4`;
      } else setMode(25);
    } },1000);
};
$("resetBtn").onclick = ()=>{ setMode(resting?5:25); };
$("doneCount").textContent = store.get("kit-done",0);
paint();

// ---------- Tarefas ----------
let filter = "all";
const render = ()=>{
  const tasks = store.get("kit-tasks",[]);
  const open = tasks.filter(t=>!t.done).length;
  $("taskCount").textContent = `${open} pendente${open===1?"":"s"}`;
  const list = tasks.filter(t=>filter==="all"||(filter==="done")===t.done);
  $("taskList").innerHTML = list.length ? list.map(t=>
    `<li class="${t.done?"done":""}"><input type="checkbox" data-id="${t.id}" ${t.done?"checked":""}>
     <span>${t.text.replace(/</g,"&lt;")}</span><button class="del" data-id="${t.id}">✖</button></li>`).join("")
    : `<li style="justify-content:center;color:var(--mut)">Nada por aqui. Que tal adicionar a primeira? ✨</li>`;
};
function addTask(){ const v=$("taskIn").value.trim(); if(!v) return;
  const tasks=store.get("kit-tasks",[]); tasks.unshift({id:Date.now(),text:v,done:false});
  store.set("kit-tasks",tasks); $("taskIn").value=""; render(); }
$("taskAdd").onclick = addTask;
$("taskIn").addEventListener("keydown",e=>{ if(e.key==="Enter") addTask(); });
$("taskList").addEventListener("click",e=>{
  const tasks=store.get("kit-tasks",[]); const id=+e.target.dataset.id; if(!id) return;
  if(e.target.classList.contains("del")) store.set("kit-tasks",tasks.filter(t=>t.id!==id));
  render();
});
$("taskList").addEventListener("change",e=>{
  const tasks=store.get("kit-tasks",[]); const t=tasks.find(t=>t.id===+e.target.dataset.id);
  if(t){ t.done=e.target.checked; store.set("kit-tasks",tasks); render(); }
});
document.querySelectorAll("#filters .chip").forEach(c=>c.onclick=()=>{
  filter=c.dataset.f;
  document.querySelectorAll("#filters .chip").forEach(x=>x.classList.toggle("active",x===c)); render(); });
render();

// ---------- Conversores ----------
const br = v => v.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
$("brl").oninput = e => { const r=+$("usdRate").value||1;
  $("brlOut").textContent = "= US$ "+br((+e.target.value||0)/r); };
$("usdRate").oninput = ()=>$("brl").dispatchEvent(new Event("input"));
$("celsius").oninput = e => { const c=+e.target.value||0;
  $("tempOut").textContent = `= ${br(c*9/5+32)} °F · ${br(c+273.15)} K`; };
$("km").oninput = e => { $("kmOut").textContent = `= ${br((+e.target.value||0)*0.621371)} mi`; };
$("kg").oninput = e => { $("kgOut").textContent = `= ${br((+e.target.value||0)*2.20462)} lb`; };

// ---------- Notas ----------
$("notes").value = store.get("kit-notes","");
$("notes").addEventListener("input",e=>store.set("kit-notes",e.target.value));
$("dlNotes").onclick = ()=>{
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([$("notes").value],{type:"text/plain"}));
  a.download="minhas-notas.txt"; a.click(); URL.revokeObjectURL(a.href);
};
$("clearNotes").onclick = ()=>{ if(confirm("Apagar todas as notas?")){ $("notes").value=""; store.set("kit-notes",""); } };
