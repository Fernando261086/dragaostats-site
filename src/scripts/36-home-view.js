// ===================== ECRÃ "INÍCIO" (Modo Modalidades) =====================
// Ecrã de abertura, feito a partir da proposta de design: próximo jogo em destaque, "Esta semana"
// com filtro por modalidade e últimos resultados. É só leitura de dados que já existem
// (EVENTS, getEv, CEV_LIVE); o Calendário continua igual, noutro separador.
let homeSig_ = "";
let homeSport_ = "Todas";
const HOME_WD_ = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];
function homeEsc_(s){ return (typeof liveEsc_ === "function") ? liveEsc_(s) : String(s == null ? "" : s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function homeColor_(sp){ return (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[sp]) || "#5BB4F0"; }
function homeOpp_(ev){ const t = postTeams_(ev); return (t.home === "FC Porto") ? t.away : t.home; }
function homeDayDiff_(d){ const n = new Date(); const a = new Date(n.getFullYear(), n.getMonth(), n.getDate()); const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return Math.round((b - a) / 86400000); }
function homeLongDate_(d){ const m = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]; const w = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]; return w[d.getDay()] + ", " + d.getDate() + " de " + m[d.getMonth()]; }

// Resultado ao vivo para o cartão de destaque: números grandes (na ordem em que se joga) + parte/minuto.
function homeLiveScoreHtml_(ev, j){
  const esc = homeEsc_;
  const fcpHome = !liveFora_(ev);
  let a, b, info = "";
  if(j.golosFcp !== undefined){
    a = fcpHome ? (j.golosFcp||0) : (j.golosAdv||0); b = fcpHome ? (j.golosAdv||0) : (j.golosFcp||0);
    info = [j.parte, j.tempo].filter(Boolean).join(" · ");
  }else{
    a = fcpHome ? (j.setsFcp||0) : (j.setsAdv||0); b = fcpHome ? (j.setsAdv||0) : (j.setsFcp||0);
    const sets = Array.isArray(j.sets) ? j.sets : [];
    if(sets.length){ const c = sets[sets.length - 1]; info = sets.length + ".º set: " + (fcpHome ? c[0] + "-" + c[1] : c[1] + "-" + c[0]); }
  }
  return `<div class="hv-hero-score"><span class="hs-n">${esc(String(a))}</span><span class="hs-sep">–</span><span class="hs-n">${esc(String(b))}</span>${info ? `<span class="hs-t">${esc(info)}</span>` : ""}</div>`;
}

// Cartão azul de destaque (usado no Início e no topo de cada página de modalidade)
function homeHeroHtml_(item, label){
  const esc = homeEsc_;
  if(!item){
    return `<div class="hv-hero"><div class="hv-hero-top"><span class="hv-kicker">${esc(label || "Próximo jogo")}</span></div><div class="hv-hero-match"><span class="hm-a" style="font-size:.75em;">Sem jogos marcados</span></div><div class="hv-hero-meta"><span>Volta cá em breve.</span></div></div>`;
  }
  const ev = item.ev, d = item.d, now = new Date();
  const lj = (typeof cevLiveFor_ === "function") ? cevLiveFor_(ev) : null;
  const liveData = !!(lj && lj.estado === "vivo");        // há dados ao vivo da fonte (resultado e tempo)
  const live = liveData || d < now;                          // sem dados, a hora já passou: "a decorrer"
  const pill = liveData ? "AO VIVO" : (live ? "A decorrer" : (typeof formatCountdownMain === "function" ? formatCountdownMain(homeDayDiff_(d)) : ""));
  const scoreHtml = liveData ? homeLiveScoreHtml_(ev, lj) : "";
  const detail = [ev.detail, ev.phase].filter(Boolean).join(" · ");
  const place = [ev.venue, localLabel(ev.local)].filter(Boolean).join(" · ");
  const ico = (n) => (typeof n === "string") ? n : "";
  return `<div class="hv-hero${live ? " is-live" : ""}${liveData ? " has-score" : ""}">
    <div class="hv-hero-top"><span class="hv-kicker">${liveData ? "A decorrer" : (live ? "A decorrer" : esc(label || "Próximo jogo"))}</span><span class="hv-pill">${liveData ? '<i class="hv-dot"></i>' : ""}${esc(pill)}</span></div>
    <div class="hv-hero-sport">${esc(ev.sport)}${detail ? " · " + esc(detail) : ""}</div>
    <div class="hv-hero-match${homeOpp_(ev).length > 16 ? " hm-long" : ""}"><span class="hm-a">${esc(postTeams_(ev).home)}</span><span class="hm-b"><span class="hv-vs">vs</span> ${esc(postTeams_(ev).away)}</span></div>
    ${scoreHtml}
    <div class="hv-hero-meta">
      <span>${ico(typeof HERO_ICON_CAL_ !== "undefined" ? HERO_ICON_CAL_ : "")}${esc(homeLongDate_(d))}${ev.t ? " · " + esc(ev.t) : ""}</span>
      <span>${ico(typeof HERO_ICON_PIN_ !== "undefined" ? HERO_ICON_PIN_ : "")}${esc(place)}</span>
    </div>
    <div class="hv-hero-actions">
      ${live ? `<button type="button" class="hv-btn hv-btn-main" data-go="${esc(ev.id)}">Ver jogo</button>`
             : `<button type="button" class="hv-btn hv-btn-main${(typeof hasGameReminder_ === "function" && hasGameReminder_(ev.id)) ? " is-on" : ""}" data-remind="${esc(ev.id)}">${(typeof hasGameReminder_ === "function" && hasGameReminder_(ev.id)) ? "✓ Lembrete ativo" : "Lembrar-me"}</button>`}
      ${ev.watchUrl ? `<a class="hv-btn hv-btn-ghost" href="${esc(ev.watchUrl)}" target="_blank" rel="noopener">Ver transmissão</a>` : (live ? "" : `<button type="button" class="hv-btn hv-btn-ghost" data-go="${esc(ev.id)}">Ver jogo</button>`)}
    </div>
  </div>`;
}

