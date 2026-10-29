function renderPlayerStatsPanel(){
  const ev = playerStatsEditingEv;
  const panel = document.getElementById("playerStatsPanel");
  if(!ev){ panel.style.display = "none"; return; }

  const players = ev.playerStats || [];
  const teamLabel = t => t === "fcp" ? "FC Porto" : (ev.athlete || "Adversário");
  const evStatus = getEv(ev.id); // o resultado e o resultTag vivem aqui, não em "ev" diretamente

  // só entram nas colunas as estatísticas realmente usadas por algum jogador deste
  // jogo — evita uma tabela cheia de colunas vazias
  const statsUsed = [];
  getStatTypesFor(ev.sport).forEach(stat=>{
    if(players.some(p => p.stats && p.stats[stat] != null)) statsUsed.push(stat);
  });
  const columns = statsUsed.length ? statsUsed : getStatTypesFor(ev.sport);

  const headerHtml = `
    <div style="margin-bottom:12px;">
      <div style="font-size:13px; color:var(--text-dim);">${ev.sport}${ev.detail ? ' · '+ev.detail : ''}</div>
      <div style="font-size:20px; font-weight:700; color:var(--text); font-family:'Archivo Narrow',sans-serif;">
        ${ev.local === 'fora' ? `${ev.athlete || ''} ${evStatus.resultado ? evStatus.resultado.trim() : '– : –'} FC Porto` : `FC Porto ${evStatus.resultado ? evStatus.resultado.trim() : '– : –'} ${ev.athlete || ''}`}
      </div>
    </div>
  `;

  // MODALIDADES SÓ DE GOLOS (Futebol Feminino, Futsal, Equipa B): cada linha é um
  // golo (jogador + minuto), não um total — se um jogador marcar 2, entra 2 vezes
  if(MARCADORES_LABEL_SPORTS.has(ev.sport)){
    return renderGoalScorersPanel(ev, panel, headerHtml, teamLabel);
  }

  // VOLEIBOL: sem estatísticas de jogadoras nenhumas — só a pontuação de cada set
  if(SET_SCORE_SPORTS.has(ev.sport)){
    return renderSetScoresPanel(ev, panel, headerHtml);
  }

  if(!playerStatsEditMode){
    // VISTA EM TABELA — tal como imaginado: separadores Todos/FC Porto/Adversário
    const tabs = ["todos", "fcp", "adv"];
    if(!panel.dataset.activeTab || !tabs.includes(panel.dataset.activeTab)) panel.dataset.activeTab = "todos";
    const activeTab = panel.dataset.activeTab;

    const rowsForTab = players.filter(p=>{
      if(activeTab === "todos") return true;
      return p.team === activeTab;
    });

    // ordena sempre por uma estatística — por defeito a principal da modalidade
    // (a primeira da lista), mas qualquer coluna pode ser escolhida ao tocar nela
    const sortCol = (playerStatsSortColumn && columns.includes(playerStatsSortColumn)) ? playerStatsSortColumn : columns[0];
    if(sortCol){
      rowsForTab.sort((a,b)=>{
        const av = (a.stats && a.stats[sortCol] != null) ? a.stats[sortCol] : -Infinity;
        const bv = (b.stats && b.stats[sortCol] != null) ? b.stats[sortCol] : -Infinity;
        return bv - av;
      });
    }

    const tableHtml = rowsForTab.length === 0
      ? `<div class="medal-empty">Sem ${gJog_(ev.sport,true)} aqui ainda.</div>`
      : `<div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:12px; white-space:nowrap;">
            <thead>
              <tr style="border-bottom:1px solid var(--line);">
                <th style="text-align:left; padding:6px 8px; color:var(--text-dim);">JOGADOR</th>
                ${activeTab==="todos" ? '<th style="text-align:left; padding:6px 8px; color:var(--text-dim);">EQUIPA</th>' : ''}
                ${columns.map(c=>`<th data-sort-col="${c.replace(/"/g,'&quot;')}" style="text-align:center; padding:6px 8px; color:${c===sortCol?'var(--text)':'var(--text-dim)'}; background:${c===sortCol?'rgba(227,178,60,0.18)':'transparent'}; border-radius:4px; cursor:pointer; user-select:none;">${c.toUpperCase()}${c===sortCol?' ▼':''}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rowsForTab.map(p=>`
                <tr style="border-bottom:1px solid rgba(255,255,255,0.06); ${p.team==='adv' ? 'background:rgba(211,86,74,0.07);' : ''}">
                  <td data-player-profile="${p.name.replace(/"/g,'&quot;')}" style="padding:6px 8px; color:var(--text); font-weight:600; cursor:pointer; text-decoration:underline; text-decoration-style:dotted;">${p.name}</td>
                  ${activeTab==="todos" ? `<td style="padding:6px 8px; color:var(--text-dim);">${teamLabel(p.team)}</td>` : ''}
                  ${columns.map(c=>`<td style="text-align:center; padding:6px 8px; color:${c===sortCol?'var(--text)':'var(--text-dim)'}; font-weight:${c===sortCol?'700':'400'};">${(p.stats && p.stats[c]!=null) ? p.stats[c] : '–'}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`;

    const temPresencas = Array.isArray(ev.presentes) && ev.presentes.length > 0;

    panel.innerHTML = `
      ${headerHtml}
      <div class="filters" style="margin-bottom:12px; display:flex;">
        <button class="chip${activeTab==='todos'?' active':''}" data-stats-tab="todos">Todos</button>
        <button class="chip${activeTab==='fcp'?' active':''}" data-stats-tab="fcp">FC Porto</button>
        <button class="chip${activeTab==='adv'?' active':''}" data-stats-tab="adv">${ev.athlete || 'Adversário'}</button>
      </div>
      ${tableHtml}
      ${temPresencas ? `<div style="font-size:12px; color:var(--text-dim); margin-top:10px;">👥 ${ev.presentes.length} ${gJog_(ev.sport, ev.presentes.length!==1)} em campo neste jogo</div>` : ''}
      <div class="add-btn-row" style="margin-top:14px;">
        ${!READONLY_MODE ? `<button class="add-save" id="editPlayerStatsBtn">✏️ Editar ${gJog_(ev.sport,true)}</button>` : ''}
        <button class="add-cancel" id="closePlayerStatsBtn">Fechar</button>
      </div>
    `;

    panel.querySelectorAll('[data-stats-tab]').forEach(btn=>{
      btn.onclick = ()=>{ panel.dataset.activeTab = btn.getAttribute('data-stats-tab'); renderPlayerStatsPanel(); };
    });
    panel.querySelectorAll('[data-sort-col]').forEach(th=>{
      th.onclick = ()=>{ playerStatsSortColumn = th.getAttribute('data-sort-col'); renderPlayerStatsPanel(); };
    });
    panel.querySelectorAll('[data-player-profile]').forEach(td=>{
      td.onclick = ()=> showPlayerProfile(td.getAttribute('data-player-profile'));
    });
    if(!READONLY_MODE){
      document.getElementById("editPlayerStatsBtn").onclick = ()=>{ playerStatsEditMode = true; renderPlayerStatsPanel(); };
    }
    document.getElementById("closePlayerStatsBtn").onclick = closePlayerStatsPanel;
    return;
  }

  // MODO DE EDIÇÃO — um "cartão" por jogador, com nome, equipa e estatísticas
  const statNames = getStatTypesFor(ev.sport);

  const rowsHtml = players.map((p, idx) => `
    <div style="border:1px solid var(--line); border-radius:8px; padding:10px; margin-bottom:8px;">
      <div style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
        <input class="gate-input" data-player-name="${idx}" value="${(p.name||'').replace(/"/g,'&quot;')}" placeholder="Nome ${FEM_PLAYER_SPORTS.has(ev.sport)?"da":"do"} ${gJog_(ev.sport,false)}" list="playerNameSuggestions" style="flex:1;">
        <select class="gate-input" data-player-team="${idx}" style="width:auto;">
          <option value="fcp" ${p.team==='fcp'?'selected':''}>FC Porto</option>
          <option value="adv" ${p.team==='adv'?'selected':''}>${ev.athlete || 'Adversário'}</option>
        </select>
        <button class="del-btn" data-remove-player="${idx}" title="Remover ${gJog_(ev.sport,false)}">✕</button>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${statNames.map(stat => `
          <div style="display:flex; align-items:center; gap:4px;">
            <span style="font-size:11px; color:var(--text-dim); white-space:nowrap;">${stat}:</span>
            <input class="gate-input" type="number" data-player-stat="${idx}|${stat.replace(/"/g,'&quot;')}" value="${(p.stats && p.stats[stat]!=null) ? p.stats[stat] : ''}" style="width:64px; padding:4px 6px;">
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");

  // 👥 QUEM JOGOU — lista de presenças, separada das fichas de estatísticas. Serve
  // para contar "jogos" a sério mesmo para quem joga mas não tem estatísticas
  // registadas (suplente, pouco tempo em campo, etc.) sem obrigar a criar-lhe uma
  // ficha vazia. Se este jogo ainda não tem presenças guardadas, começa com quem
  // já tem ficha (é o mínimo que já sabemos) — o resto acrescenta-se à mão.
  if(!Array.isArray(ev.presentes)){
    ev.presentes = Array.from(new Set(players.filter(p=>p.team!=='adv' && p.name && p.name.trim()).map(p=>p.name.trim())));
  }
  const knownFcpPlayers = Array.from(new Set([...getKnownFcpPlayers_(ev.sport), ...ev.presentes])).sort();
  const presentesSet = new Set(ev.presentes);

  const presencasHtml = knownFcpPlayers.length === 0
    ? `<div class="medal-empty">Ainda sem ${gJog_(ev.sport,true)} conhecid${FEM_PLAYER_SPORTS.has(ev.sport)?"a":"o"}s nesta modalidade — usa "+ Adicionar ${gJog_(ev.sport,false)}" ou o campo abaixo primeiro.</div>`
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
    ${rowsHtml || `<div class="medal-empty">Ainda sem ${gJog_(ev.sport,true)} adicionad${FEM_PLAYER_SPORTS.has(ev.sport)?"a":"o"}s.</div>`}
    <button class="add-save" id="addPlayerRowBtn" style="width:100%; margin-bottom:10px;">+ Adicionar ${gJog_(ev.sport,false)}</button>
    <div style="font-size:11px; color:var(--text-dim); margin-bottom:6px;">Estatísticas de ${ev.sport} (toca no ✕ para remover uma que não precises):</div>
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
      ${statNames.map(s=>`<span class="chip" style="cursor:default; display:inline-flex; align-items:center; gap:6px;">${s} <span data-remove-stattype="${s.replace(/"/g,'&quot;')}" style="cursor:pointer; opacity:0.75; font-weight:700;">✕</span></span>`).join("")}
    </div>
    <div class="row-add" style="margin-bottom:14px;">
      <input id="newStatTypeInput" class="gate-input" placeholder="Nova estatística (ex: Cartões)" style="flex:1;">
      <button class="add-save" id="addStatTypeBtn" style="white-space:nowrap;">+ Nova estatística</button>
    </div>
    <div class="medal-section-title" style="margin-top:4px;">👥 Quem jogou</div>
    <div style="font-size:11px; color:var(--text-dim); margin:4px 0 10px;">Marca quem esteve em campo neste jogo, mesmo quem não tem estatísticas registadas — é o que faz o "jogos" do Marcadores ser real.</div>
    ${presencasHtml}
    <div class="row-add" style="margin-bottom:14px;">
      <input id="novoPresenteInput" class="gate-input" placeholder="Nome de quem não está na lista" list="playerNameSuggestions" style="flex:1;">
      <button class="add-save" id="addPresenteBtn" style="white-space:nowrap;">+ Adicionar</button>
    </div>
    <div class="add-btn-row">
      <button class="add-save" id="savePlayerStatsBtn">Guardar</button>
      <button class="add-cancel" id="backToTableBtn">← Ver tabela</button>
    </div>
  `;

  panel.querySelectorAll('[data-remove-stattype]').forEach(btn=>{
    btn.onclick = ()=>{
      const stat = btn.getAttribute('data-remove-stattype');
      if(!confirm(`Remover "${stat}" das estatísticas de ${ev.sport}? Isto não apaga valores já guardados noutros jogos, só deixa de aparecer para preencher.`)) return;
      STAT_TYPES[ev.sport] = (STAT_TYPES[ev.sport] || []).filter(s => s !== stat);
      saveStatTypes();
      renderPlayerStatsPanel();
    };
  });

  panel.querySelectorAll('[data-player-name]').forEach(input=>{
    input.oninput = ()=>{
      const idx = parseInt(input.getAttribute('data-player-name'),10);
      ev.playerStats[idx].name = input.value;
    };
  });
  panel.querySelectorAll('[data-player-team]').forEach(select=>{
    select.onchange = ()=>{
      const idx = parseInt(select.getAttribute('data-player-team'),10);
      ev.playerStats[idx].team = select.value;
    };
  });
  panel.querySelectorAll('[data-player-stat]').forEach(input=>{
    input.oninput = ()=>{
      const [idx, stat] = input.getAttribute('data-player-stat').split('|');
      const i = parseInt(idx,10);
      if(!ev.playerStats[i].stats) ev.playerStats[i].stats = {};
      ev.playerStats[i].stats[stat] = input.value === '' ? undefined : Number(input.value);
    };
  });
  panel.querySelectorAll('[data-remove-player]').forEach(btn=>{
    btn.onclick = ()=>{
      const idx = parseInt(btn.getAttribute('data-remove-player'),10);
      ev.playerStats.splice(idx,1);
      renderPlayerStatsPanel();
    };
  });

  document.getElementById("addPlayerRowBtn").onclick = ()=>{
    ev.playerStats.push({ name: "", team: "fcp", stats: {} });
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

  document.getElementById("addStatTypeBtn").onclick = ()=>{
    const name = document.getElementById("newStatTypeInput").value.trim();
    if(!name) return;
    if(!STAT_TYPES[ev.sport]) STAT_TYPES[ev.sport] = [];
    if(!STAT_TYPES[ev.sport].includes(name)){
      STAT_TYPES[ev.sport] = [...STAT_TYPES[ev.sport], name];
      saveStatTypes();
    }
    renderPlayerStatsPanel();
  };

  document.getElementById("savePlayerStatsBtn").onclick = async ()=>{
    // limpa jogadores sem nome, e estatísticas vazias
    ev.playerStats = ev.playerStats
      .filter(p => p.name && p.name.trim())
      .map(p => {
        const cleanStats = {};
        Object.keys(p.stats || {}).forEach(k=>{ if(p.stats[k] !== undefined && !isNaN(p.stats[k])) cleanStats[k] = p.stats[k]; });
        return { name: p.name.trim(), team: p.team === 'adv' ? 'adv' : 'fcp', stats: cleanStats };
      });
    // limpa nomes vazios/repetidos na lista de presenças antes de guardar
    ev.presentes = Array.from(new Set(ev.presentes.map(n=>n.trim()).filter(Boolean))).sort();
    await saveEvents();
    playerStatsEditMode = false; // depois de guardar, volta à tabela
    renderPlayerStatsPanel();
    renderTimeline(); // atualiza o resumo "📊 X jogadores" no cartão
  };

  document.getElementById("backToTableBtn").onclick = ()=>{
    playerStatsEditMode = false;
    renderPlayerStatsPanel();
  };
}

// Backup manual — descarrega tudo (competições, jogos, estatísticas, ligações)
// num único ficheiro, para nunca depender só da Google Sheet
document.getElementById("exportAllBtn").onclick = ()=>{
  const backup = {
    exportedAt: new Date().toISOString(),
    competitions: ALL.competitions,
    data: ALL.data,
    sportLinks: SPORT_LINKS,
    statTypes: STAT_TYPES
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `backup-competicoes-resultados-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

