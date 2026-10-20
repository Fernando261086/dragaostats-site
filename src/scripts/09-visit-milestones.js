// ===================== MARCOS DE VISITAS (8) — contado a partir do visitLog que já
// vem na resposta para toda a gente; um "real" é uma entrada sem "type" (as de
// clique/instalação têm sempre type). Celebra-se uma vez por marco, por aparelho —
// sem um contador central no Apps Script, não há forma exata de ser só "a pessoa
// 1000", mas isto já dá a sensação a quem for calhar a passar a marca.
const VISIT_MILESTONES_ = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];
function getTotalSiteVisits_(){
  if(!Array.isArray(ALL.visitLog)) return 0;
  return ALL.visitLog.filter(e => !e.type).length;
}
function maybeCelebrateMilestone_(){
  if(!READONLY_MODE || currentCompMode() !== "matches") return;
  const total = getTotalSiteVisits_();
  if(total <= 0) return;
  let seen = 0;
  try{ seen = parseInt(localStorage.getItem("dia22-milestone-seen") || "0", 10) || 0; }catch(e){}
  const hit = VISIT_MILESTONES_.filter(m => m <= total && m > seen).pop();
  if(!hit) return;
  try{ localStorage.setItem("dia22-milestone-seen", String(hit)); }catch(e){}
  showConfetti_(`🎉 Já somos ${hit.toLocaleString("pt-PT")}! Obrigado por nos acompanhares.`);
}

