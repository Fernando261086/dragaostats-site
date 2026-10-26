// ===================== PÁGINA DE MODALIDADE (a partir do Início) =====================
// Cabeçalho da modalidade + separadores "Jogos" e "Marcadores". Só lê dados que já existem.
// Classificação vem do Apps Script v94 (ver 41-standings.js). O Plantel vem em `50-squad.js`.
let sportPageSport_ = null, sportPageTab_ = "jogos", sportPageStat_ = null;
function openSportPage_(sport, tab){
  sportPageSport_ = sport; sportPageTab_ = tab || "jogos"; sportPageStat_ = null;
  setView("modalidade");
  window.scrollTo(0, 0);
}
function renderSportPage_(){
  const host = document.getElementById("sportView");
  if(!host || host.style.display === "none" || !sportPageSport_) return;
  const sport = sportPageSport_;
  const esc = s => (typeof liveEsc_ === "function") ? liveEsc_(s) : String(s == null ? "" : s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const color = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[sport]) || "#5BB4F0";
  const now = new Date();
  const WD = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];
  const evs = EVENTS.filter(e=>e.sport === sport && e.day).map(ev=>({ ev, d: new Date(ev.day + "T" + (ev.t || "00:00") + ":00"), st: (typeof getEv === "function" && getEv(ev.id)) || {} })).filter(x=>!isNaN(x.d));
  const hasRes = x => !!(x.st.resultado && String(x.st.resultado).trim());
  const upcoming = evs.filter(x=>!hasRes(x) && (x.d >= now || (typeof isLiveNow_ === "function" && isLiveNow_(x.ev)))).sort((a, b)=>a.d - b.d);
  const done = evs.filter(hasRes).sort((a, b)=>b.d - a.d);
  const w = done.filter(x=>x.st.resultTag === "win").length, dr = done.filter(x=>x.st.resultTag === "draw").length, l = done.filter(x=>x.st.resultTag === "loss").length;
  const oppOf = ev => { const t = postTeams_(ev); return (t.home === "FC Porto") ? t.away : t.home; };

  const next = upcoming[0];
  const head = `<div class="sp-head" style="--sc:${color};">
    <button type="button" class="sp-back" id="spBack" aria-label="Voltar ao Início">‹</button>
    <div class="sp-titles"><h2>${esc(sport)}</h2>
      <div class="sp-stats">
        <span><b>${evs.length}</b> jogos</span><span><b>${done.length}</b> com resultado</span>
        ${done.length ? `<span class="sp-w"><b>${w}</b> V</span><span><b>${dr}</b> E</span><span class="sp-l"><b>${l}</b> D</span>` : ""}
      </div>
    </div>
  </div>`;
  const tabs = `<div class="sp-tabs"><button type="button" class="${sportPageTab_ === "jogos" ? "active" : ""}" data-sptab="jogos">Jogos</button><button type="button" class="${sportPageTab_ === "classificacao" ? "active" : ""}" data-sptab="classificacao">Classificação</button><button type="button" class="${sportPageTab_ === "marcadores" ? "active" : ""}" data-sptab="marcadores">Marcadores</button>${(typeof squadHas_ === "function" && squadHas_(sport)) ? `<button type="button" class="${sportPageTab_ === "plantel" ? "active" : ""}" data-sptab="plantel">Plantel</button>` : ""}</div>`;
  let heroHtml = (sportPageTab_ === "jogos" && typeof homeHeroHtml_ === "function") ? `<div class="sp-hero">${homeHeroHtml_(next)}</div>` : "";
  if(sportPageTab_ === "jogos" && !next && done.length){
    // v159: sem próximo jogo marcado → em vez de um destaque vazio, mostra o último resultado
    const u = done[0], tt = postTeams_(u.ev), tag = u.st.resultTag === "win" ? "Vitória" : u.st.resultTag === "loss" ? "Derrota" : u.st.resultTag === "draw" ? "Empate" : "Terminado";
    const det = [u.ev.detail, u.ev.phase].filter(Boolean).join(" · ");
    heroHtml = `<div class="sp-hero"><div class="hv-hero"><div class="hv-hero-top"><span class="hv-kicker">Último resultado</span><span class="hv-pill">${esc(tag)}</span></div>
      <div class="hv-hero-sport">${esc(sport)}${det ? " · " + esc(det) : ""}</div>
      <div class="hv-hero-match hm-long"><span class="hm-a">${esc(tt.home)}</span><span class="hm-b"><b>${esc(String(u.st.resultado).trim())}</b> ${esc(tt.away)}</span></div>
      <div class="hv-hero-meta"><span>${esc(homeLongDate_(u.d))}</span><span>Sem próximo jogo marcado</span></div>
      <div class="hv-hero-actions"><button type="button" class="hv-btn hv-btn-main" data-go="${esc(u.ev.id)}">Ver jogo</button></div></div></div>`;
  }

  let body = "";
  if(sportPageTab_ === "jogos"){
    const row = x=>{
      const ev = x.ev, t = postTeams_(ev), res = hasRes(x);
      const tag = !res ? null : x.st.resultTag === "win" ? ["V", "win"] : x.st.resultTag === "loss" ? ["D", "loss"] : x.st.resultTag === "draw" ? ["E", "draw"] : ["", ""];
      const detail = [ev.detail, ev.phase].filter(Boolean).join(" · ");
      return `<button type="button" class="hv-row" data-go="${esc(ev.id)}" style="--sc:${color};">
        <span class="hv-date"><b>${x.d.getDate()}</b><i>${WD[x.d.getDay()]}</i></span>
        <span class="hv-row-body"><span class="hv-row-sport">${esc(detail || sport)}</span><span class="hv-row-match">${res ? `${crestName_(ev, t.home)} <b>${esc(String(x.st.resultado).trim())}</b> ${crestName_(ev, t.away)}` : matchTitleHtml_(ev) + matchNeutralTag_(ev)}</span></span>
        ${res ? (tag[0] ? `<span class="hv-tag hv-tag-${tag[1]}">${tag[0]}</span>` : "") : `<span class="hv-row-time">${esc(ev.t || "")}</span>`}
      </button>`;
    };
    const nextRest = upcoming.slice(1);
    body = `<div class="hv-panel"><div class="hv-panel-head"><h3>Calendário</h3></div>${nextRest.length ? nextRest.map(row).join("") : '<div class="hv-empty">Sem mais jogos marcados.</div>'}</div>
      <div class="hv-panel"><div class="hv-panel-head"><h3>Resultados</h3></div>${done.length ? done.map(row).join("") : '<div class="hv-empty">Ainda sem resultados.</div>'}</div>`;
  }else if(sportPageTab_ === "plantel"){
    body = (typeof squadPanelHtml_ === "function") ? squadPanelHtml_(sport) : "";
  }else if(sportPageTab_ === "classificacao"){
    body = (typeof standingsPanelHtml_ === "function") ? standingsPanelHtml_(sport) : "";
  }else{
    const stats = (typeof MARCADORES_LABEL_SPORTS !== "undefined" && MARCADORES_LABEL_SPORTS.has(sport)) ? ["Golos"] : getStatTypesFor(sport);
    if(!sportPageStat_ || !stats.includes(sportPageStat_)) sportPageStat_ = stats[0];
    const totals = {};
    evs.forEach(({ ev })=>{
      const per = {};
      (ev.playerStats || []).forEach(p=>{
        if(p.team === "adv" || !p.name) return;
        const val = p.stats && p.stats[sportPageStat_];
        if(val == null || isNaN(val)) return;
        per[p.name] = (per[p.name] || 0) + Number(val);
      });
      const names = (Array.isArray(ev.presentes) && ev.presentes.length) ? ev.presentes : Array.from(new Set((ev.playerStats || []).filter(p=>p.team !== "adv" && p.name).map(p=>p.name)));
      const seen = new Set();
      const count = n=>{ totals[n] = totals[n] || { total: 0, games: 0 }; if(!seen.has(n)){ seen.add(n); totals[n].games++; } };
      names.forEach(count);
      Object.keys(per).forEach(n=>{ count(n); totals[n].total += per[n]; });
    });
    const ranked = Object.keys(totals).map(n=>({ n, ...totals[n] })).filter(r=>r.total > 0).sort((a, b)=>b.total - a.total).slice(0, 15);
    const chips = stats.length > 1 ? `<div class="filters" style="display:flex; margin-bottom:10px;">${stats.map(s=>`<button class="chip${s === sportPageStat_ ? " active" : ""}" data-spstat="${esc(s)}">${esc(s)}</button>`).join("")}</div>` : "";
    body = `<div class="hv-panel"><div class="hv-panel-head"><h3>Marcadores · ${esc(sportPageStat_)}</h3></div>${chips}${ranked.length ? ranked.map((r, i)=>`<div class="hv-row" style="cursor:default; --sc:${color};"><span class="hv-tag">${i + 1}º</span><span class="hv-row-body"><span class="hv-row-match">${esc(r.n)}</span><span class="hv-sport-next">${r.games} jogo${r.games === 1 ? "" : "s"}</span></span><span class="hv-row-time">${r.total}</span></div>`).join("") : '<div class="hv-empty">Ainda sem estatísticas registadas nesta modalidade.</div>'}</div>`;
  }
  host.innerHTML = head + tabs + heroHtml + body;
  host.querySelector("#spBack").onclick = ()=>{ setView("inicio"); window.scrollTo(0, 0); };
  host.querySelectorAll("[data-sptab]").forEach(b=>{ b.onclick = ()=>{ sportPageTab_ = b.getAttribute("data-sptab"); renderSportPage_(); }; });
  host.querySelectorAll("[data-spstat]").forEach(b=>{ b.onclick = ()=>{ sportPageStat_ = b.getAttribute("data-spstat"); renderSportPage_(); }; });
  host.querySelectorAll("[data-go]").forEach(b=>{ b.onclick = ()=>goToEventCard(b.getAttribute("data-go")); });
  host.querySelectorAll("[data-sqp]").forEach(b=>{ b.onclick = ()=>openPlayerSheet_(sport, parseInt(b.getAttribute("data-sqp"), 10)); });
  if(sportPageTab_ === "classificacao" && typeof wireStandingsPanel_ === "function") wireStandingsPanel_(host, sport);
  host.querySelectorAll("[data-remind]").forEach(b=>{ b.onclick = ()=>toggleGameReminder_(b.getAttribute("data-remind"), b); });
}