function downloadMatchICS(ev){
  const start = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
  if(isNaN(start)){ alert("Não foi possível calcular a data deste jogo."); return; }
  const end = new Date(start.getTime() + 90*60000); // assume 90 min de duração
  function fmt(d){ return d.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z"; }
  const local = localLabel(ev.local);
  const title = `${ev.sport}: FC Porto vs ${ev.athlete} (${local})`;
  const desc = [ev.detail, ev.phase, ev.notes].filter(Boolean).join(" — ");
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CompeticoesInternacionais//PT","BEGIN:VEVENT",
    "UID:" + ev.id + "@competicoesinternacionais",
    "DTSTAMP:" + fmt(new Date()),
    "DTSTART:" + fmt(start),
    "DTEND:" + fmt(end),
    "SUMMARY:" + title,
    "DESCRIPTION:" + desc,
    ...(ev.venue ? ["LOCATION:" + ev.venue] : []),
    "BEGIN:VALARM","TRIGGER:-PT30M","ACTION:DISPLAY","DESCRIPTION:Lembrete de jogo","END:VALARM",
    "END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = title.replace(/[^a-z0-9]+/gi, "_") + ".ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showAthleteProfile(name){
  const fromSnap_ = (typeof navSnap_ === "function") ? navSnap_() : null, fromStack_ = (typeof navStack_ !== "undefined") ? navStack_.slice() : []; // v203: para o "Voltar" regressar à página anterior
  setView("hoje-todas");
  profileAthlete = name; // marca que a ficha está ativa, para a sincronização não a substituir sozinha
  document.getElementById("viewTodayAllBtn").classList.remove("active");
  const box = document.getElementById("todayAllView");

  // Se esta pessoa/equipa for um adversário do Modo Modalidades, mostra logo o
  // registo direto (V/E/D) contra ela, juntando todas as competições desse modo
  let h2hHtml = "";
  let w=0, d=0, l=0, games=0;
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [], status: {} };
    (compData.events || []).forEach(ev=>{
      if(ev.athlete !== name) return;
      const r = getMatchResultTag(ev, (compData.status && compData.status[ev.id]) || {});
      if(!r) return;
      games++;
      if(r==="win") w++; else if(r==="draw") d++; else if(r==="loss") l++;
    });
  });
  if(games > 0){
    h2hHtml = `<div class="medal-empty" style="text-align:left; margin-bottom:12px;">🆚 Registo direto: ${games} jogo${games===1?'':'s'} — ${w}V ${d}E ${l}D</div>`;
  }

  box.innerHTML = `
    <button class="add-cancel" id="backFromProfileBtn" style="margin-bottom:12px;">← Voltar</button>
    <div class="medal-section-title">👤 ${name}</div>
    ${h2hHtml}
    <div id="athleteProfileList"></div>
  `;
  renderCrossCompetitionList(
    document.getElementById("athleteProfileList"),
    (ev, compId)=>{
      if(ev.athlete !== name) return false;
      if(READONLY_MODE){
        const comp = ALL.competitions.find(c=>c.id===compId);
        if(!comp || (comp.mode||"medals") !== "matches") return false;
      }
      return true;
    },
    "Sem provas encontradas para esta pessoa/equipa."
  );
  document.getElementById("backFromProfileBtn").onclick = ()=>{ if(fromSnap_ && fromSnap_.view !== "hoje-todas"){ navStack_ = fromStack_; navRestore_(fromSnap_); } else setView("calendario"); };
}

