function renderCrossCompetitionList(container, filterFn, emptyMessage){
  let rows = [];
  ALL.competitions.filter(c=>!c.archived).forEach(c=>{
    const compData = ALL.data[c.id] || { events: [], status: {} };
    (compData.events || []).forEach(ev=>{
      if(filterFn(ev, c.id)){
        rows.push({ ev, compId: c.id, compName: c.name, status: (compData.status && compData.status[ev.id]) || {} });
      }
    });
  });
  rows.sort((a,b)=>{
    // provas/jogos com data completa (Modo Modalidades) ordenam pela data primeiro
    const aFullDate = /^\d{4}-\d{2}-\d{2}$/.test(a.ev.day||"");
    const bFullDate = /^\d{4}-\d{2}-\d{2}$/.test(b.ev.day||"");
    if(aFullDate && bFullDate && a.ev.day !== b.ev.day){
      return a.ev.day < b.ev.day ? -1 : 1;
    }
    return minutesOf(a.ev.t) - minutesOf(b.ev.t);
  });

  if(rows.length === 0){
    container.innerHTML = `<div class="medal-empty">${emptyMessage}</div>`;
    return;
  }

  const fullDates = rows.length && rows.every(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.ev.day||""));
  container.classList.toggle("hv-panel", !!fullDates);
  container.innerHTML = rows.map(r=>{
    const color = SPORT_COLORS[r.ev.sport] || "#e3b23c";
    const medalIcon = r.status.medal==='gold' ? '🥇' : r.status.medal==='silver' ? '🥈' : r.status.medal==='bronze' ? '🥉' : '';
    const st = r.status.passou==='yes' ? 'status-yes' : r.status.passou==='no' ? 'status-no' : '';
    const result = r.status.resultado ? r.status.resultado.trim() : '';
    const detail = [r.ev.detail, r.ev.phase].filter(Boolean).join(" · ");
    const isFullDate = /^\d{4}-\d{2}-\d{2}$/.test(r.ev.day||"");
    const dateLabel = isFullDate ? formatShortDate(r.ev.day) : '';
    const resTag = isFullDate ? getMatchResultTag(r.ev, r.status) : null;
    const resColor = resTag==='win' ? 'var(--green)' : resTag==='loss' ? 'var(--red)' : resTag==='draw' ? 'var(--text-dim)' : 'var(--accent-bright)';
    if(isFullDate){
      // Modo Modalidades: mesmo aspeto das listas do Início
      const dd = new Date(r.ev.day + "T00:00:00");
      const wd = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"][dd.getDay()];
      const tt = (typeof postTeams_ === "function") ? postTeams_(r.ev) : { home: "FC Porto", away: r.ev.athlete };
      const tagC = resTag==='win' ? ["V","win"] : resTag==='loss' ? ["D","loss"] : resTag==='draw' ? ["E","draw"] : null;
      const safe = x => String(x == null ? "" : x).replace(/[&<>"]/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
      return `<button type="button" class="hv-row" data-comp="${r.compId}" data-day="${r.ev.day}" data-ev-id="${r.ev.id}" style="--sc:${color};">
        <span class="hv-date"><b>${dd.getDate()}</b><i>${wd}</i></span>
        <span class="hv-row-body"><span class="hv-row-sport">${safe(r.ev.sport)}${detail ? " · " + safe(detail) : ""}</span><span class="hv-row-match">${result ? `${crestName_(r.ev, tt.home)} <b>${safe(result)}</b> ${crestName_(r.ev, tt.away)}` : matchTitleHtml_(r.ev) + matchNeutralTag_(r.ev)}</span></span>
        ${result ? (tagC ? `<span class="hv-tag hv-tag-${tagC[1]}">${tagC[0]}</span>` : "") : `<span class="hv-row-time">${safe(r.ev.t || "")}</span>`}
      </button>`;
    }
    return `<div class="compact-line ${st}" data-comp="${r.compId}" data-day="${r.ev.day}" data-ev-id="${r.ev.id}">
      <div class="cl-row1">
        <span class="c-time">${dateLabel ? dateLabel + ' · ' : ''}${r.ev.t}</span>
        <span class="c-sport" style="--sport-color:${color}">${r.ev.sport}</span>
        <span class="c-athlete">${r.ev.athlete}</span>
        <span class="c-medal">${medalIcon}</span>
      </div>
      <div class="cl-row2">
        <span class="c-detail">${detail}</span>
        ${result ? `<span class="c-result" style="color:${resColor};">${result}</span>` : ''}
        <span class="c-phase">${r.compName}</span>
      </div>
    </div>`;
  }).join("");

  // tocar numa linha vai diretamente a essa prova, na competição e dia certos —
  // no Modo Modalidades, abre logo o resultado/estatísticas desse jogo específico
  container.querySelectorAll("[data-comp]").forEach(line=>{
    line.onclick = async ()=>{
      const compId = line.getAttribute("data-comp");
      const day = line.getAttribute("data-day");
      const evId = line.getAttribute("data-ev-id");
      await switchToCompetition(compId);
      const isMatches = currentCompMode() === "matches";
      // no Modo Modalidades "day" é uma data completa (AAAA-MM-DD), mas os
      // separadores do calendário são por MÊS — sem isto, o separador não
      // encontrava nenhum jogo e ficava tudo em branco
      activeDay = isMatches ? day.slice(0,7) : day;
      document.getElementById("dayNum").textContent = activeDay;
      renderDayTabs();
      renderTimeline();
      setView("calendario");
      if(isMatches && evId){
        const targetEv = EVENTS.find(e => e.id === evId);
        if(targetEv){
          const hasResult = !!(getEv(evId).resultado && getEv(evId).resultado.trim());
          if(hasResult){
            // já tem resultado — vai direto às estatísticas, como sempre
            statsOpenedFromWeekView = true;
            openPlayerStatsPanel(targetEv);
          }else{
            // ainda não há resultado — fica no cartão do jogo (prognóstico,
            // transmissão, etc.), que é o que interessa antes de o jogo acontecer
            setTimeout(()=>{
              const el = document.getElementById("ev-card-" + evId);
              if(el){
                el.scrollIntoView({behavior:"smooth", block:"center"});
                el.classList.add("jump-highlight");
                setTimeout(()=> el.classList.remove("jump-highlight"), 2400);
              }
            }, 60);
          }
        }
      }
    };
  });
}

// v167: dia a dia dentro de "Esta semana" — faixa 2ª…Dom com o número de jogos de cada dia
let weekDay_ = null; // null = semana toda; 0..6 = 2ª…Domingo
function weekDayStripHtml_(weekStart){
  const nomes = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const cont = [0, 0, 0, 0, 0, 0, 0];
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    (((ALL.data[c.id] || {}).events) || []).forEach(ev=>{
      const i = Math.round((new Date((ev.day||"") + "T00:00:00") - weekStart) / 86400000);
      if(i >= 0 && i < 7) cont[i]++;
    });
  });
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const pills = nomes.map((n, i)=>{
    const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    const isHoje = d.getTime() === hoje.getTime();
    return `<button type="button" class="wd-pill${weekDay_ === i ? " active" : ""}${isHoje ? " today" : ""}${cont[i] ? " has" : ""}" data-wday="${i}"><span class="wd-n">${n}</span><span class="wd-d">${d.getDate()}</span><span class="wd-c">${cont[i] ? cont[i] : "·"}</span></button>`;
  }).join("");
  return `<div class="wd-strip"><button type="button" class="wd-pill wd-all${weekDay_ === null ? " active" : ""}" data-wday=""><span class="wd-n">Toda a</span><span class="wd-d">semana</span></button>${pills}</div>`;
}