function renderHomeView_(force){
  const host = document.getElementById("homeView");
  if(!host || host.style.display === "none") return;
  if(typeof EVENTS === "undefined") return;
  const esc = homeEsc_;
  const now = new Date();
  const liveOf = ev => { const j = (typeof cevLiveFor_ === "function") ? cevLiveFor_(ev) : null; return !!(j && j.estado === "vivo"); };
  const hasRes = ev => { const st = (typeof getEv === "function" && getEv(ev.id)) || {}; return !!(st.resultado && String(st.resultado).trim()); };
  const withD = EVENTS.filter(ev=>ev.sport && ev.day).map(ev=>({ ev, d: new Date(ev.day + "T" + (ev.t || "00:00") + ":00") })).filter(x=>!isNaN(x.d));
  const upcoming = withD.filter(x=>{
    if(x.d >= now) return true;
    return !hasRes(x.ev) && (liveOf(x.ev) || (typeof isLiveNow_ === "function" && isLiveNow_(x.ev)));
  }).sort((a, b)=>a.d - b.d);
  const done = withD.filter(x=>hasRes(x.ev)).sort((a, b)=>b.d - a.d);

  const sportsAll = Array.from(new Set(withD.map(x=>x.ev.sport))).sort((a, b)=>a.localeCompare(b, "pt"));
  if(homeSport_ !== "Todas" && !sportsAll.includes(homeSport_)) homeSport_ = "Todas";

  const sig = JSON.stringify([upcoming.slice(0, 10).map(x=>[x.ev.id, x.ev.t, x.ev.watchUrl, liveOf(x.ev), (typeof cevLiveText_ === "function" && liveOf(x.ev)) ? cevLiveText_(x.ev, cevLiveFor_(x.ev)) : ""]), done.slice(0, 3).map(x=>[x.ev.id, (getEv(x.ev.id) || {}).resultado]), new Date().getHours(), new Date().getMinutes() - (new Date().getMinutes() % 5), homeSport_, Object.keys(STANDINGS || {}).map(k=>[k, ((STANDINGS[k] || {}).updated || 0)])]);
  if(!force && sig === homeSig_) return;
  homeSig_ = sig;

  // Destaque: o próximo jogo. Se um jogo já aparece no cartão "ao vivo" (CEV), o destaque passa ao seguinte.
  const heroIdx = upcoming.length ? 0 : -1; // v150: um jogo ao vivo fica em destaque, com resultado e minutos
  const hero = heroIdx >= 0 ? upcoming[heroIdx] : null;

  // ---- Esta semana (com filtro por modalidade)
  const rest = upcoming.filter(x=>x !== hero && !(x.d < now && liveOf(x.ev)));
  const base = homeSport_ === "Todas" ? rest : upcoming.filter(x=>x.ev.sport === homeSport_);
  const within = base.filter(x=>homeDayDiff_(x.d) <= 7);
  const weekList = (within.length || homeSport_ !== "Todas" ? within : base).slice(0, 6);
  const listUse = (weekList.length || homeSport_ === "Todas") ? weekList : base.slice(0, 6);
  const weekTitle = (within.length || homeSport_ !== "Todas") ? "Esta semana" : "Próximos jogos";
  const pills = ["Todas"].concat(sportsAll).map(sp=>`<button type="button" class="hv-pillbtn${sp === homeSport_ ? " active" : ""}" data-hsport="${esc(sp)}">${esc(sp)}</button>`).join("");
  const rows = listUse.map(x=>{
    const ev = x.ev;
    return `<button type="button" class="hv-row" data-go="${esc(ev.id)}" style="--sc:${homeColor_(ev.sport)};">
      <span class="hv-date"><b>${x.d.getDate()}</b><i>${HOME_WD_[x.d.getDay()]}</i></span>
      <span class="hv-row-body"><span class="hv-row-sport">${esc(ev.sport)}</span><span class="hv-row-match">${matchTitleHtml_(ev)}${matchNeutralTag_(ev)}</span></span>
      <span class="hv-row-time">${esc(ev.t || "")}</span>
    </button>`;
  }).join("");
  const link = homeSport_ === "Todas"
    ? `<button type="button" class="hv-link" data-cal="1">Ver calendário</button>`
    : `<button type="button" class="hv-link" data-sportpage="${esc(homeSport_)}">Página de ${esc(homeSport_)} ›</button>`;
  const week = `<div class="hv-panel hv-week">
    <div class="hv-pills">${pills}</div>
    <div class="hv-panel-head"><h3>${weekTitle}</h3>${link}</div>
    ${rows || '<div class="hv-empty">Sem mais jogos marcados.</div>'}
  </div>`;

  let resultsHtml = "";

  // ---- Últimos resultados
  if(done.length){
    const res = done.slice(0, 3).map(x=>{
      const ev = x.ev, st = getEv(ev.id) || {};
      const t = postTeams_(ev);
      const tag = st.resultTag === "win" ? ["V", "win"] : st.resultTag === "loss" ? ["D", "loss"] : st.resultTag === "draw" ? ["E", "draw"] : null;
      return `<button type="button" class="hv-row hv-res" data-go="${esc(ev.id)}" style="--sc:${homeColor_(ev.sport)};">
        ${tag ? `<span class="hv-tag hv-tag-${tag[1]}">${tag[0]}</span>` : '<span class="hv-tag"></span>'}
        <span class="hv-row-body"><span class="hv-row-sport">${esc(ev.sport)} · ${esc(formatShortDate(ev.day))}</span><span class="hv-row-match">${esc(t.home)} <b>${esc(String(st.resultado).trim())}</b> ${esc(t.away)}</span></span>
      </button>`;
    }).join("");
    resultsHtml = `<div class="hv-panel hv-results"><div class="hv-panel-head"><h3>Últimos resultados</h3><button type="button" class="hv-link" data-hist="1">Ver histórico</button></div>${res}</div>`;
  }

  // ---- Classificações: posição do FC Porto em cada modalidade (toque abre a classificação completa)
  let clsHtml = "";
  const clsCards = sportsAll.filter(sp=>STANDINGS && STANDINGS[sp] && (STANDINGS[sp].rows || []).length).map(sp=>{
    const s = STANDINGS[sp], ci = (k)=>(s.cols || []).indexOf(k);
    const me = s.rows.find(r=>r.me);
    const played = me ? Number((me.c || [])[ci("J")]) : 0;
    const pts = me ? (me.c || [])[ci("Pts")] : "";
    const big = (me && played > 0) ? esc(me.p) + ".º" : "—";
    const sub = (me && played > 0) ? `<b>${esc(pts)}</b> pts · ${esc(played)} jogos` : "ainda sem jogos";
    return `<button type="button" class="hv-cls" data-cls="${esc(sp)}" style="--sc:${homeColor_(sp)};">
      <span class="hv-cls-sport">${esc(sp)}</span>
      <span class="hv-cls-pos">${big}</span>
      <span class="hv-cls-sub">${sub}</span>
      <span class="hv-cls-of">de ${s.rows.length} equipas</span>
    </button>`;
  }).join("");
  if(clsCards) clsHtml = `<div class="hv-panel hv-cls-panel"><div class="hv-panel-head"><h3>🏆 Classificações</h3><span class="hv-cls-hint">Toca para ver a tabela</span></div><div class="hv-cls-grid">${clsCards}</div></div>`;

  const html = `<div class="hv-top">${homeHeroHtml_(hero)}${week}${resultsHtml}${clsHtml}</div>`;
  host.innerHTML = html;
  host.querySelectorAll("[data-go]").forEach(b=>{ b.onclick = ()=>goToEventCard(b.getAttribute("data-go")); });
  host.querySelectorAll("[data-remind]").forEach(b=>{ b.onclick = ()=>toggleGameReminder_(b.getAttribute("data-remind"), b); });
  host.querySelectorAll("[data-cal]").forEach(b=>{ b.onclick = ()=>{ activeSport = "Todos"; setView("calendario"); renderFilters(); renderProgress(); renderTimeline(); window.scrollTo(0, 0); }; });
  host.querySelectorAll("[data-hist]").forEach(b=>{ b.onclick = ()=>{ setView("historico"); window.scrollTo(0, 0); }; });
  host.querySelectorAll("[data-sportpage]").forEach(b=>{ b.onclick = ()=>openSportPage_(b.getAttribute("data-sportpage")); });
  host.querySelectorAll("[data-cls]").forEach(b=>{ b.onclick = ()=>openSportPage_(b.getAttribute("data-cls"), "classificacao"); });
  host.querySelectorAll("[data-hsport]").forEach(b=>{ b.onclick = ()=>{ homeSport_ = b.getAttribute("data-hsport"); renderHomeView_(true); }; });
}
setInterval(()=>{ try{ renderHomeView_(); }catch(e){} }, 15000);

// Abre o Início por defeito para quem só vê (público), no Modo Modalidades.
function openHomeByDefault_(){
  try{
    if(READONLY_MODE && typeof currentCompMode === "function" && currentCompMode() === "matches") setView("inicio");
  }catch(e){}
}