function renderGlobalSearchView(){
  const q = searchQuery.trim().toLowerCase();
  renderCrossCompetitionList(
    document.getElementById("todayAllView"),
    (ev, compId)=>{
      if(q !== "" && !ev.athlete.toLowerCase().includes(q)) return false;
      if(READONLY_MODE){
        const comp = ALL.competitions.find(c=>c.id===compId);
        if(!comp || (comp.mode||"medals") !== "matches") return false;
      }
      return true;
    },
    q ? "Nenhuma prova encontrada em nenhuma competição." : "Escreve um nome para procurar em todas as competições."
  );
}

let historyFilterMonth = "Todos"; // v213: filtro por mês (AAAA-MM) no Histórico
let historyFilterSport = "Todos"; // filtro de modalidade dentro do separador Histórico

// Painel para editar (neste dispositivo) o link da classificação geral de cada
// modalidade, e para acrescentar modalidades novas com o seu próprio link.
// Reúne as modalidades REALMENTE usadas em provas do Modo Modalidades (de todas as
// competições nesse modo). Acrescenta as que faltam e remove as que não pertencem
// lá (modalidades do outro modo misturadas por engano numa tentativa anterior).
function cleanupSportLinks(){
  // separa o que é USADO A SÉRIO em cada modo, para só remover uma modalidade
  // quando temos a certeza de que pertence ao Modo Medalhas — nunca só porque
  // ainda não foi usada (senão apagava-se a modalidade acabada de criar)
  const usedInMatches = new Set();
  const usedInMedals = new Set();
  ALL.competitions.forEach(c=>{
    const mode = c.mode || "medals";
    const compData = ALL.data[c.id] || { events: [] };
    (compData.events || []).forEach(ev=>{
      if(!ev.sport) return;
      if(mode === "matches") usedInMatches.add(ev.sport);
      else usedInMedals.add(ev.sport);
    });
  });

  let changed = false;
  usedInMatches.forEach(sport=>{
    if(!(sport in SPORT_LINKS)){ SPORT_LINKS[sport] = ""; changed = true; }
  });
  Object.keys(SPORT_LINKS).forEach(sport=>{
    if(!(sport in DEFAULT_SPORT_LINKS) && !usedInMatches.has(sport) && usedInMedals.has(sport)){
      delete SPORT_LINKS[sport];
      changed = true;
    }
  });
  if(changed) saveSportLinks(); // grava a sério (sincroniza também com o outro dispositivo)
  return changed;
}