// Converte uma cor hex (#rrggbb) em rgba(...) com a opacidade pedida — usado para
// pintar os banners de "Próximo jogo"/"Adversário do dia" com a cor da própria
// modalidade (cartaz, não só texto), em vez do dourado genérico de sempre.
function hexToRgba_(hex, alpha){
  const h = (hex || "#e3b23c").replace("#", "");
  const r = parseInt(h.substring(0,2), 16), g = parseInt(h.substring(2,4), 16), b = parseInt(h.substring(4,6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function todayISO_(){
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
// Reaproveitado pelo "Adversário do dia" e pelo "Próximo jogo" — havendo jogo(s)
// hoje, o "Próximo jogo" apaga-se para não repetir a mesma informação; o
// "Adversário do dia" é que fica visível o dia inteiro nesse caso.
function getTodaysGames_(){
  const today = todayISO_();
  return EVENTS.filter(ev=>ev.day===today).sort((a,b)=>(a.t||"").localeCompare(b.t||""));
}
// Só os jogos de hoje que AINDA NÃO COMEÇARAM (mesmo critério do "Próximo jogo").
// Assim que a hora marcada passa, o jogo sai daqui — some do "Adversário do dia"
// e o "Próximo jogo" volta a aparecer sozinho, já a apontar para o que vem a seguir.
function getTodaysUpcomingGames_(){
  const now = new Date();
  return getTodaysGames_().filter(ev=>{
    const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
    return isNaN(d) || d >= now; // sem hora definida: trata como ainda por começar
  });
}
function renderTodayOpponentBanner(matchesMode){
  const banner = document.getElementById("todayOpponentBanner");
  if(!matchesMode){ banner.style.display = "none"; if(typeof renderDayShareToggle_ === "function") renderDayShareToggle_(); return; }

  const todaysGames = getTodaysUpcomingGames_();
  if(todaysGames.length===0){ banner.style.display="none"; if(typeof renderDayShareToggle_ === "function") renderDayShareToggle_(); return; }

  banner.style.display = "flex";
  if(todaysGames.length===1){
    const g = todaysGames[0];
    const t = postTeams_(g); // mesma convenção casa/fora de 23-daily-post-text.js — fora, o FC Porto aparece em segundo
    const color = SPORT_COLORS[g.sport] || "#e3b23c";
    banner.style.background = `linear-gradient(135deg, ${hexToRgba_(color,0.24)} 0%, rgba(10,22,38,0.55) 75%)`;
    banner.style.borderColor = color;
    banner.innerHTML = `
      <div class="tob-tag">HOJE</div>
      ${isClassicoOpponent_(g.athlete) ? '<span class="tob-tag" style="background:#e07b2c; color:#fff; margin-left:6px;">🔥 CLÁSSICO</span>' : ''}
      <div class="tob-info">
        <div class="tob-label">Adversário do dia</div>
        <div class="tob-sport-hero" style="color:${color};">${g.sport}</div>
        <div class="tob-match-hero">${t.home} <span class="tob-vs">vs</span> ${t.away}</div>
        <div class="tob-meta">${localLabel(g.local)} · ${g.t || 'hora por confirmar'}</div>
      </div>
    `;
    banner.style.cursor = "pointer";
    banner.title = "Ver o cartão deste jogo";
    banner.onclick = ()=> goToEventCard(g.id);
  } else {
    // vários jogos hoje — cada um tem direito ao mesmo tratamento de "cartaz" do
    // jogo único: cor da própria modalidade e nomes em destaque, não uma lista
    // de texto plano. A banner em si fica neutra (o destaque está em cada linha).
    banner.style.background = "";
    banner.style.borderColor = "";
    banner.innerHTML = `
      <div class="tob-tag">HOJE</div>
      <div class="tob-info">
        <div class="tob-label">Adversários do dia — ${todaysGames.length} jogos</div>
        <div class="tob-multi-list">
          ${todaysGames.map(g=>{
            const t = postTeams_(g);
            const color = SPORT_COLORS[g.sport] || "#e3b23c";
            return `<div class="tob-multi-row" data-ev-id="${g.id}" style="--sc:${color}; background:${hexToRgba_(color,0.16)};">
              <span class="tob-multi-sport" style="color:${color};">${g.sport}</span>
              <span class="tob-multi-match">${t.home} <span class="tob-vs">vs</span> ${t.away}</span>
              <span class="tob-multi-time">${g.t || 'hora por confirmar'}</span>
            </div>`;
          }).join("")}
        </div>
      </div>
    `;
    banner.style.cursor = "default";
    banner.removeAttribute("title");
    banner.onclick = null;
    banner.querySelectorAll(".tob-multi-row").forEach(row=>{
      row.onclick = ()=> goToEventCard(row.getAttribute("data-ev-id"));
    });
  }
  if(typeof renderDayShareToggle_ === "function") renderDayShareToggle_();
}

function renderNextMatchBanner(matchesMode){
  const banner = document.getElementById("nextMatchBanner");
  if(!matchesMode){ banner.style.display = "none"; return; }
  // ainda há jogo(s) de hoje por começar — o "Adversário do dia" trata disso
  // sozinho, sem repetir; assim que todos tiverem começado, volta a aparecer aqui
  if(getTodaysUpcomingGames_().length > 0){ banner.style.display = "none"; return; }

  const now = new Date();
  let next = null, nextDate = null;
  EVENTS.forEach(ev=>{
    if(!ev.day) return;
    const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
    if(isNaN(d) || d < now) return;
    if(!nextDate || d < nextDate){ nextDate = d; next = ev; }
  });

  if(!next){ banner.style.display = "none"; return; }

  // compara só as DATAS (dia/mês/ano), nunca a hora exata — senão um jogo hoje à
  // tarde, visto de manhã, arredondava sempre para "Amanhã" por engano
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const gameDateOnly = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
  const diffDays = Math.round((gameDateOnly - todayDateOnly) / 86400000);
  const countdownMain = formatCountdownMain(diffDays);
  const countdownPrecise = formatCountdownPrecise(nextDate, now);
  const local = localLabel(next.local);
  const streak = computeCurrentStreak(next.sport);
  const t = postTeams_(next); // mesma convenção casa/fora de 23-daily-post-text.js — fora, o FC Porto aparece em segundo
  const color = SPORT_COLORS[next.sport] || "#e3b23c";

  banner.style.display = "flex";
  banner.style.cursor = "pointer";
  banner.title = "Ver o cartão deste jogo";
  banner.style.background = `linear-gradient(135deg, ${hexToRgba_(color,0.22)} 0%, rgba(10,22,38,0.55) 75%)`;
  banner.style.borderColor = color;
  banner.innerHTML = `
    <div class="nmb-info">
      <div class="tob-label">Próximo jogo ${isClassicoOpponent_(next.athlete) ? '<span class="tob-tag" style="background:#e07b2c; color:#fff; margin-left:4px; font-size:9px;">🔥 CLÁSSICO</span>' : ''}</div>
      <div class="tob-sport-hero" style="color:${color};">${next.sport}</div>
      <div class="tob-match-hero">${t.home} <span class="tob-vs">vs</span> ${t.away}</div>
      <div class="nmb-meta-line">${local} · ${formatFullDate(next.day)}, ${next.t}</div>
      ${streak ? `<div class="nmb-meta-line" style="color:var(--gold);">${streak}</div>` : ''}
    </div>
    <div class="nmb-countdown">
      ${countdownMain}
      ${countdownPrecise ? `<div style="font-size:11px; font-weight:400; opacity:0.8; margin-top:2px;">${countdownPrecise}</div>` : ''}
    </div>
  `;
  banner.onclick = ()=> goToEventCard(next.id);
}

// Vista de calendário mensal (grelha) — só faz sentido no Modo Modalidades
function renderCalendarGrid(monthEvents){
  const box = document.getElementById("calendarGrid");
  const parts = (activeDay||"").split("-").map(Number);
  const year = parts[0], month = parts[1]; // mês 1-indexado
  if(!year || !month){ box.innerHTML = ""; return; }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (new Date(year, month-1, 1).getDay() + 6) % 7; // segunda=0 ... domingo=6

  const gamesByDay = {};
  monthEvents.forEach(ev=>{
    const d = new Date(ev.day + "T00:00:00");
    if(isNaN(d)) return;
    const day = d.getDate();
    (gamesByDay[day] = gamesByDay[day] || []).push(ev);
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear()===year && (today.getMonth()+1)===month;

  let cellsHtml = "";
  for(let i=0;i<firstWeekday;i++) cellsHtml += `<div class="cg-day empty"></div>`;
  for(let day=1; day<=daysInMonth; day++){
    const hasGame = !!gamesByDay[day];
    const isToday = isCurrentMonth && today.getDate()===day;
    const isSelected = gridSelectedDay===day;
    // uma bolinha por modalidade diferente nesse dia (nunca repete cor à toa)
    const sportsThatDay = hasGame ? Array.from(new Set(gamesByDay[day].map(ev=>ev.sport))) : [];
    const dotsHtml = sportsThatDay.map(s=>`<span class="cg-dot" style="background:${SPORT_COLORS[s] || '#5ab0f5'};"></span>`).join("");
    cellsHtml += `<div class="cg-day${hasGame?' has-game':''}${isToday?' today':''}${isSelected?' selected':''}" data-grid-day="${day}">${day}<span class="cg-dots">${dotsHtml}</span></div>`;
  }

  // legenda só com as modalidades que aparecem mesmo neste mês
  const sportsThisMonth = Array.from(new Set(monthEvents.map(ev=>ev.sport))).sort();
  const legendHtml = sportsThisMonth.length > 1
    ? `<div class="cg-legend">${sportsThisMonth.map(s=>{
        const c = SPORT_COLORS[s] || '#5ab0f5';
        return `<span class="cg-legend-item" style="color:${c};"><span class="cg-dot" style="background:${c};"></span>${s}</span>`;
      }).join("")}</div>`
    : '';

  box.innerHTML = `
    <div class="cg-weekdays"><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span>D</span></div>
    <div class="cg-days">${cellsHtml}</div>
    ${legendHtml}
  `;

  box.querySelectorAll('[data-grid-day]').forEach(cell=>{
    const day = parseInt(cell.getAttribute('data-grid-day'),10);
    if(!gamesByDay[day]) return; // só os dias com jogo reagem ao toque
    cell.onclick = ()=>{
      gridSelectedDay = (gridSelectedDay===day) ? null : day; // toca outra vez para limpar
      renderTimeline();
    };
  });
}

// Envia uma reação rápida (👏🔥😢) a uma prova, com o nome de quem reagiu — vai
// direto para a linha reservada "__reactions__" no Apps Script, nunca passa por
// persistAll()/EVENTS, para nunca correr o risco de uma reação de um visitante
// qualquer apagar um resultado que se acabou de gravar.
function sendReaction(eventId, emoji, name){
  noteEngagement_();
  fetch(STORE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ addReaction: { compId: activeCompId, eventId: eventId, emoji: emoji, name: name } })
  }).catch(()=>{});
}

// Cada reação guarda a lista de nomes de quem reagiu (v39) — dados anteriores a
// esta versão ainda podem vir como um número simples, por isso aceita os dois.
function reactionNames(val){ return Array.isArray(val) ? val : []; }
function reactionCount(val){ return Array.isArray(val) ? val.length : (typeof val === "number" ? val : 0); }

const REACTION_EMOJIS = ["👏","🔥","😢"];
// Quem edita nunca reage, só consulta — e agora também vê os nomes de quem reagiu.
function renderReactionBar(eventId){
  const data = (REACTIONS[activeCompId] && REACTIONS[activeCompId][eventId]) || {};
  if(READONLY_MODE){
    return `<div class="reaction-bar" style="display:flex; gap:6px; margin-top:5px; padding-left:2px;">
      ${REACTION_EMOJIS.map(em=>`<button class="reaction-btn" data-emoji="${em}" style="background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:12px; padding:2px 9px; font-size:12px; cursor:pointer; color:var(--text-dim);">${em} <span class="reaction-count">${reactionCount(data[em])}</span></button>`).join("")}
    </div>`;
  }
  // modo edição: toca num emoji para veres os nomes de quem reagiu com ele
  return `<div class="reaction-bar" data-event-id="${eventId}" style="display:flex; flex-direction:column; gap:4px; margin-top:5px; padding-left:2px;">
    <div style="display:flex; gap:6px; flex-wrap:wrap;">
      ${REACTION_EMOJIS.map(em=>{
        const count = reactionCount(data[em]);
        return `<button class="reaction-names-btn" data-emoji="${em}" style="background:rgba(255,255,255,0.03); border:1px solid var(--line); border-radius:12px; padding:2px 9px; font-size:12px; color:var(--text-dim); cursor:${count?'pointer':'default'};">${em} ${count}</button>`;
      }).join("")}
    </div>
    <div class="reaction-names-detail" style="font-size:11px; color:var(--text-dim); display:none;"></div>
  </div>`;
}
function wireReactionBar(line, eventId){
  if(!READONLY_MODE){
    // modo edição: mostra/esconde os nomes de quem reagiu com aquele emoji
    line.querySelectorAll(".reaction-names-btn").forEach(btn=>{
      btn.onclick = (e)=>{
        e.stopPropagation();
        const emoji = btn.dataset.emoji;
        const data = (REACTIONS[activeCompId] && REACTIONS[activeCompId][eventId]) || {};
        const names = reactionNames(data[emoji]);
        const detail = line.querySelector(".reaction-names-detail");
        if(!detail || names.length === 0) return;
        if(detail.dataset.showing === emoji){
          detail.style.display = "none";
          detail.dataset.showing = "";
        }else{
          detail.textContent = `${emoji} ` + names.join(", ");
          detail.style.display = "block";
          detail.dataset.showing = emoji;
        }
      };
    });
    return;
  }
  line.querySelectorAll(".reaction-btn").forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation(); // nunca deixar isto abrir/expandir a prova por baixo
      const emoji = btn.dataset.emoji;
      const myName = getCurrentPersonName() || "Anónimo";
      if(!REACTIONS[activeCompId]) REACTIONS[activeCompId] = {};
      if(!REACTIONS[activeCompId][eventId]) REACTIONS[activeCompId][eventId] = {};
      const current = reactionNames(REACTIONS[activeCompId][eventId][emoji]);
      current.push(myName); // otimista: atualiza já no ecrã
      REACTIONS[activeCompId][eventId][emoji] = current;
      const countEl = btn.querySelector(".reaction-count");
      if(countEl) countEl.textContent = current.length;
      sendReaction(eventId, emoji, myName);
    };
  });
}

