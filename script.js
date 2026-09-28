// ===== Kit do Dia PRO =====
const $ = id => document.getElementById(id);
const store = {
  get:(k,f)=>{ try{const v=JSON.parse(localStorage.getItem(k));return v??f;}catch{return f;} },
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};
const todayKey = () => new Date().toISOString().slice(0,10);
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2200);
}

// ---------- Saudação + sequência ----------
(function(){
  const h = new Date().getHours();
  $("greet").textContent = h < 12 ? "☀️ Bom dia!" : h < 18 ? "🌤️ Boa tarde!" : "🌙 Boa noite!";
  $("todayLine").textContent = new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
  $("streakTop").textContent = streak();
})();
function dayActivity(){ return store.get("kit-days",{}); }
function touchDay(focusMin=0, tasks=0){
  const d = dayActivity(), k = todayKey();
  d[k] = d[k] || {focus:0, tasks:0};
  d[k].focus += focusMin; d[k].tasks += tasks;
  store.set("kit-days", d);
}
function streak(){
  const d = dayActivity(); let s = 0; const dt = new Date();
  if (!d[todayKey()] || (!d[todayKey()].focus && !d[todayKey()].tasks)) dt.setDate(dt.getDate()-1);
  while(true){ const k = dt.toISOString().slice(0,10);
    if (d[k] && (d[k].focus || d[k].tasks)) { s++; dt.setDate(dt.getDate()-1); } else break; }
  return s;
}

// ---------- Pomodoro ----------
const cfg = () => ({
  focus:(+$("setFocus").value||25), short:(+$("setShort").value||5), long:(+$("setLong").value||15),
  auto:$("setAuto").checked, sound:$("setSound").checked, notif:$("setNotif").checked
});
let secs = 25*60, mode = "focus", tick = null, cycle = 1;
const MODES = {focus:"Foco", short:"Pausa curta", long:"Pausa longa"};
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
function paint(){ $("timer").textContent = fmt(secs); document.title = fmt(secs)+" • Kit do Dia"; }
function beep(){ if(!cfg().sound) return; try{
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  [0,1,2].forEach(i=>{ const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);o.frequency.value=880;
    o.start(ctx.currentTime+i*0.35);o.stop(ctx.currentTime+i*0.35+0.25); });
}catch{} }
function notify(msg){
  if(!cfg().notif) return;
  if(Notification.permission==="granted") new Notification("Kit do Dia",{body:msg});
  else if(Notification.permission!=="denied") Notification.requestPermission();
}
function setMode(m){ clearInterval(tick); tick=null; mode=m;
  secs = (m==="focus"?cfg().focus:m==="short"?cfg().short:cfg().long)*60;
  $("phase").textContent = m==="focus"?"Pronto para focar?":"Pausa — respira, bebe água 💧";
  $("startBtn").textContent="▶ Começar"; paint();
  document.querySelectorAll("#pomodoro .chip").forEach(c=>c.classList.toggle("active",c.dataset.m===m)); }
document.querySelectorAll("#pomodoro .chip").forEach(c=>c.onclick=()=>setMode(c.dataset.m));
["setFocus","setShort","setLong"].forEach(id=>$(id).addEventListener("change",()=>setMode(mode)));
$("setNotif").addEventListener("change",e=>{ if(e.target.checked) Notification.requestPermission(); });
$("startBtn").onclick = ()=>{
  if(tick){ clearInterval(tick); tick=null; $("startBtn").textContent="▶ Continuar"; return; }
  $("phase").textContent = mode==="focus"?"Focando… não mexe no celular 📵":"Em pausa…";
  $("startBtn").textContent="⏸ Pausar";
  tick = setInterval(()=>{ secs--; paint();
    if(secs>0) return;
    clearInterval(tick); tick=null; beep();
    if(mode==="focus"){
      const mins = cfg().focus;
      touchDay(mins,0);
      const n = store.get("kit-done",0)+1; store.set("kit-done",n);
      notify("Foco concluído! Hora da pausa 🎉");
      if(cycle>=4){ cycle=1; toast("4 ciclos! Pausa longa 🏆"); setMode("long"); }
      else { cycle++; setMode("short"); }
      $("cycleInfo").textContent=`ciclo ${cycle} de 4`;
      refreshStats();
    } else {
      notify("Pausa acabou. Bora focar? 🍅");
      if(cfg().auto){ setMode("focus"); $("startBtn").click(); } else setMode("focus");
    }
  },1000);
};
$("resetBtn").onclick = ()=>setMode(mode);
function refreshStats(){
  const d = dayActivity()[todayKey()] || {focus:0,tasks:0};
  $("focusToday").textContent = `${d.focus}min`;
  $("doneCount").textContent = store.get("kit-done",0);
  const s = streak(); $("streak").textContent = `${s} 🔥`; $("streakTop").textContent = s;
}
refreshStats(); setMode("focus");