function renderTodayAllView(){
  const inMatchesContext = currentCompMode()==="matches";
  const container = document.getElementById("todayAllView");

  if(inMatchesContext){
    // dentro de uma competição em Modo Modalidades: mostra os jogos da semana
    // escolhida (atual, anterior ou seguinte) — o "hoje" de provas não faz sentido aqui
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + (weekOffset*7)); // semana começa à 2ª feira
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekEndDisplay = new Date(weekEnd);
    weekEndDisplay.setDate(weekEnd.getDate() - 1);

    const rangeLabel = weekOffset===0 ? "Esta semana"
      : `${String(weekStart.getDate()).padStart(2,"0")}/${String(weekStart.getMonth()+1).padStart(2,"0")} – ${String(weekEndDisplay.getDate()).padStart(2,"0")}/${String(weekEndDisplay.getMonth()+1).padStart(2,"0")}`;

    // v185: a sincronização periódica volta a desenhar esta vista; não pode apagar o reel/imagem que estão abertos
    const keepBoxes_ = {};
    ["weekReelBox", "weekShareBox"].forEach(id=>{
      const el = document.getElementById(id);
      if(el && el.style.display !== "none" && el.childNodes.length && el.dataset.week === String(weekOffset)) keepBoxes_[id] = el;
    });
    container.innerHTML = `
      <div class="week-nav">
        <button class="hide-toggle" id="weekPrevBtn">‹ Anterior</button>
        <span class="week-nav-label">${rangeLabel}</span>
        <button class="hide-toggle" id="weekNextBtn">Seguinte ›</button>
      </div>
      ${weekDayStripHtml_(weekStart)}
      <div id="weekListContainer"></div>
      ${!READONLY_MODE ? `
        <div class="add-btn-row" style="margin-top:14px;">
          <button class="chip" id="weekShareBtn">🖼️ Imagem + texto para publicar</button>
          <button class="chip" id="weekReelBtn">🎬 Reel da semana</button>
        </div>
        <div id="weekShareBox" style="display:none;"></div>
        <div id="weekReelBox" style="display:none;"></div>
      ` : ''}
    `;

    renderCrossCompetitionList(
      document.getElementById("weekListContainer"),
      (ev, compId)=>{
        const comp = ALL.competitions.find(c=>c.id===compId);
        if(((comp && comp.mode) || "medals") !== "matches") return false;
        const d = new Date((ev.day||"") + "T00:00:00");
        if(weekDay_ !== null){ const i = Math.round((d - weekStart) / 86400000); if(i !== weekDay_) return false; }
        return d >= weekStart && d < weekEnd;
      },
      weekDay_ !== null ? "Sem jogos neste dia." : "Sem jogos nesta semana em nenhuma competição."
    );

    Object.keys(keepBoxes_).forEach(id=>{ const n = document.getElementById(id); if(n) n.replaceWith(keepBoxes_[id]); });
    if(window.__weekReelBusy_){ const rb = document.getElementById("weekReelBtn"); if(rb) rb.disabled = true; }
    document.getElementById("weekPrevBtn").onclick = ()=>{ weekOffset--; weekDay_ = null; renderTodayAllView(); };
    document.getElementById("weekNextBtn").onclick = ()=>{ weekOffset++; weekDay_ = null; renderTodayAllView(); };
    container.querySelectorAll("[data-wday]").forEach(b=>{ b.onclick = ()=>{ const v = b.getAttribute("data-wday"); weekDay_ = v === "" ? null : Number(v); renderTodayAllView(); }; });
    const reelBtn = document.getElementById("weekReelBtn");
    if(reelBtn) reelBtn.onclick = ()=>{ if(typeof startWeekReel_ === "function") startWeekReel_(weekStart, weekEnd, weekEndDisplay); };
    const shareBtn = document.getElementById("weekShareBtn");
    if(shareBtn){
      shareBtn.onclick = ()=>{
        const box = document.getElementById("weekShareBox");
        box.dataset.week = String(weekOffset);
        const opening = box.style.display === "none";
        box.style.display = opening ? "block" : "none";
        if(opening) renderWeekShareBox_(weekStart, weekEnd, weekEndDisplay);
      };
    }
  }else{
    // dentro de uma competição normal (Medalhas): comportamento de sempre,
    // só entre competições desse mesmo modo
    const todayNum = new Date().getDate();
    renderCrossCompetitionList(
      container,
      (ev, compId)=>{
        const comp = ALL.competitions.find(c=>c.id===compId);
        if(((comp && comp.mode) || "medals") !== "medals") return false;
        return parseInt(ev.day,10) === todayNum;
      },
      "Sem provas hoje em nenhuma competição."
    );
  }
}