function sendPrediction(eventId, option, name){
  noteEngagement_();
  fetch(STORE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ addPrediction: { compId: activeCompId, eventId: eventId, option: option, name: name } })
  }).catch(()=>{});
}

// Cada resposta guarda a lista de nomes de quem respondeu (v40) — dados
// anteriores a esta versão ainda podem vir como um número simples.
function predictionNames(val){ return Array.isArray(val) ? val : []; }
function predictionCount(val){ return Array.isArray(val) ? val.length : (typeof val === "number" ? val : 0); }

let predictionResultsExpanded = new Set(); // ids de jogos com as respostas abertas (não persiste ao fechar a app)
// Enquanto se escreve um resultado, guarda-se logo localmente (para a interface
// reagir na hora) mas só se envia a gravação a sério 800ms depois da última
// tecla — sem isto, cada dígito escrito ("3", "32", "32-", "32-2", "32-28")
// disparava a sua própria gravação e, por vezes, o aviso de "novo resultado"
// repetia-se várias vezes para o mesmo jogo.
const resultSaveTimers = {};
function scheduleResultSave(eventId){
  clearTimeout(resultSaveTimers[eventId]);
  resultSaveTimers[eventId] = setTimeout(()=>{ saveState(); delete resultSaveTimers[eventId]; }, 800);
}
// Ao sair do campo (perde o foco), grava já — não faz sentido esperar os 800ms
// só porque a pessoa mudou de sítio antes disso.
function flushResultSave(eventId){
  if(!resultSaveTimers[eventId]) return;
  clearTimeout(resultSaveTimers[eventId]);
  delete resultSaveTimers[eventId];
  saveState();
}

