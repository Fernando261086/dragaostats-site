function renderSportLinksPanel(){
  const panel = document.getElementById("sportLinksPanel");
  cleanupSportLinks();

  const rows = Object.keys(SPORT_LINKS).map(sport => `
    <div style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
      <span style="width:110px; flex-shrink:0; font-size:13px; color:var(--text-dim);">${sport}</span>
      <input class="result-input" data-link-for="${sport.replace(/"/g,'&quot;')}" value="${(SPORT_LINKS[sport]||'').replace(/"/g,'&quot;')}" placeholder="Link da classificação geral" style="flex:1;">
      <button class="del-btn" data-remove-sport="${sport.replace(/"/g,'&quot;')}" title="Remover esta modalidade">✕</button>
    </div>
  `).join("");

  panel.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">
      Estes links ficam sincronizados entre os teus dispositivos automaticamente.
    </div>
    ${rows}
    <div style="display:flex; gap:8px; margin-top:10px;">
      <input id="newSportName" class="result-input" placeholder="Nova modalidade (ex: Ténis de Mesa)" style="flex:1;">
      <input id="newSportLink" class="result-input" placeholder="Link da classificação" style="flex:1;">
      <button class="add-save" id="addSportLinkBtn" style="white-space:nowrap;">+ Adicionar</button>
    </div>
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-save" id="saveSportLinksBtn">Guardar</button>
      <button class="add-cancel" id="closeSportLinksBtn">Fechar</button>
    </div>
  `;

  panel.querySelectorAll('[data-remove-sport]').forEach(btn=>{
    btn.onclick = ()=>{
      delete SPORT_LINKS[btn.getAttribute('data-remove-sport')];
      renderSportLinksPanel();
    };
  });

  document.getElementById("addSportLinkBtn").onclick = async ()=>{
    const name = document.getElementById("newSportName").value.trim();
    const link = document.getElementById("newSportLink").value.trim();
    if(!name) return;
    SPORT_LINKS[name] = link;
    await saveSportLinks(); // grava logo, para a sincronização automática não a apagar antes do "Guardar"
    renderSportLinksPanel();
  };

  document.getElementById("saveSportLinksBtn").onclick = async ()=>{
    panel.querySelectorAll('[data-link-for]').forEach(input=>{
      SPORT_LINKS[input.getAttribute('data-link-for')] = input.value.trim();
    });
    await saveSportLinks();
    panel.style.display = "none";
  };

  document.getElementById("closeSportLinksBtn").onclick = ()=>{
    panel.style.display = "none";
  };
}

document.getElementById("sportLinksBtn").onclick = ()=>{
  const panel = document.getElementById("sportLinksPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening) renderSportLinksPanel();
};

let leaderboardSport = null;
let leaderboardStat = null;

// Ficha individual de um jogador — todos os jogos em que apareceu, com os números
// de cada um. Funciona a partir de qualquer sítio onde o nome dele apareça.
function formatPlayerGameLine(entries){
  const hasMinutes = entries.some(e => e.minute != null) || entries.length > 1;
  if(hasMinutes){
    const minutes = entries.map(e=>e.minute).filter(m=>m!=null);
    return `⚽ ${entries.length} golo${entries.length===1?'':'s'}${minutes.length ? ' ('+minutes.map(m=>m+"'").join(", ")+')' : ''}`;
  }
  const stats = entries[0].stats || {};
  const parts = Object.keys(stats).map(k=>`${k}: ${stats[k]}`);
  return parts.length ? parts.join(" · ") : "—";
}

function showPlayerProfile(name){
  const games = [];
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [] };
    (compData.events || []).forEach(ev=>{
      if(!Array.isArray(ev.playerStats)) return;
      const entries = ev.playerStats.filter(p => p.name === name);
      if(entries.length === 0) return;
      games.push({ ev, compName: c.name, entries, team: entries[0].team });
    });
  });

  games.sort((a,b)=>{
    const da = new Date((a.ev.day||"")+"T"+(a.ev.t||"00:00")+":00");
    const db = new Date((b.ev.day||"")+"T"+(b.ev.t||"00:00")+":00");
    return db - da; // mais recente primeiro
  });

  const panel = document.getElementById("playerProfilePanel");
  const rowsHtml = games.map(g=>{
    const local = g.ev.local === "fora" ? "Fora" : "Casa";
    return `<div class="compact-line" style="cursor:default;">
      <div class="cl-row1">
        <span class="c-time">${formatShortDate(g.ev.day)}</span>
        <span class="c-sport" style="--sport-color:${SPORT_COLORS[g.ev.sport] || '#e3b23c'}">${g.ev.sport}</span>
        <span class="c-athlete">vs ${g.ev.athlete || '?'}</span>
      </div>
      <div class="cl-row2">
        <span class="c-detail">${local} · ${g.compName}</span>
        <span class="c-result">${formatPlayerGameLine(g.entries)}</span>
      </div>
    </div>`;
  }).join("");

  // Basquetebol mostra-se por média (pontos por jogo, etc.); as outras modalidades
  // mostram-se por total acumulado (ex: golos marcados na época) — assume-se que
  // um jogador só joga uma modalidade, o que é o caso normal
  const isBasquete = games.some(g=>g.ev.sport === "Basquetebol");

  // total/média de cada estatística ao longo de todos os jogos registados
  const statTotals = {};
  games.forEach(g=>{
    g.entries.forEach(entry=>{
      Object.keys(entry.stats || {}).forEach(k=>{
        statTotals[k] = (statTotals[k] || 0) + (entry.stats[k] || 0);
      });
    });
  });
  const avgHtml = (games.length >= 2 && Object.keys(statTotals).length > 0)
    ? `<div class="medal-section-title" style="margin-top:22px;">${isBasquete ? '📈 Médias por jogo' : '📊 Totais da época'}</div>
       <div style="display:flex; flex-wrap:wrap; gap:10px;">
         ${Object.keys(statTotals).map(k=>`
           <div style="background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:8px 12px; text-align:center;">
             <div style="font-size:11px; color:var(--text-dim);">${k.toUpperCase()}</div>
             <div style="font-size:18px; font-weight:700; color:var(--text); font-family:'Archivo Narrow',sans-serif;">${isBasquete ? (statTotals[k]/games.length).toFixed(1) : statTotals[k]}</div>
           </div>
         `).join("")}
       </div>`
    : '';

  // separa por competição (o texto de "Competição" escrito em cada jogo, ex: "Campeonato
  // Nacional", "Amigável") — só mostra a secção se houver mais do que uma competição
  // diferente, senão seria igual ao total/média geral que já aparece em cima
  const byComp = {};
  games.forEach(g=>{
    const compKey = (g.ev.detail && g.ev.detail.trim()) || "Sem competição definida";
    if(!byComp[compKey]) byComp[compKey] = [];
    byComp[compKey].push(g);
  });
  const compNames = Object.keys(byComp).sort();
  const byCompHtml = (compNames.length > 1) ? `
    <div class="medal-section-title" style="margin-top:22px;">🏆 Por competição</div>
    ${compNames.map(compKey=>{
      const compGames = byComp[compKey];
      const totals = {};
      compGames.forEach(g=> g.entries.forEach(entry=>{
        Object.keys(entry.stats || {}).forEach(k=>{ totals[k] = (totals[k] || 0) + (entry.stats[k] || 0); });
      }));
      const statBits = Object.keys(totals).map(k=> isBasquete
        ? `${k}: <b style="color:var(--text);">${(totals[k]/compGames.length).toFixed(1)}</b> méd.`
        : `${k}: <b style="color:var(--text);">${totals[k]}</b>`
      ).join(" · ");
      return `<div style="margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--line);">
        <div style="font-size:13px; font-weight:600; color:var(--text);">${compKey}</div>
        <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">${compGames.length} jogo${compGames.length===1?'':'s'}${statBits ? ' · '+statBits : ''}</div>
      </div>`;
    }).join("")}
  ` : '';

  panel.innerHTML = `
    <div class="medal-section-title">👤 ${name}</div>
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:12px;">${games.length} jogo${games.length===1?'':'s'} registado${games.length===1?'':'s'}</div>
    ${rowsHtml || '<div class="medal-empty">Sem jogos registados para este jogador.</div>'}
    ${avgHtml}
    ${byCompHtml}
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-cancel" id="closePlayerProfileBtn">Fechar</button>
    </div>
  `;
  panel.style.display = "block";
  document.getElementById("closePlayerProfileBtn").onclick = ()=>{ panel.style.display = "none"; };
  panel.scrollIntoView({behavior:"smooth", block:"center"});
}

function renderLeaderboardView(){
  const container = document.getElementById("leaderboardView");

  // reúne modalidades que já têm pelo menos um jogo com estatísticas de jogador
  const sportsWithStats = new Set();
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [] };
    (compData.events || []).forEach(ev=>{
      if(Array.isArray(ev.playerStats) && ev.playerStats.length > 0) sportsWithStats.add(ev.sport);
    });
  });
  const sports = Array.from(sportsWithStats).sort();

  if(sports.length === 0){
    container.innerHTML = `<div class="medal-empty">Ainda sem estatísticas de jogadores registadas. Usa o botão 📊 num jogo para começares.</div>`;
    return;
  }

  if(!leaderboardSport || !sports.includes(leaderboardSport)) leaderboardSport = sports[0];
  const availableStats = MARCADORES_LABEL_SPORTS.has(leaderboardSport) ? ["Golos"] : getStatTypesFor(leaderboardSport);
  if(!leaderboardStat || !availableStats.includes(leaderboardStat)) leaderboardStat = availableStats[0];

  const sportChips = sports.map(s=>`<button class="chip${s===leaderboardSport?' active':''}" data-lb-sport="${s.replace(/"/g,'&quot;')}">${s}</button>`).join('');
  const statChips = availableStats.map(s=>`<button class="chip${s===leaderboardStat?' active':''}" data-lb-stat="${s.replace(/"/g,'&quot;')}">${s}</button>`).join('');

  const totals = {}; // nome do jogador -> { total, games }
  ALL.competitions.filter(c=>(c.mode||"medals")==="matches").forEach(c=>{
    const compData = ALL.data[c.id] || { events: [] };
    (compData.events || []).forEach(ev=>{
      if(ev.sport !== leaderboardSport) return;

      // soma do stat escolhido neste jogo, por jogadora (só FC Porto)
      const statPorJogadora = {};
      (ev.playerStats || []).forEach(p=>{
        if(p.team === "adv") return; // "Marcadores" da época é só sobre o FC Porto, não os adversários
        const val = p.stats && p.stats[leaderboardStat];
        if(val == null || isNaN(val)) return;
        statPorJogadora[p.name] = (statPorJogadora[p.name] || 0) + Number(val);
      });

      // Quem "jogou" este jogo, para contar "jogos" a sério: usa a lista de
      // presenças (👥 Quem jogou) quando já foi preenchida neste jogo. Sem isso,
      // cai para quem tem ficha registada neste jogo (qualquer jogadora com uma
      // linha em playerStats, não só quem tem a estatística que está a ver com
      // valor preenchido) — nas modalidades de "Marcadores" dá o mesmo que antes
      // (cada linha é sempre um golo), mas nas modalidades com fichas completas
      // por jogadora (Andebol, Basquetebol, Hóquei em Patins) deixa de depender de
      // qual estatística está selecionada: uma jogadora com ficha neste jogo mas
      // sem, por exemplo, ressaltos registados, continua a contar o jogo.
      const jogadoresComFichaNesteJogo = Array.from(new Set(
        (ev.playerStats || []).filter(p=>p.team !== "adv" && p.name).map(p=>p.name)
      ));
      const presentesNesteJogo = (Array.isArray(ev.presentes) && ev.presentes.length > 0)
        ? ev.presentes
        : jogadoresComFichaNesteJogo;

      const jaContadoNesteJogo = new Set();
      const contaJogo = nome=>{
        if(!totals[nome]) totals[nome] = { total: 0, games: 0 };
        if(!jaContadoNesteJogo.has(nome)){
          jaContadoNesteJogo.add(nome);
          totals[nome].games += 1;
        }
      };
      presentesNesteJogo.forEach(contaJogo);
      Object.keys(statPorJogadora).forEach(nome=>{
        contaJogo(nome); // quem marcou conta sempre o jogo, mesmo que não estivesse na lista de presenças
        totals[nome].total += statPorJogadora[nome];
      });
    });
  });

  const ranked = Object.keys(totals).map(name=>({ name, ...totals[name] })).sort((a,b)=> b.total - a.total);

  const listHtml = ranked.length === 0
    ? `<div class="medal-empty">Sem registos de "${leaderboardStat}" em ${leaderboardSport} ainda.</div>`
    : ranked.map((r,idx)=>`
      <div class="compact-line" style="cursor:default;">
        <span class="c-time" style="width:26px;">${idx+1}º</span>
        <span class="c-athlete" data-player-profile="${r.name.replace(/"/g,'&quot;')}" style="cursor:pointer; text-decoration:underline; text-decoration-style:dotted;">${r.name}</span>
        <span class="c-phase">${r.games} jogo${r.games===1?'':'s'}</span>
        <span class="c-result">${r.total}</span>
      </div>
    `).join("");

  container.innerHTML = `
    <div class="filters" style="margin-bottom:10px; display:flex;">${sportChips}</div>
    <div class="filters" style="margin-bottom:14px; display:flex;">${statChips}</div>
    ${listHtml}
  `;

  container.querySelectorAll('[data-lb-sport]').forEach(btn=>{
    btn.onclick = ()=>{ leaderboardSport = btn.getAttribute('data-lb-sport'); leaderboardStat = null; renderLeaderboardView(); };
  });
  container.querySelectorAll('[data-lb-stat]').forEach(btn=>{
    btn.onclick = ()=>{ leaderboardStat = btn.getAttribute('data-lb-stat'); renderLeaderboardView(); };
  });
  container.querySelectorAll('[data-player-profile]').forEach(el=>{
    el.onclick = ()=> showPlayerProfile(el.getAttribute('data-player-profile'));
  });
}