// Perfil por atleta: mostra todas as provas dessa pessoa/equipa em todas as
// competições e dias, reaproveitando a mesma lista entre competições.
// Gera um ficheiro .ics para o jogo, para meter diretamente no Calendário do
// telemóvel/computador (com lembrete automático 30 min antes)
// Painel de estatísticas por jogador — guarda-se diretamente na prova (ev.playerStats),
// tal como qualquer outro campo, e sincroniza pelo mesmo caminho de sempre.
let playerStatsEditingEv = null;
let statsOpenedFromWeekView = false; // ao fechar, volta para "Esta semana" em vez de ficar no calendário

// Reúne todos os nomes de jogador já usados em qualquer jogo (de todas as
// competições em Modo Modalidades), para sugerir enquanto se escreve — evita
// "João Gomes" e "João Gómes" acabarem por engano como duas pessoas diferentes
function refreshPlayerNameSuggestions(){
  const names = new Set();
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [] };
    (compData.events || []).forEach(ev=>{
      if(Array.isArray(ev.playerStats)){
        ev.playerStats.forEach(p=>{ if(p.name) names.add(p.name); });
      }
    });
  });
  const dl = document.getElementById("playerNameSuggestions");
  if(dl){
    dl.innerHTML = Array.from(names).sort().map(n=>`<option value="${n.replace(/"/g,'&quot;')}"></option>`).join("");
  }
}