// Deteta browsers automáticos (robôs de monitorização/SEO, testes automatizados,
// etc.) — nunca uma pessoa a sério. Isto evita que apareçam no registo de acessos
// visitas "(sem nome)" exatamente à mesma hora todas as noites, de serviços que
// verificam se o site está no ar a abrir a página com um browser a sério (por
// isso executam o JavaScript todo, ao contrário de um pedido HTTP simples).
// navigator.webdriver é o sinal mais fiável — fica a "true" em qualquer browser
// controlado por automação (Selenium, Playwright, Puppeteer, e a maioria das
// ferramentas de monitorização "com browser a sério"); o resto dos nomes é só
// para apanhar os casos mais comuns que não o ligam.
function isLikelyBot_(){
  try{
    if(navigator.webdriver) return true;
    const ua = (navigator.userAgent || "").toLowerCase();
    const BOT_UA_HINTS = [
      "headless", "bot", "spider", "crawl", "slurp", "lighthouse", "pagespeed",
      "pingdom", "uptimerobot", "statuscake", "site24x7", "gtmetrix",
      "ahrefsbot", "semrushbot", "mj12bot", "dotbot", "petalbot", "bytespider",
      "facebookexternalhit", "whatsapp", "telegrambot", "google-inspectiontool"
    ];
    return BOT_UA_HINTS.some(hint => ua.includes(hint));
  }catch(e){ return false; }
}

