// ===================== DIA DE CLÁSSICO (4 e 7) — um pequeno selo no banner do jogo, e
// uma frase diferente no subtítulo, só nos dias em que o adversário é Sporting ou Benfica.
function isClassicoOpponent_(athlete){
  return /\b(sporting|benfica)\b/i.test(athlete || "");
}
function applyClassicoFlourish_(){
  const subEl = document.getElementById("brandSub");
  if(!subEl) return;
  if(currentCompMode() !== "matches"){ return; } // só faz sentido no Modo Modalidades
  const todays = typeof getTodaysGames_ === "function" ? getTodaysGames_() : [];
  const isClassico = todays.some(ev => isClassicoOpponent_(ev.athlete));
  if(isClassico){
    subEl.textContent = "Hoje é dia de aquecer a garganta 🔵⚪";
    subEl.dataset.classico = "1";
  }else if(subEl.dataset.classico === "1"){
    subEl.textContent = "Jogos e resultados das modalidades do FC Porto";
    delete subEl.dataset.classico;
  }
}

// ===================== TROFÉUS DA ÉPOCA (3) — detetados a partir de finais vencidas =====
// Não inventa nada: só conta o que já está na Sheet como "Final" (não "Meia-Final")
// com resultado de vitória. Fica fechado por defeito, como o Forma Recente.
let trophyShelfOpen = false;
function getSeasonTitles_(){
  const seen = new Set(); const out = [];
  EVENTS.forEach(ev=>{
    const phase = (ev.phase || "");
    if(!/\bfinal\b/i.test(phase) || /meia/i.test(phase)) return;
    const tag = getMatchResultTag(ev, getEv(ev.id));
    if(tag !== "win") return;
    const key = (ev.detail || phase) + "|" + ev.sport;
    if(seen.has(key)) return;
    seen.add(key);
    out.push({ title: ev.detail || "Título", sport: ev.sport });
  });
  return out;
}
function renderTrophyShelf_(){
  const el = document.getElementById("trophyShelf");
  if(currentCompMode() !== "matches" || activeSport !== "Todos"){ el.style.display = "none"; return; }
  const titles = getSeasonTitles_();
  if(!titles.length){ el.style.display = "none"; return; }
  el.innerHTML = `<div class="form-overview-title${trophyShelfOpen ? ' open' : ''}">🏆 Troféus desta época (${titles.length}) <span class="fo-arrow">▾</span></div>` +
    `<div class="form-overview-chips${trophyShelfOpen ? '' : ' collapsed'}">` +
    titles.map(t=>`<div class="form-overview-row" style="cursor:default;"><span class="fo-sport">🏆 ${t.title} <span style="color:var(--text-dim); font-weight:500;">(${t.sport})</span></span></div>`).join('') +
    '</div>';
  el.style.display = "flex";
  el.querySelector('.form-overview-title').onclick = ()=>{
    trophyShelfOpen = !trophyShelfOpen;
    renderTrophyShelf_();
  };
}

