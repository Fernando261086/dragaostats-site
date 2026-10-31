// Fecha o menu "📤" de um cartão (estatísticas/partilha) ao tocar fora dele —
// registado uma única vez aqui, fora de renderTimeline(), para não acumular
// um listener novo em cada novo render da lista.
document.addEventListener("click", (e)=>{
  document.querySelectorAll('[data-cardshare-menu="1"][data-open="1"]').forEach(menu=>{
    if(!menu.closest(".card-share-wrap").contains(e.target)){
      menu.style.display = "none";
      menu.removeAttribute("data-open");
    }
  });
});

// ===================== QUEM INSTALOU / TEM NOTIFICAÇÕES LIGADAS =====================
async function renderInstalledListPanel(){
  const panel = document.getElementById("installedListPanel");
  panel.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">A ir buscar a lista...</div>`;
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ getInstalledAndNotifyingNames: true, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      panel.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">⚠️ Não foi possível ir buscar a lista.</div>`;
      return;
    }
    const fmtWhen = (t)=>{ const d = new Date(t); return isNaN(d) ? t : d.toLocaleDateString("pt-PT"); };
    const listHtml = (arr, emptyMsg)=> arr.length
      ? arr.map(e=>`<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid var(--line);">
          <span style="font-size:13px; color:var(--text);">${e.name}</span>
          <span style="font-size:11px; color:var(--text-dim);">${fmtWhen(e.t)}</span>
        </div>`).join("")
      : `<div style="font-size:12px; color:var(--text-dim);">${emptyMsg}</div>`;
    panel.innerHTML = `
      <div class="medal-section-title">📲 Instalaram a app (${result.installed.length})</div>
      <div style="margin-bottom:14px;">${listHtml(result.installed, "Ainda ninguém instalou.")}</div>
      <div class="medal-section-title">🔔 Notificações ligadas (${result.notifying.length})</div>
      <div>${listHtml(result.notifying, "Ainda ninguém tem notificações ligadas.")}</div>
      <div class="add-btn-row" style="margin-top:14px;">
        <button class="add-cancel" id="closeInstalledListBtn">Fechar</button>
      </div>
    `;
    document.getElementById("closeInstalledListBtn").onclick = ()=>{ panel.style.display = "none"; };
  }catch(e){
    panel.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">⚠️ Erro de rede ao ir buscar a lista.</div>`;
  }
}
document.getElementById("installedListBtn").onclick = ()=>{
  const panel = document.getElementById("installedListPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening) renderInstalledListPanel();
};

function wirePredictionBar(line, ev){
  line.querySelectorAll(".prediction-btn").forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation();
      const option = btn.dataset.option;
      const myName = getCurrentPersonName() || "Anónimo";
      try{ localStorage.setItem("dia22-prediction-" + ev.id, option); }catch(err){}
      if(!PREDICTIONS[activeCompId]) PREDICTIONS[activeCompId] = {};
      if(!PREDICTIONS[activeCompId][ev.id]) PREDICTIONS[activeCompId][ev.id] = {};
      const current = predictionNames(PREDICTIONS[activeCompId][ev.id][option]);
      current.push(myName); // otimista
      PREDICTIONS[activeCompId][ev.id][option] = current;
      sendPrediction(ev.id, option, myName);
      const bar = line.querySelector(".prediction-bar");
      if(bar){ bar.outerHTML = renderPredictionBar(ev); wirePredictionBar(line, ev); }
    };
  });
  const guessInput = line.querySelector(".prediction-guess-input");
  const guessBtn = line.querySelector(".prediction-guess-btn");
  if(guessBtn){
    guessBtn.onclick = (e)=>{
      e.stopPropagation();
      const guess = (guessInput.value || "").trim();
      if(!guess) return;
      const myName = getCurrentPersonName() || "Anónimo";
      try{ localStorage.setItem("dia22-prediction-" + ev.id, guess); }catch(err){}
      if(!PREDICTIONS[activeCompId]) PREDICTIONS[activeCompId] = {};
      if(!PREDICTIONS[activeCompId][ev.id]) PREDICTIONS[activeCompId][ev.id] = {};
      const current = predictionNames(PREDICTIONS[activeCompId][ev.id][guess]);
      current.push(myName); // otimista
      PREDICTIONS[activeCompId][ev.id][guess] = current;
      sendPrediction(ev.id, guess, myName);
      const bar = line.querySelector(".prediction-bar");
      if(bar){ bar.outerHTML = renderPredictionBar(ev); wirePredictionBar(line, ev); }
    };
  }
  const placarBtn = line.querySelector(".prediction-placar-btn");
  if(placarBtn){
    placarBtn.onclick = (e)=>{
      e.stopPropagation();
      const homeInput = line.querySelector(".prediction-placar-home");
      const awayInput = line.querySelector(".prediction-placar-away");
      const h = parseInt(homeInput.value, 10), a = parseInt(awayInput.value, 10);
      if(isNaN(h) || isNaN(a) || h < 0 || a < 0){ alert("Preenche os dois números do resultado."); return; }
      const guess = h + "-" + a;
      const myName = getCurrentPersonName() || "Anónimo";
      try{ localStorage.setItem("dia22-prediction-" + ev.id, guess); }catch(err){}
      if(!PREDICTIONS[activeCompId]) PREDICTIONS[activeCompId] = {};
      if(!PREDICTIONS[activeCompId][ev.id]) PREDICTIONS[activeCompId][ev.id] = {};
      const current = predictionNames(PREDICTIONS[activeCompId][ev.id][guess]);
      current.push(myName); // otimista
      PREDICTIONS[activeCompId][ev.id][guess] = current;
      sendPrediction(ev.id, guess, myName);
      const bar = line.querySelector(".prediction-bar");
      if(bar){ bar.outerHTML = renderPredictionBar(ev); wirePredictionBar(line, ev); }
    };
  }
  const toggleBtn = line.querySelector(".prediction-toggle-btn");
  if(toggleBtn){
    toggleBtn.onclick = (e)=>{
      e.stopPropagation();
      const id = toggleBtn.dataset.eventId;
      if(predictionResultsExpanded.has(id)) predictionResultsExpanded.delete(id);
      else predictionResultsExpanded.add(id);
      const bar = line.querySelector(".prediction-bar");
      if(bar){ bar.outerHTML = renderPredictionBar(ev); wirePredictionBar(line, ev); }
    };
  }
}

