// ===================== CELEBRAÇÃO (1) — confetti breve depois de uma vitória =====================
// Só no Modo Modalidades, só para quem vê (não incomoda o admin a trabalhar), e só
// UMA VEZ por resultado — guarda qual foi o último celebrado, para nunca repetir.
function findLastPlayedResult_(){
  const now = new Date();
  let best = null, bestDate = null;
  EVENTS.forEach(ev=>{
    if(!ev.day) return;
    const st = getEv(ev.id);
    const tag = getMatchResultTag(ev, st);
    if(!tag) return;
    const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
    if(isNaN(d) || d > now) return;
    if(!bestDate || d > bestDate){ bestDate = d; best = { ev, tag }; }
  });
  return best;
}
function maybeCelebrateWin_(){
  if(!READONLY_MODE || currentCompMode() !== "matches") return false;
  const last = findLastPlayedResult_();
  if(!last || last.tag !== "win") return false;
  let celebrated = null;
  try{ celebrated = localStorage.getItem("dia22-last-celebrated"); }catch(e){}
  if(celebrated === last.ev.id) return false; // já celebrámos este resultado
  try{ localStorage.setItem("dia22-last-celebrated", last.ev.id); }catch(e){}
  showConfetti_();
  return true;
}
function showConfetti_(message){
  const colors = ["#e3b23c", "#4fae6f", "#eef2f8", "#93a2bd"];
  const box = document.createElement("div");
  box.style.cssText = "position:fixed; inset:0; z-index:95; pointer-events:none; overflow:hidden;";
  for(let i=0;i<36;i++){
    const p = document.createElement("div");
    const size = 6 + Math.random()*6;
    p.style.cssText = `position:absolute; top:-20px; left:${Math.random()*100}%; width:${size}px; height:${size*0.6}px;
      background:${colors[i % colors.length]}; opacity:0.9; border-radius:2px;
      transform:rotate(${Math.random()*360}deg);
      animation:confettiFall ${1.6 + Math.random()*1.2}s cubic-bezier(.25,.46,.45,.94) ${Math.random()*0.4}s forwards;`;
    box.appendChild(p);
  }
  const msg = document.createElement("div");
  msg.textContent = message || "🎉 Vitória!";
  msg.style.cssText = `position:fixed; top:18%; left:50%; transform:translateX(-50%); z-index:96;
    font-family:'Archivo Narrow',sans-serif; font-weight:800; font-size:22px; color:var(--gold);
    background:rgba(13,27,46,0.85); padding:10px 22px; border-radius:12px; border:1px solid var(--gold-dim);
    animation:celebrateFade 2.6s ease forwards; pointer-events:none; text-align:center; max-width:86vw;`;
  document.body.appendChild(box);
  document.body.appendChild(msg);
  setTimeout(()=>{ box.remove(); msg.remove(); }, 2700);
}