// Reúne todas as jogadoras do FC Porto já conhecidas numa modalidade (por terem
// marcado golo nalgum jogo, ou por já terem sido marcadas como "presentes" nalgum
// jogo), para a lista de presenças (👥 Quem jogou) — cresce sozinha, sem precisar
// de um "plantel" à parte para manter.
function getKnownFcpPlayers_(sport){
  const names = new Set();
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [] };
    (compData.events || []).forEach(ev=>{
      if(ev.sport !== sport) return;
      (ev.playerStats || []).forEach(p=>{ if(p.team !== "adv" && p.name) names.add(p.name); });
      (ev.presentes || []).forEach(n=>{ if(n) names.add(n); });
    });
  });
  return Array.from(names).sort();
}

// Fecha o painel de estatísticas — se foi aberto a partir de "Esta semana",
// volta para lá em vez de ficar preso no calendário
function closePlayerStatsPanel(){
  document.getElementById("playerStatsPanel").style.display = "none";
  playerStatsEditingEv = null;
  if(statsOpenedFromWeekView){
    statsOpenedFromWeekView = false;
    setView("hoje-todas");
  }
}

// Painel de escolha da pergunta de prognóstico para um jogo específico — só para
// administração (o botão que o abre já está escondido no modo só ver)
let questionEditingEv = null;

function openQuestionPanel(ev){
  questionEditingEv = ev;
  const panel = document.getElementById("questionPanel");
  panel.style.display = "block";
  renderQuestionPanel();
  panel.scrollIntoView({behavior:"smooth", block:"center"});
}