// "Próximos jogos" não acaba no fim do mês: mostra SEMPRE os primeiros jogos do mês
// seguinte a seguir aos deste (assim há continuidade, sem degrau entre meses) — pelo
// menos PEEK_ALWAYS, e mais se o mês atual estiver a acabar, até haver PEEK_MIN_UPCOMING à vista.
const PEEK_MIN_UPCOMING = 4;
const PEEK_ALWAYS = 3;
function computeNextMonthPeek_(shownCount, months, activeMonth, events, isMarkedFn, sport, query){
  const idx = months.indexOf(activeMonth);
  const nextMonthKey = (idx >= 0 && idx < months.length - 1) ? months[idx + 1] : null;
  let extra = [];
  if(nextMonthKey){
    extra = events.filter(ev=> (ev.day||"").slice(0,7) === nextMonthKey && !isMarkedFn(ev));
    if(sport && sport !== "Todos") extra = extra.filter(e=> e.sport === sport);
    const q = (query||"").trim().toLowerCase();
    if(q) extra = extra.filter(e=> (e.athlete||"").toLowerCase().includes(q));
    extra = extra.slice()
      .sort((a,b)=> ((a.day||"") + " " + (a.t||"")).localeCompare((b.day||"") + " " + (b.t||"")))
      .slice(0, Math.max(PEEK_ALWAYS, PEEK_MIN_UPCOMING - shownCount));
  }
  return { nextMonthKey, extra };
}
function monthNameLower_(key){
  return (MONTH_NAMES[parseInt((key||"").slice(5,7),10) - 1] || key).toLowerCase();
}