// Regista um acesso (nome + hora) no servidor — com um pequeno "amortecedor" para
// não repetir o registo se a mesma pessoa, no mesmo aparelho, abrir várias vezes
// seguidas em pouco tempo.
// tipos de registo que são cliques em botões (não são visitas) — nunca ficam de fora
// por causa do "amortecedor" de 30 min, e não contam como visitas nas contagens
const CLICK_LOG_TYPES = ["support_click", "facebook_click", "instagram_click", "install_click"];
function logVisit(name, type){
  if(isLikelyBot_()) return; // nunca regista visitas de browsers automáticos
  // as instalações, o "aviso apareceu" e os cliques em "Apoiar o projeto" nunca
  // ficam de fora por causa do "amortecedor" de 30 min — isso só serve para não
  // repetir VISITAS seguidas; um clique no botão de apoio é sempre relevante
  if(type !== "install" && type !== "gate_shown" && CLICK_LOG_TYPES.indexOf(type) === -1){
    let last = 0;
    try{ last = parseInt(localStorage.getItem("dia22-last-visit-log") || "0", 10); }catch(e){}
    if(Date.now() - last < 30*60*1000) return; // já registado há menos de 30 min
    try{ localStorage.setItem("dia22-last-visit-log", String(Date.now())); }catch(e){}
  }
  // usa a permissão REAL do browser (persiste entre sessões), não a variável
  // notificationsEnabled — essa começa sempre a false a cada carregamento da página
  const notify = ("Notification" in window) && Notification.permission === "granted";
  fetch(STORE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ logVisit: { name: name, t: new Date().toISOString(), type: type || "visit", notify: notify } })
  }).catch(()=>{});
}

// Regista quando alguém instala a PWA (só funciona em Chrome/Edge — o Safari do
// iPhone não avisa os sites disso, é uma limitação do próprio iOS)
window.addEventListener("appinstalled", ()=>{
  let name = CURRENT_VIEWER_NAME;
  if(!name){
    try{
      const savedAdmin = JSON.parse(localStorage.getItem("dia22-admin-auth") || "null");
      if(savedAdmin && savedAdmin.name) name = savedAdmin.name;
    }catch(e){}
  }
  logVisit(name || "Desconhecido", "install");
});