// Antes do jogo começar (e enquanto a pessoa ainda não respondeu): mostra os
// botões (Sim/Não) ou a caixa de palpite livre — mas nunca a quem edita, porque
// não faz sentido o admin estar a responder às próprias perguntas. Depois de
// responder, depois do jogo começar, ou sempre que é o admin a consultar: mostra
// um resumo compacto com um botão para abrir as respostas — não despeja a lista
// toda logo de início. Quem edita vê também os nomes de quem respondeu o quê.
// Opções fixas do tipo "Vencedor e margem" — pensado para modalidades onde
// acertar o resultado exato é quase impossível (ex: Basquetebol), mas acertar
// quem ganha e por quanto continua a ser um desafio razoável.
const MARGEM_OPTIONS = [
  "vitoria:1-5","vitoria:6-10","vitoria:11-15","vitoria:mais15",
  "empate",
  "derrota:1-5","derrota:6-10","derrota:11-15","derrota:mais15"
];
function margemOptionLabel(o){
  if(o === "empate") return "Empate";
  const parts = o.split(":");
  const bandLabel = parts[1] === "mais15" ? "+15" : parts[1];
  return (parts[0] === "vitoria" ? "Vitória " : "Derrota ") + bandLabel;
}
function margemBand_(diff){
  if(diff <= 5) return "1-5";
  if(diff <= 10) return "6-10";
  if(diff <= 15) return "11-15";
  return "mais15";
}
// 2 pontos = acertou o vencedor E a faixa de diferença; 1 ponto = só acertou o
// vencedor; 0 = errou por completo. O vencedor vem sempre do selo
// Vitória/Empate/Derrota (nunca calculado a partir do placar, tal como o
// resto da app) — a margem, essa sim, vem do placar já escrito.
function computeMargemPoints(guess, tag, resultado){
  if(!guess || !tag) return 0;
  if(guess === "empate") return tag === "draw" ? 2 : 0;
  const parts = guess.split(":");
  const guessedTag = parts[0] === "vitoria" ? "win" : parts[0] === "derrota" ? "loss" : null;
  if(!guessedTag || guessedTag !== tag) return 0;
  const pair = parseScorePair(resultado);
  if(!pair) return 1; // sem placar para confirmar a margem — fica só o ponto de acertar o vencedor
  const diff = Math.abs(pair[0] - pair[1]);
  return parts[1] === margemBand_(diff) ? 2 : 1;
}