function renderTimeline(){
  const container = document.getElementById("timeline");
  container.innerHTML = "";
  const matchesMode = currentCompMode()==="matches";
  container.classList.toggle("tl-matches", matchesMode);
  renderTodayOpponentBanner(matchesMode);
  renderNextMatchBanner(matchesMode);
  renderPersonalPredictionBanner(matchesMode);
  renderWeeklyTopPredictorBanner(matchesMode);
  renderPendingResultsBanner(matchesMode);

  const monthEvents = EVENTS.filter(belongsToActiveDay);
  const gridOn_ = matchesMode && calendarGridMode && activeDay !== "todos";
  document.getElementById("calendarGrid").style.display = gridOn_ ? "block" : "none";
  if(gridOn_){
    renderCalendarGrid(monthEvents);
  }

  let filtered = monthEvents;
  if(gridOn_ && gridSelectedDay){
    filtered = filtered.filter(ev=>{
      const d = new Date(ev.day + "T00:00:00");
      return !isNaN(d) && d.getDate() === gridSelectedDay;
    });
  }
  if(activeSport!=="Todos") filtered = filtered.filter(e=>e.sport===activeSport);
  if(searchQuery.trim()){
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(e=>e.athlete.toLowerCase().includes(q));
  }
  if(hideCompleted && !matchesMode){
    filtered = filtered.filter(e=> !isResolved(e) || !isCompletedGracePeriodOver(e));
  }
  if(matchesMode){
    if(matchesViewFilter === "proximos"){
      filtered = filtered.filter(e=> !isMarked(e));
    }else if(matchesViewFilter === "resultados"){
      filtered = filtered.filter(e=> isMarked(e)).slice().reverse(); // mais recente primeiro
    }
  }

  // "Próximos jogos" não acaba no fim do mês — juntam-se sempre os primeiros do mês
  // seguinte (cartões completos, para se poder prognosticar já) e, no fim, fica um
  // botão para ir a esse mês
  const isUpcomingView = matchesMode && matchesViewFilter === "proximos" && !(calendarGridMode && gridSelectedDay);
  const monthPartCount = filtered.length;
  let nextMonthKey = null, peekFirstId = null;
  if(isUpcomingView){
    const peek = computeNextMonthPeek_(filtered.length, getDaysPresent(), activeDay, EVENTS, isMarked, activeSport, searchQuery);
    nextMonthKey = peek.nextMonthKey;
    if(peek.extra.length){ peekFirstId = peek.extra[0].id; filtered = filtered.concat(peek.extra); }
  }
  const appendNextMonthBtn = ()=>{
    if(!isUpcomingView || !nextMonthKey) return;
    const btn = document.createElement("button");
    btn.className = "add-save month-next-btn";
    btn.style.cssText = "width:100%; margin-top:18px;";
    btn.textContent = "Ver todos os jogos de " + monthNameLower_(nextMonthKey) + " →";
    btn.onclick = ()=>{
      activeDay = nextMonthKey;
      activeSport = "Todos";
      gridSelectedDay = null;
      document.getElementById("dayNum").textContent = nextMonthKey;
      renderDayTabs();
      renderFilters();
      renderProgress();
      renderTimeline();
      const tabs = document.getElementById("dayTabs");
      if(tabs && tabs.scrollIntoView) tabs.scrollIntoView({behavior:"smooth", block:"start"});
    };
    container.appendChild(btn);
  };

  // determina a próxima prova por acontecer (ainda sem marcação e sem estar eliminada)
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  let nextUpId = null;
  for(const ev of filtered){
    if(isEliminated(ev)) continue;
    if(isMarked(ev)) continue;
    const isFullDate = /^\d{4}-\d{2}-\d{2}$/.test(ev.day||"");
    if(isFullDate){
      // Modo Modalidades: compara a data e a hora completas, nunca só a hora do
      // dia (senão um jogo de amanhã cedo parecia "já ter passado" comparado com
      // agora à tarde)
      const evDateTime = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
      if(!isNaN(evDateTime) && evDateTime >= now){ nextUpId = ev.id; break; }
    }else{
      if(minutesOf(ev.t) >= nowMin){ nextUpId = ev.id; break; }
    }
  }

  if(filtered.length === 0){
    const empty = document.createElement("div");
    empty.className = "timeline-empty";
    empty.innerHTML = `<div class="timeline-empty-icon">🔍</div><div>Sem provas para mostrar com estes filtros.</div>`;
    // v232: modalidade sem jogos neste mês → diz-o e oferece o mês mais próximo que tenha
    if(matchesMode && activeSport !== "Todos" && activeDay !== "todos"){
      const meses = Array.from(new Set(EVENTS.filter(e=>e.sport===activeSport).map(e=>(e.day||"").slice(0,7)).filter(Boolean))).sort();
      const ix = (k)=>parseInt(k.slice(0,4),10)*12 + parseInt(k.slice(5,7),10);
      meses.sort((a,b)=>Math.abs(ix(a)-ix(activeDay)) - Math.abs(ix(b)-ix(activeDay)) || a.localeCompare(b));
      empty.innerHTML = `<div class="timeline-empty-icon">🔍</div><div>Sem jogos de ${activeSport} em ${monthNameLower_(activeDay)}.</div>`;
      if(meses.length){
        const mb = document.createElement("button");
        mb.className = "add-save"; mb.style.cssText = "margin-top:12px;";
        mb.textContent = "Ver " + monthNameLower_(meses[0]) + " →";
        mb.onclick = ()=>{
          activeDay = meses[0]; gridSelectedDay = null;
          document.getElementById("dayNum").textContent = activeDay;
          renderDayTabs(); renderFilters(); renderProgress(); renderTimeline();
        };
        empty.appendChild(mb);
      }
    }
    container.appendChild(empty);
    appendNextMonthBtn();
    return;
  }

  let lastGroupKey = null;
  filtered.forEach(ev=>{
    // primeiro jogo do mês seguinte: título a separar (e, se este mês já não tem nada, uma nota)
    if(peekFirstId && ev.id === peekFirstId){
      if(monthPartCount === 0){
        const none = document.createElement("div");
        none.className = "medal-empty";
        none.style.padding = "14px 0 0";
        none.textContent = "Sem mais jogos por acontecer em " + monthNameLower_(activeDay) + ".";
        container.appendChild(none);
      }
      const divider = document.createElement("div");
      divider.className = "month-peek-divider";
      divider.textContent = "A seguir, em " + monthNameLower_(nextMonthKey);
      container.appendChild(divider);
      lastGroupKey = null;
    }
    const groupKey = matchesMode ? ev.day : (ev.t.split(":")[0]+"h");
    if(groupKey !== lastGroupKey){
      const hl = document.createElement("div");
      hl.className = "hour-label";
      hl.style.marginLeft = matchesMode ? "0" : "58px";
      hl.textContent = matchesMode ? formatFullDate(ev.day) : groupKey;
      container.appendChild(hl);
      lastGroupKey = groupKey;
    }

    const st = getEv(ev.id);
    const eliminated = matchesMode ? false : isEliminated(ev);
    const isNext = ev.id === nextUpId;
    const row = document.createElement("div");
    row.id = "ev-card-" + ev.id;
    row.className = "event" + (matchesMode ? " ev-matches" : "")
      + (eliminated ? " status-out" : st.passou==="yes" ? " status-yes" : st.passou==="no" ? " status-no" : "")
      + (isNext ? " upcoming" : "");

    const color = SPORT_COLORS[ev.sport] || "#e3b23c";

    // MODO COMPACTO: linha densa (duas linhas), que expande ao tocar.
    // No Modo Modalidades é sempre assim (linha moderna que abre ao tocar, como no Início).
    const useCompact = compactMode || matchesMode;
    if(useCompact && !expandedIds.has(ev.id)){
      const line = document.createElement("div");
      line.id = "ev-card-" + ev.id;
      line.className = "compact-line"
        + (eliminated ? " status-out" : st.passou==="yes" ? " status-yes" : st.passou==="no" ? " status-no" : "")
        + (isNext ? " upcoming" : "");
      const medalIcon = st.medal==='gold' ? '🥇' : st.medal==='silver' ? '🥈' : st.medal==='bronze' ? '🥉' : '';
      const result = st.resultado ? st.resultado.trim() : '';
      const detail = [ev.detail, ev.phase].filter(Boolean).join(" · ");
      const resTag = matchesMode ? getMatchResultTag(ev, st) : null;
      const resColor = resTag==='win' ? 'var(--green)' : resTag==='loss' ? 'var(--red)' : resTag==='draw' ? 'var(--text-dim)' : 'var(--accent-bright)';
      const timeLabel = matchesMode ? `${formatShortDate(ev.day)} · ${ev.t}` : ev.t;
      if(matchesMode){
        // linha moderna (igual às listas do Início); tocar abre o cartão completo
        const dd = new Date(ev.day + "T00:00:00");
        const wd = isNaN(dd) ? "" : ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"][dd.getDay()];
        const tt = postTeams_(ev);
        const mesc = x => String(x == null ? "" : x).replace(/[&<>"]/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
        const cevj = cevLiveFor_(ev);
        const liveNow = !result && ((cevj && cevj.estado === "vivo") || (!(cevj && cevj.estado === "fim") && isLiveNow_(ev)));
        const tagTxt = resTag==='win' ? ["V","win"] : resTag==='loss' ? ["D","loss"] : resTag==='draw' ? ["E","draw"] : null;
        const hasGameStats = (Array.isArray(ev.playerStats) && ev.playerStats.length > 0) || (Array.isArray(ev.setScores) && ev.setScores.some(x=>x && String(x).trim()));
        const sub = [ev.detail, ev.phase].filter(Boolean).join(" · ");
        line.classList.add("match-row");
        line.style.setProperty("--sc", color);
        line.innerHTML = `
          <div class="mr-main">
            <span class="hv-date"><b>${isNaN(dd) ? "" : dd.getDate()}</b><i>${wd}</i></span>
            <span class="hv-row-body"><span class="hv-row-sport">${mesc(ev.sport)}${sub ? " · " + mesc(sub) : ""}</span>
              <span class="hv-row-match">${result ? `${crestName_(ev, tt.home)} <b>${mesc(result)}</b> ${crestNameEnd_(ev, tt.away)}` : matchTitleHtml_(ev) + matchNeutralTag_(ev)}</span>${(!result && cevj && cevj.estado === "vivo") ? `<span class="live-score">${cevLiveText_(ev, cevj)}</span>` : ""}</span>
            ${liveNow ? '<span class="live-flag">AO VIVO</span>' : (result ? (tagTxt ? `<span class="hv-tag hv-tag-${tagTxt[1]}">${tagTxt[0]}</span>` : "") : `<span class="hv-row-time">${mesc(ev.t || "")}</span>`)}
          </div>
          <div class="mr-foot">${hasGameStats ? `<button type="button" class="mr-stats" data-mrstats="1">${playerStatsCardLabel(ev.sport)}</button>` : '<span></span>'}<button type="button" class="mr-more" data-mrmore="1">Ver detalhes ›</button></div>
          ${result ? renderReactionBar(ev.id) : ''}
          ${(ev.day && ev.t) ? renderPredictionBar(ev) : ''}
        `;
        const mrStatsBtn = line.querySelector('[data-mrstats="1"]');
        if(mrStatsBtn) mrStatsBtn.onclick = (e)=>{ e.stopPropagation(); statsOpenedFromWeekView = false; openPlayerStatsPanel(ev); };
        const mrMoreBtn = line.querySelector('[data-mrmore="1"]');
        if(mrMoreBtn) mrMoreBtn.onclick = (e)=>{ e.stopPropagation(); if(typeof openGamePage_ === "function" && openGamePage_(ev.id)) return; expandedIds.add(ev.id); renderTimeline(); };
        line.onclick = (e)=>{
          if(e.target.closest("button, a, input, select, textarea, .reaction-bar, [class*=prediction]")) return; // não abre ao tocar nas reações/palpite
          expandedIds.add(ev.id);
          renderTimeline();
        };
        container.appendChild(line);
        if(result) wireReactionBar(line, ev.id);
        if(ev.day && ev.t) wirePredictionBar(line, ev);
        return;
      }
      line.innerHTML = `
        <div class="cl-row1">
          <span class="c-time">${timeLabel}</span>
          <span class="c-sport" style="--sport-color:${color}">${ev.sport}</span>
          <span class="c-athlete">${ev.athlete}</span>
          <span class="c-medal">${medalIcon}</span>
        </div>
        <div class="cl-row2">
          <span class="c-detail">${detail}</span>
          ${result ? `<span class="c-result" style="color:${resColor};">${result}</span>` : ''}
        </div>
        ${result ? renderReactionBar(ev.id) : ''}
        ${(matchesMode && ev.day && ev.t) ? renderPredictionBar(ev) : ''}
      `;
      line.onclick = ()=>{
        expandedIds.add(ev.id);
        renderTimeline();
      };
      container.appendChild(line);
      if(result) wireReactionBar(line, ev.id);
      if(matchesMode && ev.day && ev.t) wirePredictionBar(line, ev);
      return;
    }

    const body = matchesMode
      ? (READONLY_MODE ? renderReadonlyMatchResultHtml_(ev, st) : `<div class="controls">
          <input class="result-input${st.resultado && st.resultado.trim() ? ' has-result' : ''}" type="text" placeholder="Resultado (ex: 2-1)" value="${st.resultado ? st.resultado.replace(/"/g,'&quot;') : ''}">
        </div>
        <div class="medal-picker">
          <button class="medal-btn on-win ${st.resultTag==='win'?'active':''}" data-restag="win">✅ Vitória</button>
          <button class="medal-btn on-draw ${st.resultTag==='draw'?'active':''}" data-restag="draw">🟰 Empate</button>
          <button class="medal-btn on-loss ${st.resultTag==='loss'?'active':''}" data-restag="loss">❌ Derrota</button>
        </div>`)
      : eliminated
      ? `<div class="out-note">Não se apurou na fase anterior</div>`
      : `<div class="controls">
          <div class="seg">
            <button class="on-yes ${st.passou==='yes'?'active':''}" data-act="yes">Passou</button>
            <button class="on-no ${st.passou==='no'?'active':''}" data-act="no">Não</button>
          </div>
          <input class="result-input${st.resultado && st.resultado.trim() ? ' has-result' : ''}" type="text" placeholder="Resultado / tempo / posição" value="${st.resultado ? st.resultado.replace(/"/g,'&quot;') : ''}">
        </div>
        <div class="medal-picker">
          <button class="medal-btn on-gold ${st.medal==='gold'?'active':''}" data-medal="gold">🥇 Ouro</button>
          <button class="medal-btn on-silver ${st.medal==='silver'?'active':''}" data-medal="silver">🥈 Prata</button>
          <button class="medal-btn on-bronze ${st.medal==='bronze'?'active':''}" data-medal="bronze">🥉 Bronze</button>
        </div>`;

    const metaLine = matchesMode
      ? [localLabel(ev.local,'short'), ev.venue, ev.detail, ev.phase].filter(Boolean).join(" · ")
      : [ev.detail, ev.phase].filter(Boolean).join(" · ");
    const notesLine = (matchesMode && ev.notes) ? `<div class="out-note" style="color:var(--text-dim);">${ev.notes}</div>` : '';
    const athleteLabel = matchesMode ? matchTitleText_(ev) : ev.athlete;

    row.innerHTML = `
      <div class="time">${matchesMode ? `<span class="time-date">${formatShortDate(ev.day)}</span><br>` : ''}${ev.t}${ev.approx ? '<span class="approx"> ~</span>' : ''}</div>
      <div class="dot-col"><div class="dot"></div></div>
      <div class="card" style="--sport-color:${color}">
        <div class="card-top">
          <span class="sport">${ev.sport}</span>
          ${(() => {
            if(!matchesMode || (st.resultado && st.resultado.trim())) return '';
            const cev = cevLiveFor_(ev);
            if(cev && cev.estado === "fim") return ''; // a CEV diz que acabou
            return (cev && cev.estado === "vivo") || isLiveNow_(ev) ? '<span class="live-flag">AO VIVO</span>' : '';
          })()}
          ${isNext ? '<span class="upcoming-flag">A seguir</span>' : ''}
          ${ev.cond && !eliminated ? '<span class="final-flag">se apurar</span>' : ''}
          ${!matchesMode ? '<button class="dup-btn" data-share="1" title="Copiar link direto para esta prova">🔗</button>' : ''}
          ${matchesMode ? `
          <div class="card-share-wrap">
            <button class="dup-btn" data-cardshare-toggle="1" title="Estatísticas e partilha" aria-label="Estatísticas e partilha" aria-expanded="false">📤</button>
            <div class="card-share-menu" data-cardshare-menu="1" style="display:none;">
              <button class="card-share-item" data-playerstats="1">📊 Estatísticas</button>
              <button class="card-share-item" data-sharecard="1">🖼️ ${st.resultado && st.resultado.trim() ? 'Imagem do resultado' : 'Imagem para promover'}</button>
              <button class="card-share-item" data-sharereel="1">🎬 ${st.resultado && st.resultado.trim() ? 'Reel do resultado' : 'Reel para promover'}</button>
            </div>
          </div>` : ''}
          ${matchesMode && !READONLY_MODE ? '<button class="dup-btn" data-choosequestion="1" title="Escolher pergunta de prognóstico">🎯</button>' : ''}
          <button class="dup-btn" data-dup="1" title="Duplicar prova">⧉</button>
          <button class="edit-btn" data-edit="1" title="Editar prova">✎</button>
          <button class="del-btn" data-del="1" title="Eliminar prova">✕</button>
          ${(compactMode || matchesMode) ? '<button class="del-btn" data-collapse="1" title="Recolher">▲</button>' : ''}
        </div>
        <div class="athlete" data-athlete-link="1" title="Ver todas as provas de ${ev.athlete}">${athleteLabel}</div>
        <div class="meta">${metaLine}</div>
        ${(() => {
          if(!matchesMode || (st.resultado && st.resultado.trim())) return '';
          const cev = cevLiveFor_(ev);
          if(!cev || cev.estado !== "vivo") return '';
          return `<div class="live-score">${cevLiveText_(ev, cev)}</div>`;
        })()}
        ${(() => {
          if(!matchesMode) return '';
          const h2h = getHeadToHeadRecord_(ev.sport, ev.athlete, ev.id);
          if(h2h.total === 0) return '';
          return `<div class="meta" style="margin-top:2px; opacity:0.85;">📊 Frente a frente: <b style="color:var(--green); font-weight:700;">${h2h.w}V</b> <b style="color:var(--text-dim); font-weight:700;">${h2h.d}E</b> <b style="color:var(--red); font-weight:700;">${h2h.l}D</b></div>`;
        })()}
        ${notesLine}
        ${ev.watchUrl ? `<a class="watch-link" href="${ev.watchUrl}" target="_blank" rel="noopener">📺 Ver transmissão</a>` : ''}
        ${(matchesMode && typeof STANDINGS === "object" && STANDINGS && STANDINGS[ev.sport] && (STANDINGS[ev.sport].rows || []).length) ? `<div class="watch-link" data-standings-go="1" style="cursor:pointer;">🏆 Classificação</div>` : (ev.classLink ? `<a class="watch-link" href="${ev.classLink}" target="_blank" rel="noopener">🏆 Classificação geral</a>` : '')}
        ${matchesMode ? `<a class="watch-link" href="https://wa.me/?text=${buildWhatsAppShareText_(ev, st)}" target="_blank" rel="noopener">💬 Partilhar no WhatsApp</a>` : ''}
        ${(matchesMode && ((Array.isArray(ev.playerStats) && ev.playerStats.length > 0) || (Array.isArray(ev.setScores) && ev.setScores.some(s=>s && s.trim())))) ? `<div class="watch-link" data-playerstats-preview="1" style="cursor:pointer;">${playerStatsCardLabel(ev.sport)}</div>` : ''}
        ${body}
        ${(st.resultado && st.resultado.trim()) ? renderReactionBar(ev.id) : ''}
        ${(matchesMode && ev.day && ev.t) ? renderPredictionBar(ev) : ''}
      </div>
    `;

    const shareBtn = row.querySelector('[data-share="1"]');
    if(st.resultado && st.resultado.trim()) wireReactionBar(row, ev.id);
    if(matchesMode && ev.day && ev.t) wirePredictionBar(row, ev);
    if(shareBtn) shareBtn.onclick = async ()=>{
      const url = new URL(location.href.split('?')[0]);
      url.searchParams.set('comp', activeCompId);
      url.searchParams.set('day', ev.day);
      url.searchParams.set('ev', ev.id);
      const link = url.toString();
      const shareText = `${ev.athlete} — ${ev.sport}${ev.detail ? " · "+ev.detail : ""} (${ev.t})`;
      if(navigator.share){
        try{ await navigator.share({ title: shareText, url: link }); }catch(e){ /* cancelado, ignora */ }
      }else if(navigator.clipboard){
        try{
          await navigator.clipboard.writeText(link);
          alert("Link copiado! Já podes colar e enviar:\n" + link);
        }catch(e){
          prompt("Copia este link:", link);
        }
      }else{
        prompt("Copia este link:", link);
      }
    };

    if(matchesMode){
      const cardShareMenu = row.querySelector('[data-cardshare-menu="1"]');
      const closeCardShareMenu = ()=>{
        if(!cardShareMenu) return;
        cardShareMenu.style.display = "none";
        cardShareMenu.removeAttribute("data-open");
      };
      const cardShareToggle = row.querySelector('[data-cardshare-toggle="1"]');
      if(cardShareToggle && cardShareMenu) cardShareToggle.onclick = (e)=>{
        e.stopPropagation();
        const opening = cardShareMenu.style.display === "none" || !cardShareMenu.style.display;
        // fecha qualquer outro cartão que tenha ficado aberto, antes de abrir este
        document.querySelectorAll('[data-cardshare-menu="1"][data-open="1"]').forEach(m=>{
          if(m !== cardShareMenu){ m.style.display = "none"; m.removeAttribute("data-open"); }
        });
        cardShareMenu.style.display = opening ? "flex" : "none";
        if(opening) cardShareMenu.setAttribute("data-open", "1"); else cardShareMenu.removeAttribute("data-open");
      };
      row.querySelector('[data-playerstats="1"]').onclick = ()=>{
        closeCardShareMenu();
        statsOpenedFromWeekView = false; // aberto normalmente pelo calendário
        openPlayerStatsPanel(ev);
      };
      const chooseQBtn = row.querySelector('[data-choosequestion="1"]');
      if(chooseQBtn) chooseQBtn.onclick = ()=> openQuestionPanel(ev);
      const standingsGo = row.querySelector('[data-standings-go="1"]');
      if(standingsGo) standingsGo.onclick = ()=>{ openSportPage_(ev.sport, "classificacao"); window.scrollTo(0, 0); };
      const previewLink = row.querySelector('[data-playerstats-preview="1"]');
      if(previewLink) previewLink.onclick = ()=>{
        statsOpenedFromWeekView = false;
        openPlayerStatsPanel(ev);
      };
      const shareCardBtn = row.querySelector('[data-sharecard="1"]');
      if(shareCardBtn) shareCardBtn.onclick = ()=>{ closeCardShareMenu(); generateShareCard(ev, st, color); };
      const shareReelBtn = row.querySelector('[data-sharereel="1"]');
      if(shareReelBtn) shareReelBtn.onclick = ()=>{ closeCardShareMenu(); generateShareReel(ev, st, color); };
    }

    row.querySelector('[data-athlete-link="1"]').onclick = ()=>{
      showAthleteProfile(ev.athlete);
    };

    row.querySelector('[data-dup="1"]').onclick = ()=>{
      openDuplicateForm(ev);
    };

    if(compactMode || matchesMode){
      row.querySelector('[data-collapse="1"]').onclick = ()=>{
        expandedIds.delete(ev.id);
        renderTimeline();
      };
    }

    row.querySelector('[data-edit="1"]').onclick = ()=>{
      openEditForm(ev);
    };

    row.querySelector('[data-del="1"]').onclick = async ()=>{
      if(!confirm(`Eliminar a prova de "${ev.athlete}" (${ev.t})?`)) return;
      EVENTS = EVENTS.filter(x=>x.id !== ev.id);
      if(state[ev.id]) delete state[ev.id];
      // Ação dedicada: pede ao servidor para remover esta prova a sério, em vez de
      // gravar a lista sem ela (isso não chegava — o servidor "junta" provas por
      // segurança, e traria a prova eliminada de volta).
      try{
        const r = await fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ compId: activeCompId, deleteEventId: ev.id, adminPassword: getAdminPassword() })
        });
        const result = await r.json().catch(()=>null);
        if(!result || result.ok !== true){
          alert("⚠️ Não foi possível eliminar a prova: " + (result && result.error ? result.error : "erro desconhecido"));
        }
        markSynced();
      }catch(e){
        console.error("Falha ao eliminar prova:", e);
        alert("⚠️ Erro de rede ao eliminar a prova: " + e.message);
      }
      // se o dia atual ficou sem provas, escolhe outro dia válido em vez de ficar preso
      const daysLeft = getDaysPresent();
      if(!daysLeft.includes(activeDay)){
        activeDay = daysLeft.length ? daysLeft[daysLeft.length-1] : String(new Date().getDate());
        document.getElementById("dayNum").textContent = activeDay;
      }
      renderDayTabs();
      renderFilters();
      renderProgress();
      renderTimeline();
    };

    if(matchesMode && !READONLY_MODE){
      // no modo Modalidades: campo de resultado + botões de Vitória/Empate/Derrota
      // (em modo só ver não existe nada disto no cartão — ver renderReadonlyMatchResultHtml_)
      row.querySelector('.result-input').addEventListener("input", (e)=>{
        setEvLocal(ev.id, {resultado:e.target.value});
        scheduleResultSave(ev.id);
        e.target.classList.toggle("has-result", e.target.value.trim().length > 0);
      });
      row.querySelector('.result-input').addEventListener("blur", ()=> flushResultSave(ev.id));
      row.querySelectorAll('[data-restag]').forEach(btn=>{
        btn.onclick = ()=>{
          const cur = getEv(ev.id);
          const val = btn.getAttribute('data-restag');
          setEv(ev.id, {resultTag: cur.resultTag===val ? null : val});
          renderTimeline();
        };
      });
    }else if(!matchesMode && !eliminated){
      row.querySelector('[data-act="yes"]').onclick = ()=>{
        const cur = getEv(ev.id);
        setEv(ev.id, {passou: cur.passou==="yes" ? null : "yes"});
        renderTimeline();
      };
      row.querySelector('[data-act="no"]').onclick = ()=>{
        const cur = getEv(ev.id);
        setEv(ev.id, {passou: cur.passou==="no" ? null : "no"});
        renderTimeline();
      };
      row.querySelector('.result-input').addEventListener("input", (e)=>{
        setEvLocal(ev.id, {resultado:e.target.value});
        scheduleResultSave(ev.id);
        e.target.classList.toggle("has-result", e.target.value.trim().length > 0);
      });
      row.querySelector('.result-input').addEventListener("blur", ()=> flushResultSave(ev.id));
      row.querySelectorAll('[data-medal]').forEach(btn=>{
        btn.onclick = ()=>{
          const cur = getEv(ev.id);
          const val = btn.getAttribute('data-medal');
          setEv(ev.id, {medal: cur.medal===val ? null : val});
          renderTimeline();
        };
      });
    }

    container.appendChild(row);
  });
  appendNextMonthBtn();
}

// Constrói uma lista de provas espalhadas por VÁRIAS competições — usada tanto pela
// vista "Hoje (todas)" como pela pesquisa global. "filterFn" recebe (ev, compId) e
// decide se essa prova entra na lista.
