// ===================== ECRÃ "INÍCIO" (Modo Modalidades) =====================
// Ecrã de abertura, feito a partir da proposta de design: próximo jogo em destaque, "Esta semana",
// últimos resultados e as modalidades. É só leitura de dados que já existem (EVENTS, getEv, CEV_LIVE);
// o Calendário continua igual, noutro separador.
let homeSig_ = "";
function renderHomeView_(force){
  const host = document.getElementById("homeView");
  if(!host || host.style.display === "none") return;
  if(typeof EVENTS === "undefined") return;
  const esc = s => (typeof liveEsc_ === "function") ? liveEsc_(s) : String(s == null ? "" : s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const now = new Date();
  const WD = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];
  const liveOf = ev => { const j = (typeof cevLiveFor_ === "function") ? cevLiveFor_(ev) : null; return !!(j && j.estado === "vivo"); };
  const hasRes = ev => { const st = (typeof getEv === "function" && getEv(ev.id)) || {}; return !!(st.resultado && String(st.resultado).trim()); };
  const colorOf = sp => (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[sp]) || "#5BB4F0";
  const withD = EVENTS.filter(ev=>ev.sport && ev.day).map(ev=>({ ev, d: new Date(ev.day + "T" + (ev.t || "00:00") + ":00") })).filter(x=>!isNaN(x.d));
  const upcoming = withD.filter(x=>{
    if(x.d >= now) return true;
    return !hasRes(x.ev) && (liveOf(x.ev) || (typeof isLiveNow_ === "function" && isLiveNow_(x.ev)));
  }).sort((a, b)=>a.d - b.d);
  const done = withD.filter(x=>hasRes(x.ev)).sort((a, b)=>b.d - a.d);

  const oppOf = ev => { const t = postTeams_(ev); return (t.home === "FC Porto") ? t.away : t.home; };
  const longDate = d => { const m = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]; const w = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]; return w[d.getDay()] + ", " + d.getDate() + " de " + m[d.getMonth()]; };
  const dayDiff = d => { const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return Math.round((b - a) / 86400000); };

  const sig = JSON.stringify([upcoming.slice(0, 8).map(x=>[x.ev.id, x.ev.t, x.ev.watchUrl, liveOf(x.ev)]), done.slice(0, 3).map(x=>[x.ev.id, (getEv(x.ev.id) || {}).resultado]), new Date().getHours(), new Date().getMinutes() - (new Date().getMinutes() % 5), activeSport]);
  if(!force && sig === homeSig_) return;
  homeSig_ = sig;

  let html = "";
  // ---- Próximo jogo (ou jogo a decorrer)
  const hero = upcoming[0];
  let left = "";
  if(hero){
    const ev = hero.ev, d = hero.d;
    const live = hero.d < now;
    const diff = dayDiff(d);
    const pill = live ? "AO VIVO" : (typeof formatCountdownMain === "function" ? formatCountdownMain(diff) : "");
    const detail = [ev.detail, ev.phase].filter(Boolean).join(" · ");
    const t = postTeams_(ev);
    left = `<div class="hv-hero${live ? " is-live" : ""}">
      <div class="hv-hero-top"><span class="hv-kicker">${live ? "A decorrer" : "Próximo jogo"}</span><span class="hv-pill">${esc(pill)}</span></div>
      <div class="hv-hero-sport">${esc(ev.sport)}${detail ? " · " + esc(detail) : ""}</div>
      <div class="hv-hero-match">${esc(t.home)} <span class="hv-vs">vs</span> ${esc(t.away)}</div>
      <div class="hv-hero-meta"><span>${esc(longDate(d))}${ev.t ? " · " + esc(ev.t) : ""}</span>${ev.venue ? `<span>${esc(ev.venue)}</span>` : ""}</div>
      <div class="hv-hero-actions">
        <button type="button" class="hv-btn hv-btn-main" data-go="${esc(ev.id)}">Ver jogo</button>
        ${ev.watchUrl ? `<a class="hv-btn hv-btn-ghost" href="${esc(ev.watchUrl)}" target="_blank" rel="noopener">📺 Ver transmissão</a>` : ""}
      </div>
    </div>`;
  }else{
    left = `<div class="hv-hero"><div class="hv-hero-top"><span class="hv-kicker">Próximo jogo</span></div><div class="hv-hero-match" style="font-size:26px;">Sem jogos marcados</div><div class="hv-hero-meta"><span>Volta cá em breve.</span></div></div>`;
  }

  // ---- Esta semana
  const rest = upcoming.slice(hero ? 1 : 0);
  const within = rest.filter(x=>dayDiff(x.d) <= 7);
  const weekList = (within.length ? within : rest).slice(0, 6);
  const weekTitle = within.length ? "Esta semana" : "Próximos jogos";
  const rows = weekList.map(x=>{
    const ev = x.ev;
    const c = colorOf(ev.sport);
    return `<button type="button" class="hv-row" data-go="${esc(ev.id)}" style="--sc:${c};">
      <span class="hv-date"><b>${x.d.getDate()}</b><i>${WD[x.d.getDay()]}</i></span>
      <span class="hv-row-body"><span class="hv-row-sport">${esc(ev.sport)}</span><span class="hv-row-match">vs ${esc(oppOf(ev))}</span></span>
      <span class="hv-row-time">${esc(ev.t || "")}</span>
    </button>`;
  }).join("");
  const week = `<div class="hv-panel">
    <div class="hv-panel-head"><h3>${weekTitle}</h3><button type="button" class="hv-link" data-cal="1">Ver calendário</button></div>
    ${rows || '<div class="hv-empty">Sem mais jogos marcados.</div>'}
  </div>`;

  html += `<div class="hv-top">${left}${week}</div>`;

  // ---- Últimos resultados
  if(done.length){
    const res = done.slice(0, 3).map(x=>{
      const ev = x.ev, st = getEv(ev.id) || {};
      const t = postTeams_(ev);
      const tag = st.resultTag === "win" ? ["V", "win"] : st.resultTag === "loss" ? ["D", "loss"] : st.resultTag === "draw" ? ["E", "draw"] : null;
      return `<button type="button" class="hv-row hv-res" data-go="${esc(ev.id)}" style="--sc:${colorOf(ev.sport)};">
        ${tag ? `<span class="hv-tag hv-tag-${tag[1]}">${tag[0]}</span>` : '<span class="hv-tag"></span>'}
        <span class="hv-row-body"><span class="hv-row-sport">${esc(ev.sport)} · ${esc(formatShortDate(ev.day))}</span><span class="hv-row-match">${esc(t.home)} <b>${esc(String(st.resultado).trim())}</b> ${esc(t.away)}</span></span>
      </button>`;
    }).join("");
    html += `<div class="hv-panel"><div class="hv-panel-head"><h3>Últimos resultados</h3><button type="button" class="hv-link" data-hist="1">Ver histórico</button></div>${res}</div>`;
  }

  // ---- Modalidades
  const sports = {};
  withD.forEach(x=>{ const s = sports[x.ev.sport] = sports[x.ev.sport] || { sport: x.ev.sport, next: null }; });
  upcoming.forEach(x=>{ if(!sports[x.ev.sport].next) sports[x.ev.sport].next = x; });
  const sl = Object.values(sports).sort((a, b)=>{ if(a.next && b.next) return a.next.d - b.next.d; if(a.next) return -1; if(b.next) return 1; return a.sport.localeCompare(b.sport, "pt"); });
  if(sl.length){
    const cells = sl.map(s=>`<button type="button" class="hv-sport" data-sport="${esc(s.sport)}" style="--sc:${colorOf(s.sport)};">
      <span class="hv-sport-name">${esc(s.sport)}</span>
      <span class="hv-sport-next">${s.next ? esc((s.next.d < now ? "A decorrer" : formatShortDate(s.next.ev.day)) + (s.next.ev.t ? " · " + s.next.ev.t : "")) : "Sem jogos marcados"}</span>
    </button>`).join("");
    html += `<div class="hv-panel hv-panel-sports"><div class="hv-panel-head"><h3>Modalidades</h3></div><div class="hv-sports">${cells}</div></div>`;
  }

  host.innerHTML = html;
  host.querySelectorAll("[data-go]").forEach(b=>{ b.onclick = ()=>goToEventCard(b.getAttribute("data-go")); });
  host.querySelectorAll("[data-cal]").forEach(b=>{ b.onclick = ()=>{ activeSport = "Todos"; setView("calendario"); renderFilters(); renderProgress(); renderTimeline(); window.scrollTo(0, 0); }; });
  host.querySelectorAll("[data-hist]").forEach(b=>{ b.onclick = ()=>{ setView("historico"); window.scrollTo(0, 0); }; });
  host.querySelectorAll(".hv-sport").forEach(b=>{ b.onclick = ()=>openSportPage_(b.getAttribute("data-sport")); });
}
setInterval(()=>{ try{ renderHomeView_(); }catch(e){} }, 15000);

// Abre o Início por defeito para quem só vê (público), no Modo Modalidades.
function openHomeByDefault_(){
  try{
    if(READONLY_MODE && typeof currentCompMode === "function" && currentCompMode() === "matches") setView("inicio");
  }catch(e){}
}