// ---------- Tarefas ----------
let filter = "all";
const PRIO = {2:"🔴",1:"🟡",0:"🟢"};
const render = ()=>{
  const q = ($("taskSearch").value||"").toLowerCase();
  const tasks = store.get("kit-tasks",[]);
  const open = tasks.filter(t=>!t.done).length;
  $("taskCount").textContent = `${open} pendente${open===1?"":"s"}`;
  const list = tasks
    .filter(t=>filter==="all"||(filter==="done")===t.done)
    .filter(t=>!q||t.text.toLowerCase().includes(q))
    .sort((a,b)=>(a.done-b.done)||(b.prio-a.prio));
  $("taskList").innerHTML = list.length ? list.map(t=>
    `<li class="${t.done?"done":""}"><input type="checkbox" data-id="${t.id}" ${t.done?"checked":""}>
     <span class="prio">${PRIO[t.prio]??"🟡"}</span><span>${t.text.replace(/</g,"&lt;")}</span>
     <button class="del" data-id="${t.id}">✖</button></li>`).join("")
    : `<li style="justify-content:center;color:var(--mut)">Nada por aqui ✨</li>`;
};
function addTask(){ const v=$("taskIn").value.trim(); if(!v) return;
  const tasks=store.get("kit-tasks",[]);
  tasks.unshift({id:Date.now(),text:v,done:false,prio:+$("taskPrio").value});
  store.set("kit-tasks",tasks); $("taskIn").value=""; touchDay(0,1); refreshStats(); render(); toast("Tarefa adicionada!"); }
$("taskAdd").onclick = addTask;
$("taskIn").addEventListener("keydown",e=>{ if(e.key==="Enter") addTask(); });
$("taskSearch").addEventListener("input",render);
$("clearDone").onclick = ()=>{
  const tasks=store.get("kit-tasks",[]); const n=tasks.filter(t=>t.done).length;
  store.set("kit-tasks",tasks.filter(t=>!t.done)); render(); toast(`${n} concluída(s) removida(s) 🧹`); };
$("taskList").addEventListener("click",e=>{
  const id=+e.target.dataset.id; if(!id) return;
  const tasks=store.get("kit-tasks",[]);
  if(e.target.classList.contains("del")) store.set("kit-tasks",tasks.filter(t=>t.id!==id));
  render();
});
$("taskList").addEventListener("change",e=>{
  const tasks=store.get("kit-tasks",[]); const t=tasks.find(t=>t.id===+e.target.dataset.id);
  if(t){ t.done=e.target.checked; store.set("kit-tasks",tasks); render(); if(t.done) toast("Boa! +1 feita ✅"); }
});
document.querySelectorAll("#filters .chip").forEach(c=>c.onclick=()=>{
  filter=c.dataset.f;
  document.querySelectorAll("#filters .chip").forEach(x=>x.classList.toggle("active",x===c)); render(); });
render();

// ---------- Conversores ----------
const br = v => v.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
function convMoney(){ const rU=+$("usdRate").value||1, rE=+$("eurRate").value||1, v=+$("brl").value||0;
  $("brlOut").textContent = `= US$ ${br(v/rU)} · € ${br(v/rE)}`; }
$("brl").oninput = convMoney; $("usdRate").oninput = convMoney; $("eurRate").oninput = convMoney;
$("rateBtn").onclick = async ()=>{
  $("rateNote").textContent = "Buscando cotação…";
  try{
    const r = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL");
    const j = await r.json();
    $("usdRate").value = (+j.USDBRL.bid).toFixed(2);
    $("eurRate").value = (+j.EURBRL.bid).toFixed(2);
    convMoney();
    $("rateNote").textContent = "Cotação online de hoje ✔ (fonte: AwesomeAPI)";
    toast("Cotação atualizada!");
  }catch{ $("rateNote").textContent = "⚠️ Sem internet — mantida a cotação manual."; }
};
$("celsius").oninput = e => { const c=+e.target.value||0;
  $("tempOut").textContent = `= ${br(c*9/5+32)} °F · ${br(c+273.15)} K`; };
$("km").oninput = e => { $("kmOut").textContent = `= ${br((+e.target.value||0)*0.621371)} mi`; };
$("kg").oninput = e => { $("kgOut").textContent = `= ${br((+e.target.value||0)*2.20462)} lb`; };
convMoney();

// ---------- Notas ----------
function paintNotes(){ const v=$("notes").value;
  const w = v.trim()? v.trim().split(/\s+/).length : 0;
  $("wordCount").textContent = `${w} palavra${w===1?"":"s"} · ${v.length} caracteres`; }
$("notes").value = store.get("kit-notes",""); paintNotes();
$("notes").addEventListener("input",e=>{
  store.set("kit-notes",e.target.value); paintNotes();
  $("saveState").textContent = "salvo ✓ " + new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
});
$("dlNotes").onclick = ()=>{
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([$("notes").value],{type:"text/plain"}));
  a.download="minhas-notas.txt"; a.click(); URL.revokeObjectURL(a.href); toast("Notas baixadas!");
};
$("clearNotes").onclick = ()=>{ if(confirm("Apagar todas as notas?")){ $("notes").value=""; store.set("kit-notes",""); paintNotes(); } };