function renderQuestionPanel(){
  const ev = questionEditingEv;
  const panel = document.getElementById("questionPanel");
  if(!ev){ panel.style.display = "none"; return; }

  const templates = getQuestionTemplatesFor(ev.sport);
  const current = ev.predictionQuestion; // pode não existir

  const templatesHtml = templates.map((t,i)=>`
    <button class="chip" data-template-idx="${i}" style="text-align:left; display:block; width:100%; margin-bottom:6px; white-space:normal; padding:8px 10px;">
      ${t.type === 'simnao' ? '☑️' : t.type === 'placar' ? '🎯' : t.type === 'margem' ? '📏' : '✏️'} ${t.text}
    </button>
  `).join("");

  panel.innerHTML = `
    <div class="medal-section-title">🎯 Pergunta de prognóstico</div>
    <div style="font-size:12px; color:var(--text-dim); margin-bottom:10px;">${ev.sport} · vs ${ev.athlete || '?'}</div>
    ${current ? `<div style="background:rgba(227,178,60,0.1); border:1px solid var(--gold-dim); border-radius:8px; padding:8px 10px; margin-bottom:12px; font-size:13px; color:var(--text);">Pergunta atual: <b>${current.text}</b></div>` : ''}
    <div style="font-size:12px; color:var(--text-dim); margin-bottom:6px;">Escolhe uma pergunta-modelo:</div>
    ${templatesHtml || '<div class="medal-empty">Ainda sem perguntas-modelo para esta modalidade.</div>'}
    <div id="questionFillIn" style="margin-top:10px;"></div>
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-save" id="saveQuestionBtn" style="display:none;">Guardar</button>
      ${current ? '<button class="del-btn" id="clearQuestionBtn">Remover pergunta</button>' : ''}
      <button class="add-cancel" id="closeQuestionBtn">Fechar</button>
    </div>
    <div class="medal-section-title" style="margin-top:20px; font-size:14px;">+ Nova pergunta-modelo para ${ev.sport}</div>
    <div style="display:flex; gap:8px; margin-bottom:8px;">
      <select id="newQTypeSelect" class="gate-input" style="width:auto;">
        <option value="simnao">Sim/Não</option>
        <option value="livre">Palpite livre</option>
        <option value="placar">Resultado exato (com pontos e ranking)</option>
        <option value="margem">Vencedor e margem (com pontos e ranking)</option>
      </select>
      <input type="text" id="newQTextInput" class="gate-input" placeholder="Texto (usa {jogador} ou {numero} se precisares)" style="flex:1;">
    </div>
    <button class="add-save" id="addQTemplateBtn" style="width:100%;">+ Adicionar à lista</button>
  `;

  let selectedTemplate = null;

  function renderFillIn(){
    const fillDiv = document.getElementById("questionFillIn");
    const needsPlayer = selectedTemplate.text.includes("{jogador}");
    const needsNumber = selectedTemplate.text.includes("{numero}");
    if(needsPlayer){
      fillDiv.innerHTML = `<input type="text" id="questionFillInput" class="gate-input" placeholder="Nome do jogador" list="playerNameSuggestions" style="width:100%;">`;
    }else if(needsNumber){
      fillDiv.innerHTML = `<input type="number" id="questionFillInput" class="gate-input" placeholder="Número" style="width:100%;">`;
    }else{
      fillDiv.innerHTML = "";
    }
  }

  panel.querySelectorAll('[data-template-idx]').forEach(btn=>{
    btn.onclick = ()=>{
      const idx = parseInt(btn.getAttribute('data-template-idx'),10);
      selectedTemplate = templates[idx];
      panel.querySelectorAll('[data-template-idx]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderFillIn();
      document.getElementById("saveQuestionBtn").style.display = "inline-block";
    };
  });

  document.getElementById("saveQuestionBtn").onclick = async ()=>{
    if(!selectedTemplate) return;
    let text = selectedTemplate.text;
    const fillInput = document.getElementById("questionFillInput");
    if(fillInput){
      const val = fillInput.value.trim();
      if(!val){ alert("Preenche o espaço em branco da pergunta."); return; }
      text = text.replace("{jogador}", val).replace("{numero}", val);
    }
    // vai sempre buscar o jogo pelo ID à lista atual, nunca confia na referência
    // guardada desde que o painel abriu — essa podia já não ser a mesma que está
    // realmente em EVENTS, se uma sincronização tivesse ficado a meio nesse intervalo
    const liveEv = EVENTS.find(e=>e.id === ev.id);
    if(!liveEv){
      alert("Este jogo já não existe (pode ter sido apagado ou alterado). Fecha e tenta outra vez.");
      return;
    }
    liveEv.predictionQuestion = { type: selectedTemplate.type, text: text };
    await saveEvents();
    panel.style.display = "none";
    questionEditingEv = null;
    renderTimeline();
  };

  const clearBtn = document.getElementById("clearQuestionBtn");
  if(clearBtn) clearBtn.onclick = async ()=>{
    if(!confirm("Remover a pergunta deste jogo? Volta ao prognóstico padrão de Vitória/Empate/Derrota.")) return;
    const liveEv = EVENTS.find(e=>e.id === ev.id);
    if(liveEv) delete liveEv.predictionQuestion;
    await saveEvents();
    panel.style.display = "none";
    questionEditingEv = null;
    renderTimeline();
  };

  document.getElementById("addQTemplateBtn").onclick = ()=>{
    const type = document.getElementById("newQTypeSelect").value;
    const text = document.getElementById("newQTextInput").value.trim();
    if(!text) return;
    if(!QUESTION_TEMPLATES[ev.sport]) QUESTION_TEMPLATES[ev.sport] = [];
    QUESTION_TEMPLATES[ev.sport] = [...QUESTION_TEMPLATES[ev.sport], { type: type, text: text }];
    saveQuestionTemplates();
    renderQuestionPanel();
  };

  document.getElementById("closeQuestionBtn").onclick = ()=>{
    panel.style.display = "none";
    questionEditingEv = null;
  };
}

function openPlayerStatsPanel(ev){
  playerStatsEditingEv = ev;
  playerStatsEditMode = false; // começa sempre pela tabela
  playerStatsSortColumn = null; // volta a ordenar pela estatística principal desta modalidade
  if(!Array.isArray(ev.playerStats)) ev.playerStats = [];
  if(!Array.isArray(ev.setScores) || ev.setScores.length !== 5) ev.setScores = ["","","","",""];
  const panel = document.getElementById("playerStatsPanel");
  panel.dataset.activeTab = "todos";
  panel.style.display = "block";
  refreshPlayerNameSuggestions();
  renderPlayerStatsPanel();
  panel.scrollIntoView({behavior:"smooth", block:"center"});
}

let playerStatsEditMode = false; // false = mostra a tabela (como imaginado), true = editar jogadores
let playerStatsSortColumn = null; // qual estatística ordena a tabela (null = a principal da modalidade)

// Painel simplificado para modalidades onde só interessa quem marcou e a que minuto
// — cada linha É um golo (não um total), por isso um jogador com 2 golos aparece
// em 2 linhas separadas. Por baixo, guarda-se sempre {stats:{Golos:1}} para o
// separador "🏆 Marcadores" da época conseguir somar sozinho, sem precisar de saber
// que este jogo tem um modelo diferente dos outros.
function renderGoalScorersPanel(ev, panel, headerHtml, teamLabel){
  const goals = ev.playerStats || [];

  if(!playerStatsEditMode){
    const tabs = ["todos", "fcp", "adv"];
    if(!panel.dataset.activeTab || !tabs.includes(panel.dataset.activeTab)) panel.dataset.activeTab = "todos";
    const activeTab = panel.dataset.activeTab;

    const goalsForTab = goals.filter(g => activeTab === "todos" ? true : g.team === activeTab)
      .slice()
      .sort((a,b)=> (a.minute||0) - (b.minute||0));

    // agrupa por jogador, para um jogador com vários golos aparecer numa só linha
    const grouped = [];
    goalsForTab.forEach(g=>{
      let entry = grouped.find(x => x.name === g.name && x.team === g.team);
      if(!entry){ entry = { name: g.name, team: g.team, minutes: [] }; grouped.push(entry); }
      if(g.minute != null) entry.minutes.push(g.minute);
    });

    const listHtml = grouped.length === 0
      ? `<div class="medal-empty">Ainda sem golos registados.</div>`
      : grouped.map(g=>`
        <div class="compact-line" style="cursor:default; ${g.team==='adv' ? 'background:rgba(211,86,74,0.07);' : ''}">
          <span class="c-athlete" data-player-profile="${g.name.replace(/"/g,'&quot;')}" style="cursor:pointer; text-decoration:underline; text-decoration-style:dotted;">⚽ ${g.name}</span>
          ${activeTab==='todos' ? `<span class="c-phase">${teamLabel(g.team)}</span>` : ''}
          <span class="c-result">${g.minutes.map(m=>m+"'").join(", ") || "—"}</span>
        </div>
      `).join("");

    const temPresencas = Array.isArray(ev.presentes) && ev.presentes.length > 0;

    panel.innerHTML = `
      ${headerHtml}
      <div class="filters" style="margin-bottom:14px; display:flex;">
        <button class="chip${activeTab==='todos'?' active':''}" data-stats-tab="todos">Todos</button>
        <button class="chip${activeTab==='fcp'?' active':''}" data-stats-tab="fcp">FC Porto</button>
        <button class="chip${activeTab==='adv'?' active':''}" data-stats-tab="adv">${ev.athlete || 'Adversário'}</button>
      </div>
      ${listHtml}
      ${temPresencas ? `<div style="font-size:12px; color:var(--text-dim); margin-top:10px;">👥 ${ev.presentes.length} jogadora${ev.presentes.length===1?'':'s'} em campo neste jogo</div>` : ''}
      <div class="add-btn-row" style="margin-top:14px;">
        ${!READONLY_MODE ? '<button class="add-save" id="editPlayerStatsBtn">✏️ Editar marcadores</button>' : ''}
        <button class="add-cancel" id="closePlayerStatsBtn">Fechar</button>
      </div>
    `;

    panel.querySelectorAll('[data-stats-tab]').forEach(btn=>{
      btn.onclick = ()=>{ panel.dataset.activeTab = btn.getAttribute('data-stats-tab'); renderPlayerStatsPanel(); };
    });
    panel.querySelectorAll('[data-player-profile]').forEach(el=>{
      el.onclick = ()=> showPlayerProfile(el.getAttribute('data-player-profile'));
    });
    if(!READONLY_MODE){
      document.getElementById("editPlayerStatsBtn").onclick = ()=>{ playerStatsEditMode = true; renderPlayerStatsPanel(); };
    }
    document.getElementById("closePlayerStatsBtn").onclick = closePlayerStatsPanel;
    return;
  }

  // MODO DE EDIÇÃO — uma linha por golo: nome, equipa, minuto
  const rowsHtml = goals.map((g, idx) => `
    <div style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
      <input class="gate-input" data-goal-name="${idx}" value="${(g.name||'').replace(/"/g,'&quot;')}" placeholder="Nome do jogador" list="playerNameSuggestions" style="flex:1;">
      <select class="gate-input" data-goal-team="${idx}" style="width:auto;">
        <option value="fcp" ${g.team==='fcp'?'selected':''}>FC Porto</option>
        <option value="adv" ${g.team==='adv'?'selected':''}>${ev.athlete || 'Adversário'}</option>
      </select>
      <input class="gate-input" type="number" data-goal-minute="${idx}" value="${g.minute!=null?g.minute:''}" placeholder="Min." style="width:60px;">
      <button class="del-btn" data-remove-goal="${idx}" title="Remover">✕</button>
    </div>
  `).join("");

  // 👥 QUEM JOGOU — lista de presenças, separada dos golos. Serve para o
  // "Marcadores" da época conseguir contar jogos a sério (não só jogos em que se
  // marcou). Se este jogo ainda não tem presenças guardadas, começa com quem já
  // marcou golo pré-marcado (é o mínimo que já sabemos) — o resto acrescenta-se à mão.
  if(!Array.isArray(ev.presentes)){
    ev.presentes = Array.from(new Set(goals.filter(g=>g.team!=='adv' && g.name && g.name.trim()).map(g=>g.name.trim())));
  }
  const knownFcpPlayers = Array.from(new Set([...getKnownFcpPlayers_(ev.sport), ...ev.presentes])).sort();
  const presentesSet = new Set(ev.presentes);

  const presencasHtml = knownFcpPlayers.length === 0
    ? `<div class="medal-empty">Ainda sem jogadoras conhecidas nesta modalidade — usa "+ Adicionar golo" ou o campo abaixo primeiro.</div>`
    : `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        ${knownFcpPlayers.map(n=>`
          <label class="pres-chip${presentesSet.has(n) ? ' is-on' : ''}">
            <input type="checkbox" class="pres-cb" data-presente="${n.replace(/"/g,'&quot;')}" ${presentesSet.has(n) ? 'checked' : ''}>
            <span class="pres-mark" aria-hidden="true">${presentesSet.has(n) ? '✕' : ''}</span>
            <span class="pres-name">${n}</span>
          </label>
        `).join("")}
      </div>`;

  panel.innerHTML = `
    ${headerHtml}
    ${rowsHtml || '<div class="medal-empty">Ainda sem golos adicionados.</div>'}
    <button class="add-save" id="addGoalRowBtn" style="width:100%; margin-bottom:14px;">+ Adicionar golo</button>
    <div class="medal-section-title" style="margin-top:4px;">👥 Quem jogou</div>
    <div style="font-size:11px; color:var(--text-dim); margin:4px 0 10px;">Marca quem esteve em campo neste jogo, mesmo quem não marcou golo — é o que faz o "jogos" do Marcadores ser real.</div>
    ${presencasHtml}
    <div class="row-add" style="margin-bottom:14px;">
      <input id="novoPresenteInput" class="gate-input" placeholder="Nome de quem não está na lista" list="playerNameSuggestions" style="flex:1;">
      <button class="add-save" id="addPresenteBtn" style="white-space:nowrap;">+ Adicionar</button>
    </div>
    <div class="add-btn-row">
      <button class="add-save" id="saveGoalsBtn">Guardar</button>
      <button class="add-cancel" id="backToTableBtn">← Ver marcadores</button>
    </div>
  `;

  panel.querySelectorAll('[data-goal-name]').forEach(input=>{
    input.oninput = ()=>{ goals[parseInt(input.getAttribute('data-goal-name'),10)].name = input.value; };
  });
  panel.querySelectorAll('[data-goal-team]').forEach(select=>{
    select.onchange = ()=>{ goals[parseInt(select.getAttribute('data-goal-team'),10)].team = select.value; };
  });
  panel.querySelectorAll('[data-goal-minute]').forEach(input=>{
    input.oninput = ()=>{ goals[parseInt(input.getAttribute('data-goal-minute'),10)].minute = input.value === '' ? undefined : Number(input.value); };
  });
  panel.querySelectorAll('[data-remove-goal]').forEach(btn=>{
    btn.onclick = ()=>{
      goals.splice(parseInt(btn.getAttribute('data-remove-goal'),10),1);
      renderPlayerStatsPanel();
    };
  });

  document.getElementById("addGoalRowBtn").onclick = ()=>{
    goals.push({ name: "", team: "fcp", minute: undefined });
    renderPlayerStatsPanel();
  };

  panel.querySelectorAll('[data-presente]').forEach(cb=>{
    cb.onchange = ()=>{
      const nome = cb.getAttribute('data-presente');
      const lab = cb.closest('.pres-chip');
      if(lab){ lab.classList.toggle('is-on', cb.checked); const mk = lab.querySelector('.pres-mark'); if(mk) mk.textContent = cb.checked ? '✕' : ''; }
      if(cb.checked){ if(!ev.presentes.includes(nome)) ev.presentes.push(nome); }
      else{ ev.presentes = ev.presentes.filter(n=>n!==nome); }
    };
  });
  document.getElementById("addPresenteBtn").onclick = ()=>{
    const input = document.getElementById("novoPresenteInput");
    const nome = input.value.trim();
    if(!nome) return;
    if(!ev.presentes.includes(nome)) ev.presentes.push(nome);
    renderPlayerStatsPanel();
  };

  document.getElementById("saveGoalsBtn").onclick = async ()=>{
    ev.playerStats = goals
      .filter(g => g.name && g.name.trim())
      .map(g => ({
        name: g.name.trim(),
        team: g.team === 'adv' ? 'adv' : 'fcp',
        minute: (g.minute !== undefined && !isNaN(g.minute)) ? g.minute : undefined,
        stats: { Golos: 1 } // cada linha é sempre 1 golo — é o que faz o "Marcadores" da época somar sozinho
      }));
    // limpa nomes vazios/repetidos na lista de presenças antes de guardar
    ev.presentes = Array.from(new Set(ev.presentes.map(n=>n.trim()).filter(Boolean))).sort();
    await saveEvents();
    playerStatsEditMode = false;
    renderPlayerStatsPanel();
    renderTimeline();
  };

  document.getElementById("backToTableBtn").onclick = ()=>{
    playerStatsEditMode = false;
    renderPlayerStatsPanel();
  };
}

