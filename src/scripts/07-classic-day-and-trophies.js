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

// Brilho no emblema em QUALQUER dia de jogo (não só clássico) — o cabeçalho
// "respira" devagar enquanto há jogo marcado para hoje, em qualquer modalidade.
function applyGameDayGlow_(){
  const wrap = document.getElementById("emblemWrap");
  if(!wrap) return;
  const hasGameToday = currentCompMode() === "matches" &&
    (typeof getTodaysGames_ === "function" ? getTodaysGames_().length > 0 : false);
  wrap.classList.toggle("game-day", hasGameToday);
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

// ===================== "NESTE DIA, HÁ X ANOS" — jogos com o mesmo dia/mês em anos
// anteriores. Só compara dia+mês (não o ano), por isso só começa a aparecer coisa
// quando houver épocas antigas na mesma competição/conta — com só a época atual
// carregada ainda não há nada para mostrar, o que é o esperado. Percorre TODAS as
// competições em modo "Modo Modalidades" (não só a aberta agora), tal como o
// "Marcadores" já faz em renderLeaderboardView, para apanhar épocas passadas.
function getOnThisDayGames_(){
  const now = new Date();
  const todayMonth = now.getMonth() + 1, todayDate = now.getDate(), thisYear = now.getFullYear();
  const out = [];
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [], status: {} };
    (compData.events || []).forEach(ev=>{
      if(!ev.day) return;
      const parts = ev.day.split("-").map(Number);
      const year = parts[0], month = parts[1], date = parts[2];
      if(!year || !month || !date) return;
      if(month !== todayMonth || date !== todayDate || year === thisYear) return;
      const st = (compData.status && compData.status[ev.id]) || {};
      const tag = getMatchResultTag(ev, st);
      if(!tag) return; // só jogos já com resultado conhecido
      out.push({ ev, st, tag, year, yearsAgo: thisYear - year });
    });
  });
  // mais recente primeiro; um por modalidade, para não repetir a mesma data em anos diferentes
  out.sort((a,b)=> a.yearsAgo - b.yearsAgo);
  const seenSport = new Set();
  return out.filter(x=>{
    if(seenSport.has(x.ev.sport)) return false;
    seenSport.add(x.ev.sport);
    return true;
  });
}
function renderOnThisDay_(){
  const el = document.getElementById("onThisDayBox");
  if(!el) return;
  if(currentCompMode() !== "matches" || activeSport !== "Todos"){ el.style.display = "none"; return; }
  const games = getOnThisDayGames_();
  if(!games.length){ el.style.display = "none"; return; }
  el.style.display = "flex";
  el.innerHTML = `<div class="form-overview-title" style="cursor:default;">📅 Neste dia, há anos</div>` +
    '<div class="form-overview-chips">' + games.map(g=>{
    const label = g.tag === "win" ? "✅ Vitória" : g.tag === "loss" ? "❌ Derrota" : "🟰 Empate";
    const color = g.tag === "win" ? "var(--green)" : g.tag === "loss" ? "var(--red)" : "var(--text-dim)";
    const resultText = (g.st.resultado && g.st.resultado.trim()) || "";
    const vsText = g.ev.athlete ? ` vs ${g.ev.athlete}` : "";
    return `<div class="form-overview-row" style="cursor:default;"><span class="fo-sport">${g.yearsAgo} ano${g.yearsAgo===1?'':'s'} <span style="color:var(--text-dim); font-weight:500;">(${g.ev.sport})</span>: <span style="color:${color};">${label}</span>${resultText ? ' ' + resultText : ''}${vsText}</span></div>`;
  }).join('') + '</div>';
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
    // Fonte da verdade é sempre getMatchResultTag — a mesma função que o resto do
    // site usa para saber se foi vitória/empate/derrota. Ela respeita o botão
    // Vitória/Empate/Derrota escolhido à mão, só adivinhando a partir do texto do
    // placar quando ninguém escolheu nada. ANTES, esta função calculava vitória/
    // derrota só a partir do texto do placar, por conta própria — se o texto não
    // batesse certo com o que tinha sido marcado à mão (por qualquer motivo),
    // mostrava uma derrota como se fosse a "maior vitória" da modalidade.
    if(getMatchResultTag(ev, st) !== "win") return;
    const score = parseOursTheirs_(ev, st && st.resultado);
    // sem um placar numérico não há como calcular a diferença de golos/pontos —
    // e se o placar escrito contradisser a vitória marcada à mão (diff <= 0),
    // mais vale não entrar no recorde do que mostrar um número sem sentido
    if(!score || score.ours <= score.theirs) return;
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