// Bloqueia a app com um ecrã de password até a pessoa introduzir uma password válida
// (ou já ter uma guardada neste aparelho de uma vez anterior). Só é chamada quando o
// link é de "só ver" e existem passwords configuradas.
// Quem só vê regista-se sozinho, só com o nome — sem password nenhuma, é só para
// aparecer no registo de acessos, não é controlo de acesso a sério.
// Descobre o nome de quem está a usar a app agora — quer seja alguém em modo
// "só ver" (CURRENT_VIEWER_NAME) quer seja um admin autenticado em /edicao.
function getCurrentPersonName(){
  if(CURRENT_VIEWER_NAME) return CURRENT_VIEWER_NAME;
  try{
    const saved = JSON.parse(localStorage.getItem("dia22-admin-auth") || "null");
    if(saved && saved.name) return saved.name;
  }catch(e){}
  // antes de a app confirmar os dados com o servidor, CURRENT_VIEWER_NAME ainda
  // não está pronta — mas o nome já pode estar guardado neste aparelho de uma
  // visita anterior, por isso vale a pena verificar aqui também (sem isto, o
  // registo das notificações, que corre logo ao abrir, gravava sempre "?")
  try{
    const savedViewer = localStorage.getItem("dia22-viewer-name");
    if(savedViewer && savedViewer.trim()) return savedViewer.trim();
  }catch(e){}
  return null;
}

// A password de admin guardada neste aparelho, para incluir em pedidos que o
// servidor agora exige estarem autenticados (ver apps-script v55) — sem isto,
// qualquer pedido de admin seria recusado.
function getAdminPassword(){
  try{
    const saved = JSON.parse(localStorage.getItem("dia22-admin-auth") || "null");
    if(saved && saved.password) return saved.password;
  }catch(e){}
  return null;
}

// Mensagem de boas-vindas + resumo do site, mostrada a TODA A GENTE que entra —
// uma única vez por aparelho (versionada, tal como as novidades: se um dia
// quiseres mostrar outra vez a toda a gente, basta subir o INTRO_VERSION).
const INTRO_VERSION = "v3";
// Uma frase extra, só quando se sabe de onde a pessoa veio (Instagram/Facebook/
// Reddit) — não muda nada para quem chega por link direto, Google, ou sem referrer
// nenhum (a maioria, por partilhas em apps como o WhatsApp).
function getReferrerGreeting_(){
  let ref = "";
  try{ ref = (document.referrer || "").toLowerCase(); }catch(e){}
  if(!ref) return "";
  if(ref.includes("instagram.com")) return "Vindo do Instagram? ";
  if(ref.includes("facebook.com")) return "Vindo do Facebook? ";
  if(ref.includes("reddit.com")) return "Vindo do Reddit? ";
  return "";
}
function maybeShowIntro(){
  let seen = null;
  try{ seen = localStorage.getItem("dia22-intro-seen"); }catch(e){}
  if(seen === INTRO_VERSION) return false;
  const name = getCurrentPersonName();
  const overlay = document.getElementById("introOverlay");
  const refGreeting = getReferrerGreeting_();
  document.getElementById("introContent").innerHTML = `
    <div style="font-size:17px; font-weight:700; margin-bottom:10px;">👋 ${name ? `Olá ${name}!` : 'Olá!'} Bem-vindo ao Dragão Stats.</div>
    <p>${refGreeting}Aqui tens o calendário, os resultados e as estatísticas dos jogos do FC Porto nas várias modalidades, num só sítio. Reage aos resultados e arrisca prognósticos.</p>
  `;
  overlay.style.display = "flex";
  return true;
}
document.getElementById("introCloseBtn").onclick = ()=>{
  document.getElementById("introOverlay").style.display = "none";
  try{ localStorage.setItem("dia22-intro-seen", INTRO_VERSION); }catch(e){}
};
// Toast genérico, para avisos pontuais (ex: resposta a um reporte) — sem limite
// de "uma vez por dia", ao contrário do modal de boas-vindas.
function showToast(msg){
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style.cssText = "position:fixed; bottom:calc(20px + var(--bn-h, 0px)); left:50%; transform:translateX(-50%); background:var(--panel); border:1px solid var(--gold-dim); color:var(--text); padding:10px 18px; border-radius:10px; font-size:13px; z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,0.3); max-width:90%; text-align:center;";
  document.body.appendChild(toast);
  setTimeout(()=>{
    toast.style.transition = "opacity 0.5s";
    toast.style.opacity = "0";
    setTimeout(()=>toast.remove(), 500);
  }, 4500);
}

