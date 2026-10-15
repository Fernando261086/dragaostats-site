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

// ===================== RECORDES DA ÉPOCA — maior vitória por modalidade =====================
// Reaproveita a mesma convenção "casa - fora" já usada em parseMatchResult (ver
// 03-share-reel.js) para saber quantos golos/pontos fez o FC Porto e o adversário
// em cada jogo já com resultado escrito. Um recorde por modalidade (não mistura
// Andebol com Basquetebol — as escalas não são comparáveis). Fechado por defeito,
// como os Troféus da época.
let recordsShelfOpen = false;
function parseOursTheirs_(ev, resultado){
  if(!resultado) return null;
  const m = resultado.match(/(\d+)\s*[-–:]\s*(\d+)/);
  if(!m) return null;
  const a = parseInt(m[1],10), b = parseInt(m[2],10);
  const local = ev.local || "casa";
  return { ours: local === "casa" ? a : b, theirs: local === "casa" ? b : a };
}
function getBiggestWinBySport_(){
  const bySport = {}; // sport -> { ev, ours, theirs, diff }
  EVENTS.forEach(ev=>{
    const st = getEv(ev.id);
    const score = parseOursTheirs_(ev, st && st.resultado);
    if(!score || score.ours <= score.theirs) return; // só vitórias dão para "maior vitória"
    const diff = score.ours - score.theirs;
    const atual = bySport[ev.sport];
    if(!atual || diff > atual.diff){
      bySport[ev.sport] = { ev, ...score, diff };
    }
  });
  return bySport;
}
function renderRecordsShelf_(){
  const el = document.getElementById("recordsShelf");
  if(currentCompMode() !== "matches" || activeSport !== "Todos"){ el.style.display = "none"; return; }
  const bySport = getBiggestWinBySport_();
  const sports = Object.keys(bySport).sort();
  if(!sports.length){ el.style.display = "none"; return; }
  el.innerHTML = `<div class="form-overview-title${recordsShelfOpen ? ' open' : ''}">📈 Recordes da época <span class="fo-arrow">▾</span></div>` +
    `<div class="form-overview-chips${recordsShelfOpen ? '' : ' collapsed'}">` +
    sports.map(sport=>{
      const r = bySport[sport];
      const local = r.ev.local || "casa"; // mesma regra de 'parseOursTheirs_', para não desalinhar o placar mostrado
      const placar = local === "casa" ? `${r.ours}-${r.theirs}` : `${r.theirs}-${r.ours}`;
      return `<div class="form-overview-row" style="cursor:default;"><span class="fo-sport">🏆 Maior vitória <span style="color:var(--text-dim); font-weight:500;">(${sport})</span>: ${placar} vs ${r.ev.athlete || 'Adversário'}</span></div>`;
    }).join('') + '</div>';
  el.style.display = "flex";
  el.querySelector('.form-overview-title').onclick = ()=>{
    recordsShelfOpen = !recordsShelfOpen;
    renderRecordsShelf_();
  };
}