// VOLEIBOL: sem jogadoras, só a pontuação de cada set (até 5) — sempre os mesmos
// 5 campos, sem nada de "adicionar linha", tal como pedido
function renderSetScoresPanel(ev, panel, headerHtml){
  const sets = ev.setScores;

  if(!playerStatsEditMode){
    const filledSets = sets.map((s,i)=>({ n: i+1, score: (s||"").trim() })).filter(s=>s.score);
    const listHtml = filledSets.length === 0
      ? `<div class="medal-empty">Ainda sem pontuação de sets registada.</div>`
      : filledSets.map(s=>`
        <div class="compact-line" style="cursor:default;">
          <span class="c-athlete">${s.n}º Set</span>
          <span class="c-result">${s.score}</span>
        </div>
      `).join("");

    panel.innerHTML = `
      ${headerHtml}
      ${listHtml}
      <div class="add-btn-row" style="margin-top:14px;">
        ${!READONLY_MODE ? '<button class="add-save" id="editPlayerStatsBtn">✏️ Editar sets</button>' : ''}
        <button class="add-cancel" id="closePlayerStatsBtn">Fechar</button>
      </div>
    `;
    if(!READONLY_MODE){
      document.getElementById("editPlayerStatsBtn").onclick = ()=>{ playerStatsEditMode = true; renderPlayerStatsPanel(); };
    }
    document.getElementById("closePlayerStatsBtn").onclick = closePlayerStatsPanel;
    return;
  }

  // MODO DE EDIÇÃO — sempre os mesmos 5 campos, um por set
  const inputsHtml = [0,1,2,3,4].map(i => `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <span style="width:60px; font-size:12px; color:var(--text-dim);">${i+1}º Set:</span>
      <input class="gate-input" type="text" data-set-score="${i}" value="${(sets[i]||'').replace(/"/g,'&quot;')}" placeholder="ex: 25-20" style="flex:1;">
    </div>
  `).join("");

  panel.innerHTML = `
    ${headerHtml}
    ${inputsHtml}
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-save" id="saveSetsBtn">Guardar</button>
      <button class="add-cancel" id="backToTableBtn">← Ver pontuação</button>
    </div>
  `;

  panel.querySelectorAll('[data-set-score]').forEach(input=>{
    input.oninput = ()=>{ sets[parseInt(input.getAttribute('data-set-score'),10)] = input.value; };
  });

  document.getElementById("saveSetsBtn").onclick = async ()=>{
    ev.setScores = sets.map(s => (s||"").trim());
    await saveEvents();
    playerStatsEditMode = false;
    renderPlayerStatsPanel();
    renderTimeline();
  };

  document.getElementById("backToTableBtn").onclick = ()=>{
    playerStatsEditMode = false;
    renderPlayerStatsPanel();
  };
}