function ensureViewerRegistered(){
  return new Promise((resolve)=>{
    let saved = null;
    try{ saved = localStorage.getItem("dia22-viewer-name"); }catch(e){}
    if(saved && saved.trim()){
      CURRENT_VIEWER_NAME = saved.trim();
      logVisit(CURRENT_VIEWER_NAME);
      resolve();
      return;
    }
    const overlay = document.getElementById("viewerGateOverlay");
    overlay.style.display = "flex";
    logVisit("(sem nome)", "gate_shown"); // regista que o aviso apareceu a alguém que ainda não tinha nome guardado — para perceber quantos desistem antes de escrever o nome
    const submit = async ()=>{
      const typed = document.getElementById("viewerPasswordInput").value.trim();
      if(!typed){
        document.getElementById("viewerGateError").style.display = "block";
        return;
      }
      const btn = document.getElementById("viewerGateSubmit");
      btn.disabled = true;
      let name = typed;
      try{
        const r = await fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ claimViewerName: { name: typed } })
        });
        const result = await r.json().catch(()=>null);
        if(result && result.ok === true && result.assignedName) name = result.assignedName;
        // se o pedido falhar (sem rede, etc.), segue com o nome tal e qual foi
        // escrito — mais vale a pessoa entrar do que ficar presa aqui
      }catch(e){ /* ver comentário acima */ }
      try{ localStorage.setItem("dia22-viewer-name", name); }catch(e){}
      overlay.style.display = "none";
      CURRENT_VIEWER_NAME = name;
      logVisit(name);
      btn.disabled = false;
      resolve();
    };
    document.getElementById("viewerGateSubmit").onclick = submit;
    document.getElementById("viewerPasswordInput").addEventListener("keydown", (e)=>{
      if(e.key === "Enter") submit();
    });
  });
}

// Bloqueia o modo de EDIÇÃO com uma password de administração — impede que alguém
// tire o "?view=readonly" do link e fique com acesso total sem pedir nada.
const PRIVACY_HTML = `
  <div class="medal-section-title">🔒 Política de Privacidade</div>
  <p style="margin:10px 0 14px; font-size:13px; color:var(--text-dim);">Esta é uma app de adeptos, sem qualquer ligação oficial ao FC Porto — um projeto pessoal, sem fins lucrativos, gerido por Fernando Silva e pelo seu irmão.</p>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">Responsável pelo tratamento dos dados: Fernando Silva — contacto: <a href="mailto:dragaostats@gmail.com" style="color:var(--gold-dim);">dragaostats@gmail.com</a></p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">O que guardamos no teu telemóvel/computador</p>
  <ul style="margin:0 0 14px; padding-left:18px; font-size:13px; color:var(--text-dim);">
    <li>O teu nome, se acederes pelo link "só ver" — para sabermos quem visita, e para não teres de o escrever sempre</li>
    <li>Preferências simples: tema claro/escuro, competição que preferes ver primeiro</li>
    <li>Nada disto é enviado a empresas de publicidade, nem usado para te seguir por outros sites. Não há cookies de publicidade nem de análise (tipo Google Analytics)</li>
  </ul>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">O que guardamos nos nossos registos</p>
  <ul style="margin:0 0 14px; padding-left:18px; font-size:13px; color:var(--text-dim);">
    <li>Nome e data/hora de cada acesso pelo link "só ver" (o nome é o que a pessoa escrever, sem verificação de identidade)</li>
    <li>Bugs e sugestões reportadas: nome (opcional) e a mensagem enviada</li>
    <li>Email, só se te inscreveres no resumo semanal — usado exclusivamente para te enviar esse email; nunca é partilhado, vendido, nem usado para outro fim, e nunca passa por serviços de terceiros de email marketing (Mailchimp, E-goi, etc.) — é enviado diretamente pelo nosso Gmail. A base legal é o teu consentimento explícito (pedimos confirmação por email antes de começares a receber). Guardamos o teu email enquanto estiveres inscrito — assim que cancelares, é apagado dos nossos registos. Podes cancelar a qualquer momento através do link no fim de cada email, ou pedindo-nos diretamente</li>
  </ul>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">Estes registos existem só para percebermos como a app está a ser usada e para corrigirmos problemas — nunca são vendidos, partilhados, nem usados para outro fim. Toda a informação fica guardada na infraestrutura da Google (Google Sheets/Apps Script/Gmail), a mesma que suporta o funcionamento técnico do site.</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">Estatísticas de utilização</p>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">Para percebermos, de forma agregada, quantas pessoas visitam o site e que páginas veem, usamos o Cloudflare Web Analytics (o Cloudflare é também quem aloja o site). Não usa cookies, não guarda nada no teu aparelho, não cria perfis nem te segue por outros sites, e nunca é associado ao teu nome. As visitas de administração não são contadas.</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">Os teus direitos</p>
  <p style="margin:0 0 6px; font-size:13px; color:var(--text-dim);">Podes, a qualquer momento, exercer os seguintes direitos sobre os dados que temos sobre ti: acesso, retificação, apagamento, limitação do tratamento, portabilidade, e retirar o consentimento dado (sem afetar a licitude do que já tenha sido feito antes disso). Para exercer qualquer um destes direitos, usa o botão "🐛 Reportar um bug ou sugestão" para nos contactares, ou escreve para <a href="mailto:dragaostats@gmail.com" style="color:var(--gold-dim);">dragaostats@gmail.com</a>.</p>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">Se achares que os teus dados não estão a ser tratados corretamente, tens também o direito de apresentar uma reclamação à autoridade de controlo nacional — em Portugal, a <a href="https://www.cnpd.pt" target="_blank" rel="noopener" style="color:var(--gold-dim);">CNPD (Comissão Nacional de Proteção de Dados)</a>.</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">Alterações</p>
  <p style="margin:0; font-size:13px; color:var(--text-dim);">Este texto pode ser atualizado; havendo uma mudança relevante, avisamos através do popup de novidades da app.</p>
`;