// O palpite de "placar" é sempre guardado como "FCP-adversário" (ver nota em
// computePlacarPoints, em 10-prediction-ranking.js) — isso nunca muda. Esta
// função só serve para MOSTRAR esse valor já guardado na ordem casa-fora que
// o resto do site usa (fora, é o adversário que joga em casa e por isso
// aparece primeiro). Não mexe no valor guardado nem na pontuação.
function placarGuessDisplay_(guess, local){
  if(local !== "fora") return guess;
  const pair = parseScorePair(guess);
  if(!pair) return guess;
  return pair[1] + "-" + pair[0];
}

function renderPredictionBar(ev){
  const question = ev.predictionQuestion; // { type: "simnao"|"livre", text: "..." }
  if(!question) return "";

  const data = (PREDICTIONS[activeCompId] && PREDICTIONS[activeCompId][ev.id]) || {};
  let voted = null;
  try{ voted = localStorage.getItem("dia22-prediction-" + ev.id); }catch(e){}
  const startDate = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
  const hasStarted = !isNaN(startDate) && new Date() >= startDate;
  const canAnswer = !hasStarted && !voted && READONLY_MODE; // só quem só vê responde — quem edita nunca vota, só consulta

  if(canAnswer){
    if(question.type === "margem"){
      return `<div class="prediction-bar" style="margin-top:6px; padding-left:2px;">
        <div style="font-size:11px; color:var(--text); margin-bottom:4px;">${question.text}</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${MARGEM_OPTIONS.map(o=>`<button class="prediction-btn" data-option="${o}" style="background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:12px; padding:4px 10px; font-size:11.5px; cursor:pointer; color:var(--text-dim);">${margemOptionLabel(o)}</button>`).join("")}
        </div>
        <div style="font-size:10px; color:var(--text-dim); opacity:0.75; margin-top:3px;">Acertares vencedor + margem vale 2 pontos · acertares só o vencedor vale 1 ponto — ver ranking em 🎯</div>
      </div>`;
    }
    if(question.type === "placar"){
      const homeField = `<input type="number" min="0" max="99" class="gate-input prediction-placar-home" data-event-id="${ev.id}" placeholder="FCP" style="width:56px; padding:5px 6px; font-size:13px; text-align:center;">`;
      const awayField = `<input type="number" min="0" max="99" class="gate-input prediction-placar-away" data-event-id="${ev.id}" placeholder="${ev.athlete||'Adv.'}" style="width:56px; padding:5px 6px; font-size:13px; text-align:center;">`;
      const dash = `<span style="color:var(--text-dim); font-size:13px;">-</span>`;
      // Mostra sempre primeiro quem joga em casa, tal como o resto do site — as
      // classes/campos continuam os mesmos (prediction-placar-home guarda sempre o
      // número do FCP), só a ORDEM visual é que troca em jogos fora.
      const fieldsHtml = ev.local === "fora" ? (awayField + dash + homeField) : (homeField + dash + awayField);
      return `<div class="prediction-bar" style="margin-top:6px; padding-left:2px;">
        <div style="font-size:11px; color:var(--text); margin-bottom:4px;">${question.text}</div>
        <div style="display:flex; align-items:center; gap:6px;">
          ${fieldsHtml}
          <button class="prediction-placar-btn" data-event-id="${ev.id}" style="background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:8px; padding:5px 12px; font-size:12px; color:var(--text); cursor:pointer; white-space:nowrap;">Enviar</button>
        </div>
        <div style="font-size:10px; color:var(--text-dim); opacity:0.75; margin-top:3px;">Acertares em cheio vale 3 pontos · acertares só quem ganha vale 1 ponto — ver ranking em 🎯</div>
      </div>`;
    }
    if(question.type === "livre"){
      return `<div class="prediction-bar" style="margin-top:6px; padding-left:2px;">
        <div style="font-size:11px; color:var(--text); margin-bottom:4px;">${question.text}</div>
        <div style="display:flex; gap:6px;">
          <input type="text" class="gate-input prediction-guess-input" data-event-id="${ev.id}" placeholder="O teu palpite..." style="flex:1; padding:5px 8px; font-size:12px;">
          <button class="prediction-guess-btn" data-event-id="${ev.id}" style="background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:8px; padding:5px 12px; font-size:12px; color:var(--text); cursor:pointer; white-space:nowrap;">Enviar</button>
        </div>
      </div>`;
    }
    const options = ["Sim", "Não"];
    return `<div class="prediction-bar" style="margin-top:6px; padding-left:2px;">
      <div style="font-size:11px; color:var(--text); margin-bottom:4px;">${question.text}</div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${options.map(o=>`<button class="prediction-btn" data-option="${o}" style="background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:12px; padding:4px 12px; font-size:12px; cursor:pointer; color:var(--text-dim);">${o}</button>`).join("")}
      </div>
    </div>`;
  }

  // já respondeu, já começou, ou é o admin a consultar — resumo compacto + botão
  const isLivre = question.type === "livre" || question.type === "placar";
  const isMargem = question.type === "margem";
  const fixedOptions = isMargem ? MARGEM_OPTIONS : ["Sim","Não"];
  // Para "placar" o valor guardado é sempre "FCP-adversário" — para mostrar, converte
  // para a ordem casa-fora do resto do site (ver placarGuessDisplay_ acima).
  const optLabel = isMargem ? margemOptionLabel : (question.type === "placar" ? (g)=>placarGuessDisplay_(g, ev.local) : (o)=>o);
  const isAdminViewer = !READONLY_MODE;
  const total = isLivre
    ? Object.values(data).reduce((sum,v)=> sum + predictionCount(v), 0)
    : fixedOptions.reduce((sum,o)=> sum + predictionCount(data[o]), 0);
  const isExpanded = predictionResultsExpanded.has(ev.id);
  const summaryBits = [];
  if(voted) summaryBits.push(`✓ Respondeste: <b style="color:var(--text);">${optLabel(voted)}</b>`);
  summaryBits.push(`${total} resposta${total===1?'':'s'}`);

  let detailsHtml = "";
  if(isExpanded){
    if(isLivre){
      const ranked = Object.keys(data).sort((a,b)=> predictionCount(data[b]) - predictionCount(data[a]));
      detailsHtml = ranked.map(guess=>{
        const isMine = guess === voted;
        const names = predictionNames(data[guess]);
        return `<div style="margin-bottom:3px;">
          <div style="display:flex; justify-content:space-between; font-size:11.5px; color:${isMine?'var(--gold)':'var(--text-dim)'};">
            <span>${isMine?'✓ ':''}${optLabel(guess)}</span><span>${predictionCount(data[guess])}</span>
          </div>
          ${isAdminViewer && names.length ? `<div style="font-size:10.5px; color:var(--text-dim); opacity:0.8; padding-left:8px;">${names.join(", ")}</div>` : ''}
        </div>`;
      }).join("") || '<div style="font-size:11.5px; color:var(--text-dim);">Ainda sem palpites.</div>';
    }else{
      detailsHtml = fixedOptions.map(o=>{
        const c = predictionCount(data[o]);
        const pct = total > 0 ? Math.round((c/total)*100) : 0;
        const isMine = o === voted;
        const names = predictionNames(data[o]);
        return `<div style="margin-bottom:4px;">
          <div style="display:flex; justify-content:space-between; font-size:11.5px; color:${isMine?'var(--gold)':'var(--text-dim)'};">
            <span>${isMine?'✓ ':''}${optLabel(o)}</span><span>${pct}%</span>
          </div>
          <div style="background:rgba(255,255,255,0.06); border-radius:3px; height:5px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${isMine?'var(--gold)':'var(--gold-dim)'};"></div>
          </div>
          ${isAdminViewer && names.length ? `<div style="font-size:10.5px; color:var(--text-dim); opacity:0.8; margin-top:2px;">${names.join(", ")}</div>` : ''}
        </div>`;
      }).join("");
    }
  }

  return `<div class="prediction-bar" data-event-id="${ev.id}" style="margin-top:6px; padding-left:2px;">
    <div style="font-size:11px; color:var(--text); margin-bottom:4px;">${question.text}</div>
    <div style="font-size:11px; color:var(--text-dim); margin-bottom:4px;">${summaryBits.join(" · ")}</div>
    ${detailsHtml}
    <button class="prediction-toggle-btn" data-event-id="${ev.id}" style="background:none; border:none; color:var(--gold-dim); cursor:pointer; font-size:11px; text-decoration:underline; padding:0;">${isExpanded ? "Esconder respostas" : "📊 Ver respostas"}</button>
  </div>`;
}