function renderHistoryView(){
  const container = document.getElementById("historyView");
  const now = new Date();
  const sports = ["Todos", ...Array.from(new Set(EVENTS.map(e=>e.sport))).sort()];

  const chipsHtml = `<div class="filters" style="margin-bottom:14px; display:flex;">
    ${sports.map(s=>`<button class="chip${s===historyFilterSport?' active':''}" data-hsport="${s.replace(/"/g,'&quot;')}">${s}</button>`).join('')}
  </div>`;

  let past = EVENTS.filter(ev=>{
    const d = new Date((ev.day||"") + "T" + (ev.t || "00:00") + ":00");
    if(isNaN(d) || d >= now) return false;
    if(historyFilterSport !== "Todos" && ev.sport !== historyFilterSport) return false;
    return true;
  }).sort((a,b)=>{
    const da = new Date((a.day||"")+"T"+(a.t||"00:00")+":00");
    const db = new Date((b.day||"")+"T"+(b.t||"00:00")+":00");
    return db - da; // mais recente primeiro
  });

  let listHtml;
  if(past.length === 0){
    listHtml = `<div class="medal-empty">Sem resultados passados${historyFilterSport!=='Todos' ? ' de '+historyFilterSport : ''} ainda.</div>`;
  }else{
    // resumo V/E/D do que está a ser mostrado, com detalhe Casa/Fora (jogos em campo
    // neutro entram no total, mas não em nenhuma das duas colunas)
    let w=0,d=0,l=0,semResultado=0;
    let wCasa=0,dCasa=0,lCasa=0,wFora=0,dFora=0,lFora=0,neutros=0;
    past.forEach(ev=>{
      const r = getMatchResultTag(ev, getEv(ev.id));
      const local = ev.local || "casa";
      if(local === "neutro") neutros++;
      if(r==="win"){ w++; if(local==="casa") wCasa++; else if(local==="fora") wFora++; }
      else if(r==="draw"){ d++; if(local==="casa") dCasa++; else if(local==="fora") dFora++; }
      else if(r==="loss"){ l++; if(local==="casa") lCasa++; else if(local==="fora") lFora++; }
      else semResultado++;
    });
    const summary = `<div class="medal-empty" style="text-align:left; margin-bottom:12px;">
      ✅ ${w} vitórias · 🟰 ${d} empates · ❌ ${l} derrotas${semResultado?` · ${semResultado} sem resultado registado`:''}
      <div style="margin-top:6px; font-size:12px; opacity:0.85;">🏠 Casa: ${wCasa}V ${dCasa}E ${lCasa}D &nbsp;·&nbsp; 🚌 Fora: ${wFora}V ${dFora}E ${lFora}D${neutros?` &nbsp;·&nbsp; 🏳️ ${neutros} em campo neutro`:''}</div>
    </div>`;

    listHtml = summary + past.map(ev=>{
      const st = getEv(ev.id);
      const r = getMatchResultTag(ev, st);
      const badgeColor = r==='win' ? 'var(--green)' : r==='loss' ? 'var(--red)' : r==='draw' ? 'var(--text-dim)' : 'var(--text-dim)';
      const badgeLabel = r==='win' ? 'V' : r==='loss' ? 'D' : r==='draw' ? 'E' : '—';
      const color = SPORT_COLORS[ev.sport] || "#e3b23c";
      const local = localLabel(ev.local);
      return `<div class="compact-line" data-ev-id="${ev.id}" style="cursor:pointer;">
        <span class="c-time">${formatShortDate(ev.day)}</span>
        <span class="c-sport" style="--sport-color:${color}">${ev.sport}</span>
        <span class="c-athlete">vs ${ev.athlete} <span style="color:${badgeColor}; font-weight:700;">(${badgeLabel})</span></span>
        <span class="c-phase">${local}${ev.phase ? ' · '+ev.phase : ''}</span>
        <span class="c-result">${st.resultado ? st.resultado : 'sem resultado'}</span>
      </div>`;
    }).join("");
  }

  container.innerHTML = chipsHtml + listHtml;
  container.querySelectorAll('[data-hsport]').forEach(btn=>{
    btn.onclick = ()=>{
      historyFilterSport = btn.getAttribute('data-hsport');
      renderHistoryView();
    };
  });
  // tocar num jogo do histórico leva às estatísticas/resultado desse jogo,
  // tal como acontece em qualquer outro sítio da app
  container.querySelectorAll('[data-ev-id]').forEach(line=>{
    line.onclick = ()=>{
      const targetEv = EVENTS.find(e => e.id === line.getAttribute("data-ev-id"));
      if(targetEv){
        statsOpenedFromWeekView = false;
        openPlayerStatsPanel(targetEv);
      }
    };
  });
}

function renderStatsView(){
  const box = document.getElementById("statsView");
  const bySport = {};
  EVENTS.forEach(ev=>{
    if(!bySport[ev.sport]) bySport[ev.sport] = { total:0, yes:0, no:0, gold:0, silver:0, bronze:0 };
    const st = getEv(ev.id);
    const s = bySport[ev.sport];
    s.total++;
    if(st.passou==='yes') s.yes++;
    else if(st.passou==='no') s.no++;
    if(st.medal==='gold') s.gold++;
    else if(st.medal==='silver') s.silver++;
    else if(st.medal==='bronze') s.bronze++;
  });

  const sports = Object.keys(bySport).sort();
  if(sports.length===0){
    box.innerHTML = `<div class="medal-empty">Sem provas nesta competição ainda.</div>`;
    return;
  }

  box.innerHTML = sports.map(sport=>{
    const s = bySport[sport];
    const color = SPORT_COLORS[sport] || "#e3b23c";
    return `<div class="medal-row" style="flex-direction:column; align-items:stretch; gap:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="sport" style="--sport-color:${color}; color:${color};">${sport}</span>
        <span class="what">${s.total} prova${s.total===1?'':'s'}</span>
      </div>
      <div style="display:flex; gap:14px; font-size:12.5px; color:var(--text-dim);">
        <span style="color:var(--green);">✓ ${s.yes} passou</span>
        <span style="color:var(--red);">✕ ${s.no} não passou</span>
        <span>🥇${s.gold} 🥈${s.silver} 🥉${s.bronze}</span>
      </div>
    </div>`;
  }).join("");
}

function renderMedals(){
  const box = document.getElementById("medalsView");
  const withMedal = EVENTS.filter(e => getEv(e.id).medal);
  const byType = { gold: [], silver: [], bronze: [] };
  withMedal.forEach(e => byType[getEv(e.id).medal].push(e));

  const labels = { gold:["🥇","Ouro"], silver:["🥈","Prata"], bronze:["🥉","Bronze"] };

  let html = `<div class="medal-totals">
    <div class="medal-total-card gold"><div class="num">${byType.gold.length}</div><div class="lbl">Ouro</div></div>
    <div class="medal-total-card silver"><div class="num">${byType.silver.length}</div><div class="lbl">Prata</div></div>
    <div class="medal-total-card bronze"><div class="num">${byType.bronze.length}</div><div class="lbl">Bronze</div></div>
    <div class="medal-total-card total"><div class="num">${withMedal.length}</div><div class="lbl">Total</div></div>
  </div>`;

  ["gold","silver","bronze"].forEach(type=>{
    const [icon,label] = labels[type];
    html += `<div class="medal-section-title ${type}">${icon} ${label}</div>`;
    if(byType[type].length === 0){
      html += `<div class="medal-empty">Ainda sem medalhas de ${label.toLowerCase()}.</div>`;
    }else{
      byType[type]
        .sort((a,b)=> (b.seq||0)-(a.seq||0))
        .forEach(e=>{
          html += `<div class="medal-row">
            <div>
              <div class="who">${e.athlete}</div>
              <div class="what">${e.sport}${e.detail ? " · "+e.detail : ""}${e.phase ? " · "+e.phase : ""}</div>
            </div>
            <div class="when">Dia ${e.day}</div>
          </div>`;
        });
    }
  });

  box.innerHTML = html;
}

function setView(view){
  profileAthlete = null; // sair de qualquer vista fecha a ficha do atleta, se estiver aberta
  const cal = view === "calendario";
  const medals = view === "medalhas";
  const todayAll = view === "hoje-todas";
  const stats = view === "estatisticas";
  const history = view === "historico";
  const leaderboard = view === "marcadores";

  document.getElementById("viewCalendarBtn").classList.toggle("active", cal);
  document.getElementById("viewMedalsBtn").classList.toggle("active", medals);
  document.getElementById("viewTodayAllBtn").classList.toggle("active", todayAll);
  document.getElementById("viewStatsBtn").classList.toggle("active", stats);
  document.getElementById("viewHistoryBtn").classList.toggle("active", history);
  document.getElementById("viewLeaderboardBtn").classList.toggle("active", leaderboard);

  document.getElementById("timeline").style.display = cal ? "block" : "none";
  document.getElementById("medalsView").style.display = medals ? "block" : "none";
  document.getElementById("todayAllView").style.display = todayAll ? "block" : "none";
  document.getElementById("statsView").style.display = stats ? "block" : "none";
  document.getElementById("historyView").style.display = history ? "block" : "none";
  document.getElementById("leaderboardView").style.display = leaderboard ? "block" : "none";

  document.getElementById("progressRow").style.display = cal ? "flex" : "none";
  document.getElementById("dayTabs").style.display = cal ? "flex" : "none";
  document.getElementById("filters").style.display = cal ? "flex" : "none";
  document.getElementById("addToggleBtn").style.display = cal ? "block" : "none";

  if(!cal){
    document.getElementById("addPanel").style.display = "none";
  }
  if(medals) renderMedals();
  if(todayAll) renderTodayAllView();
  if(stats) renderStatsView();
  if(history) renderHistoryView();
  if(leaderboard) renderLeaderboardView();
}
document.getElementById("viewCalendarBtn").onclick = ()=>setView("calendario");
document.getElementById("viewMedalsBtn").onclick = ()=>setView("medalhas");
document.getElementById("viewHistoryBtn").onclick = ()=>setView("historico");
document.getElementById("viewLeaderboardBtn").onclick = ()=>setView("marcadores");
document.getElementById("viewTodayAllBtn").onclick = ()=>{ weekOffset = 0; setView("hoje-todas"); };
document.getElementById("viewStatsBtn").onclick = ()=>setView("estatisticas");

document.getElementById("globalSearchBtn").onclick = ()=>{
  globalSearch = !globalSearch;
  document.getElementById("globalSearchBtn").classList.toggle("active", globalSearch);
  if(globalSearch){
    setView("hoje-todas");
    document.getElementById("viewTodayAllBtn").classList.remove("active");
    document.getElementById("viewCalendarBtn").classList.remove("active");
    renderGlobalSearchView();
  }else{
    setView("calendario");
    renderTimeline();
  }
};

document.getElementById("resetBtn").onclick = async ()=>{
  if(confirm("Limpar todas as marcações do dia?")){
    state = {};
    await saveState();
    renderProgress();
    renderTimeline();
  }
};

// Resumo do dia (ou da semana, no Modo Modalidades), escrito e lido em voz alta
function buildDaySummaryText(){
  if(currentCompMode()==="matches"){
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)); // semana começa à 2ª feira
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekGames = EVENTS.filter(ev=>{
      if(!ev.day) return false;
      const d = new Date(ev.day + "T00:00:00");
      return !isNaN(d) && d >= weekStart && d < weekEnd;
    });

    if(weekGames.length === 0) return "Esta semana não há jogos agendados.";

    let text = `Esta semana, o FC Porto joga ${weekGames.length} ve${weekGames.length===1?'z':'zes'}. `;
    weekGames.forEach(ev=>{
      const st = getEv(ev.id);
      const r = getMatchResultTag(ev, st);
      const local = ev.local === "fora" ? "fora" : ev.local === "neutro" ? "em campo neutro" : "em casa";
      if(r){
        const label = r==="win" ? "venceu" : r==="loss" ? "perdeu" : "empatou";
        text += `${ev.sport}: ${label} contra ${ev.athlete}, ${local}, por ${st.resultado}. `;
      }else{
        text += `${ev.sport}: joga contra ${ev.athlete}, ${local}, ${formatFullDate(ev.day)} às ${ev.t}. `;
      }
    });
    return text;
  }

  const dayEvents = EVENTS.filter(belongsToActiveDay);
  const marked = dayEvents.filter(isMarked);
  const passed = marked.filter(e=>getEv(e.id).passou==='yes');
  const failed = marked.filter(e=>getEv(e.id).passou==='no');
  const medals = marked.filter(e=>getEv(e.id).medal);
  const golds = medals.filter(e=>getEv(e.id).medal==='gold');
  const silvers = medals.filter(e=>getEv(e.id).medal==='silver');
  const bronzes = medals.filter(e=>getEv(e.id).medal==='bronze');

  let text = `Resumo do dia ${activeDay}. `;
  if(medals.length === 0){
    text += "Ainda sem medalhas registadas. ";
  }else{
    text += `${medals.length} medalha${medals.length===1?'':'s'}`;
    const parts = [];
    if(golds.length) parts.push(`${golds.length} de ouro`);
    if(silvers.length) parts.push(`${silvers.length} de prata`);
    if(bronzes.length) parts.push(`${bronzes.length} de bronze`);
    if(parts.length) text += ": " + parts.join(", ");
    text += ". Destaque para " + medals.slice(0,3).map(e=>e.athlete).join(", ") + ". ";
  }
  text += `${passed.length} prova${passed.length===1?'':'s'} qualificada${passed.length===1?'':'s'}`;
  text += ` e ${failed.length} eliminada${failed.length===1?'':'s'}.`;
  return text;
}

// Avisos 5 minutos antes de cada prova — usa as notificações reais do sistema.
// Começa já "ligado" se o browser já tiver dado autorização antes (evita o botão
// mostrar sempre "desligado" ao reabrir a app, mesmo já tendo sido ativado).
let notificationsEnabled = ("Notification" in window) && Notification.permission === "granted";
let currentPushToken = null; // token deste aparelho, se já tiver sido pedido — usado para ligar um feedback enviado à possibilidade de receber a resposta como notificação a sério
updateNotifyBtnLabel(); // reflete já no botão o estado real da permissão, logo ao abrir a app
if(notificationsEnabled){
  checkUpcomingForNotifications();
  // adiado para o próximo instante (setTimeout 0) — sem isto, corre antes de o
  // código do Firebase mais abaixo no ficheiro estar pronto, e dava erro
  setTimeout(()=>{ try{ registerForPushNotifications(); }catch(e){} }, 0);
}

function updateNotifyBtnLabel(){
  document.getElementById("notifyToggleBtn").classList.toggle("active", notificationsEnabled);
  // destaque permanente e discreto enquanto não estiverem ativas — só quando o
  // próprio browser ainda permite ativá-las (não insiste se já foram bloqueadas)
  const canStillEnable = !("Notification" in window) || Notification.permission !== "denied";
  document.getElementById("notifyToggleBtn").classList.toggle("needs-attention", !notificationsEnabled && canStillEnable);
  document.getElementById("notifyToggleBtn").textContent = notificationsEnabled ? "🔔 Notificações ligadas" : "🔔 Ativar notificações";
  updateNewsletterBannerNotifyBtn();
}

async function showAppNotification(title, body){
  try{
    if("serviceWorker" in navigator){
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, { body, icon: "icon-192.png", badge: "icon-192.png" });
    }else if("Notification" in window){
      new Notification(title, { body, icon: "icon-192.png" });
    }
  }catch(e){ console.error("Falha ao mostrar notificação:", e); }
}

// Avisa quando aparece um resultado NOVO (escrito por ti, noutro dispositivo) para
// um jogo desta competição — compara com o último "estado conhecido" guardado
// neste aparelho, para nunca repetir o mesmo aviso nem inundar com resultados
// antigos na primeira vez que a app corre neste aparelho.
// Esta função existia para avisar localmente quando um resultado saía — mas
// isso já é tratado a sério pelo servidor (sendPushToAll_, chega mesmo com a
// app fechada). Deixá-la ativa causava notificações a dobrar: uma da push a
// sério, e esta outra sempre que a pessoa voltava a abrir a app e a app
// "descobria" que aquele resultado ainda não estava no seu registo local.
// Fica só a limpar o registo antigo (para não ficar lixo perdido no
// localStorage de quem já o tinha), sem voltar a avisar nada a partir daqui.
function checkNewResultsForNotifications(){
  try{ localStorage.removeItem("dia22-known-results-" + activeCompId); }catch(e){}
}

function checkUpcomingForNotifications(){
  if(!notificationsEnabled) return;
  const now = new Date();
  // O aviso "faltam X min para o jogo" passou a ser uma notificação a sério,
  // enviada pelo servidor (Apps Script, checkUpcomingGamesForPush_) 15 min antes
  // — chega mesmo com a app fechada. Por isso já não é feito aqui (evitava
  // duplicar o aviso a quem tivesse a app aberta nessa altura).

  // Modo Modalidades: jogos terminados há mais de 24h sem resultado escrito — só
  // avisa uma vez por jogo (guardado neste dispositivo, sobrevive a fechar a app).
  // Só faz sentido para quem edita — quem só vê não tem nada a escrever.
  if(currentCompMode()==="matches" && !READONLY_MODE){
    let alreadyNotified = [];
    try{ alreadyNotified = JSON.parse(localStorage.getItem("dia22-notified-pending") || "[]"); }catch(e){}
    const notifiedSet = new Set(alreadyNotified);
    let changed = false;
    EVENTS.forEach(ev=>{
      if(!ev.day || notifiedSet.has(ev.id)) return;
      const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
      if(isNaN(d)) return;
      const hoursSince = (now - d) / 3600000;
      const st = getEv(ev.id);
      if(hoursSince >= 24 && !st.resultTag && !(st.resultado && st.resultado.trim())){
        notifiedSet.add(ev.id);
        changed = true;
        showAppNotification(
          "🔔 Resultado por escrever",
          `${ev.sport} vs ${ev.athlete} (${formatShortDate(ev.day)}) ainda não tem resultado`
        );
      }
    });
    if(changed){
      try{ localStorage.setItem("dia22-notified-pending", JSON.stringify(Array.from(notifiedSet))); }catch(e){}
    }
  }
}

// Pede a permissão e liga os avisos — usado tanto pelo botão principal (🔔 Avisos)
// como pelo botão do popup de novidades, para nunca duplicar esta lógica.