document.getElementById("privacyBtn").onclick = ()=>{
  document.getElementById("privacyContent").innerHTML = PRIVACY_HTML;
  document.getElementById("privacyOverlay").style.display = "flex";
};
document.getElementById("privacyCloseBtn").onclick = ()=>{
  document.getElementById("privacyOverlay").style.display = "none";
};
// os links "Política de Privacidade" junto aos formulários de inscrição na
// newsletter (alguns são criados dinamicamente) — um único listener delegado
// apanha todos, mesmo os que ainda não existem no momento em que isto corre
document.addEventListener("click", (e)=>{
  if(e.target && e.target.classList && e.target.classList.contains("newsletter-privacy-link")){
    document.getElementById("privacyBtn").click();
  }
});

const TERMS_HTML = `
  <div class="medal-section-title">📄 Termos de Uso</div>
  <p style="margin:10px 0 14px; font-size:13px; color:var(--text-dim);">Ao usares esta app, aceitas o seguinte:</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">O que é isto</p>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">Um projeto de adeptos, <b>sem qualquer ligação oficial ao FC Porto</b>. Não é um site do clube, nem tem qualquer patrocínio ou aprovação por parte dele.</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">Sem garantias</p>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">A informação (calendários, resultados, estatísticas) é inserida manualmente e pode conter erros ou atrasos. Não garantimos que os dados estejam sempre certos, atualizados, ou disponíveis a qualquer momento. Usa isto como complemento, não como fonte oficial única.</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">Disponibilidade</p>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">Este é um projeto pessoal, mantido no tempo livre de quem o criou. Pode ficar temporariamente indisponível, mudar, ou até ser descontinuado, sem aviso prévio.</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">Uso responsável</p>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">Pedimos que uses a app de forma respeitosa — nomeadamente no botão de reportar bugs/sugestões, que deve ser usado para o que é (bugs e ideias), não para outro fim.</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">Sem responsabilidade por danos</p>
  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim);">Não nos responsabilizamos por decisões tomadas com base na informação aqui apresentada (ex: apostas, planeamento de viagens a jogos), nem por eventuais falhas técnicas.</p>

  <p style="margin:0 0 4px; font-weight:700; color:var(--text);">Contacto</p>
  <p style="margin:0; font-size:13px; color:var(--text-dim);">Dúvidas ou problemas, usa o botão "🐛 Reportar um bug ou sugestão".</p>
`;

document.getElementById("termsBtn").onclick = ()=>{
  document.getElementById("termsContent").innerHTML = TERMS_HTML;
  document.getElementById("termsOverlay").style.display = "flex";
};
document.getElementById("termsCloseBtn").onclick = ()=>{
  document.getElementById("termsOverlay").style.display = "none";
};

const ABOUT_HTML = `
  <div class="medal-section-title">ℹ️ Sobre o Dragão Stats</div>

  <p style="margin:14px 0; font-size:13px; color:var(--text-dim); line-height:1.6;">O Dragão Stats nasceu de uma vontade simples: seguir o FC Porto também fora do futebol principal — Andebol, Basquetebol, Hóquei em Patins, Voleibol, Futebol Feminino, Futsal e Equipa B — sem ter de andar a caçar informação espalhada por vários sítios.</p>

  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim); line-height:1.6;">É um projeto pessoal, feito por dois adeptos nos tempos livres, <b style="color:var(--text);">sem qualquer ligação oficial ao FC Porto</b> e sem fins lucrativos. Fazemos isto porque gostamos de acompanhar estas modalidades e sentimos que mereciam mais atenção.</p>

  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim); line-height:1.6;">Aqui encontras os calendários, os resultados assim que saem, e as classificações de cada modalidade, tudo num só sítio. Também podes ativar notificações para não perderes nenhum jogo, e participar nos prognósticos e nas sondagens.</p>

  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim); line-height:1.6;">Se encontrares algum erro, ou tiveres uma ideia para melhorar o site, usa o botão de reportar — lemos tudo.</p>

  <p style="margin:0 0 14px; font-size:13px; color:var(--text-dim); line-height:1.6;">Se gostas do que fazemos e queres ajudar a manter o projeto, tens um botão de apoio (Ko-fi) no rodapé. Não é obrigatório, e nunca vai ser — é só para quem quiser dar uma ajuda.</p>

  <p style="margin:0; font-size:13px; color:var(--text-dim); line-height:1.6;">Obrigado por passares por aqui.</p>
`;

document.getElementById("aboutBtn").onclick = ()=>{
  document.getElementById("aboutContent").innerHTML = ABOUT_HTML;
  document.getElementById("aboutOverlay").style.display = "flex";
};
document.getElementById("aboutCloseBtn").onclick = ()=>{
  document.getElementById("aboutOverlay").style.display = "none";
};

