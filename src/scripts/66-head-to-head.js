// ===================== FRENTE A FRENTE (v264) =====================
// Histórico do FC Porto contra um adversário numa modalidade, somando TODAS as competições (épocas) guardadas no site.
// Usa só dados que o site já tem (jogos com resultado). Dois sítios: cartão na página do jogo e separador na página da modalidade.
const H2H_OPEN_ = {}; // chaves abertas ("Modalidade|adversário") — sobrevive a redesenhos da página

function h2hUnit_(sport){ return sport === "Basquetebol" ? "Pontos" : sport === "Voleibol" ? "Sets" : "Golos"; }

// todos os jogos com resultado de uma modalidade (todas as competições em modo Modalidades), do mais recente para o mais antigo
function h2hDoneAll_(sport){
  const out = [];
  try{
    if(typeof ALL === "undefined" || !ALL || !Array.isArray(ALL.competitions)) return out;
    ALL.competitions.forEach(c=>{
      if(!c || c.mode !== "matches") return;
      const ativa = c.id === activeCompId;
      const evs = ativa ? EVENTS : ((ALL.data[c.id] || {}).events || []);
      const sts = ativa ? state : ((ALL.data[c.id] || {}).status || {});
      (evs || []).forEach(e=>{
        if(!e || e.sport !== sport) return;
        const st = sts && sts[e.id];
        if(!st || !st.resultado || !String(st.resultado).trim()) return;
        const m = String(st.resultado).match(/(\d+)\s*[-–:]\s*(\d+)/);
        if(!m) return;
        const fora = e.local === "fora", a = Number(m[1]), b = Number(m[2]);
        const fcp = fora ? b : a, adv = fora ? a : b;
        const tag = (typeof resultKind_ === "function" ? resultKind_(e, st) : "") || (fcp > adv ? "win" : fcp < adv ? "loss" : "draw");
        out.push({ ev: e, st: st, comp: c, ativa: ativa, fcp: fcp, adv: adv, tag: tag, when: pgWhen_(e) });
      });
    });
  }catch(e){}
  return out.sort((x, y)=>y.when - x.when);
}

function h2hStats_(list){
  const s = { w: 0, d: 0, l: 0, gf: 0, ga: 0, best: null, worst: null, streak: null };
  list.forEach(m=>{
    if(m.tag === "win") s.w++; else if(m.tag === "loss") s.l++; else s.d++;
    s.gf += m.fcp; s.ga += m.adv;
    const dif = m.fcp - m.adv;
    if(m.tag === "win" && (!s.best || dif > s.best.fcp - s.best.adv)) s.best = m;
    if(m.tag === "loss" && (!s.worst || dif < s.worst.fcp - s.worst.adv)) s.worst = m;
  });
  if(list.length){ // a lista vem do mais recente para o mais antigo
    const t = list[0].tag; let n = 0;
    for(let i = 0; i < list.length && list[i].tag === t; i++) n++;
    s.streak = { tag: t, n: n };
  }
  return s;
}

function h2hDate_(m){
  const d = new Date(m.ev.day + "T12:00:00");
  return isNaN(d) ? "" : String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getFullYear()).slice(2);
}

function h2hRow_(m, clk){
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const t = postTeams_(m.ev);
  const det = [m.ev.detail, m.ev.phase].filter(Boolean).join(" · ");
  const ep = (m.comp && m.comp.name) ? m.comp.name : "";
  const tg = m.tag === "win" ? "V" : m.tag === "loss" ? "D" : "E";
  const corpo = `<span class="hv-date h2h-date"><i>${esc(h2hDate_(m))}</i></span>
    <span class="hv-row-body"><span class="hv-row-sport">${esc([det, ep].filter(Boolean).join(" · ") || sportShow_(m.ev.sport))}</span><span class="hv-row-match">${esc(t.home)} <b>${esc(String(m.st.resultado).trim())}</b> ${esc(t.away)}</span></span>
    <span class="hv-tag hv-tag-${m.tag}">${tg}</span>`;
  return clk && m.ativa
    ? `<button type="button" class="hv-row h2h-row" data-pgjogo="${esc(m.ev.id)}" data-go="${esc(m.ev.id)}">${corpo}</button>`
    : `<div class="hv-row h2h-row h2h-static">${corpo}</div>`;
}

function h2hSumHtml_(s){
  return `<div class="h2h-sum"><div class="h2h-cell win"><b>${s.w}</b><span>${s.w === 1 ? "vitória" : "vitórias"}</span></div><div class="h2h-cell draw"><b>${s.d}</b><span>${s.d === 1 ? "empate" : "empates"}</span></div><div class="h2h-cell loss"><b>${s.l}</b><span>${s.l === 1 ? "derrota" : "derrotas"}</span></div></div>`;
}

function h2hLinesHtml_(sport, s, n){
  const bits = [];
  bits.push(`<div class="h2h-line"><i>${h2hUnit_(sport)}</i><b>${s.gf} – ${s.ga}</b></div>`);
  if(s.streak && s.streak.n >= 2){
    const nome = s.streak.tag === "win" ? (s.streak.n + " vitórias seguidas") : s.streak.tag === "loss" ? (s.streak.n + " derrotas seguidas") : (s.streak.n + " empates seguidos");
    bits.push(`<div class="h2h-line"><i>Série atual</i><b>${nome}</b></div>`);
  }
  if(s.best && n >= 2) bits.push(`<div class="h2h-line"><i>Maior vitória</i><b>${s.best.fcp} – ${s.best.adv} <em>(${h2hDate_(s.best)})</em></b></div>`);
  if(s.worst && n >= 2) bits.push(`<div class="h2h-line"><i>Maior derrota</i><b>${s.worst.fcp} – ${s.worst.adv} <em>(${h2hDate_(s.worst)})</em></b></div>`);
  return bits.join("");
}

// jogos anteriores contra o mesmo adversário (sem o jogo aberto)
function h2hMeetings_(ev){
  return h2hDoneAll_(ev.sport).filter(m=>m.ev.id !== ev.id && pgSameTeam_(m.ev.athlete, ev.athlete));
}

// cartão da página do jogo
function h2hHtml_(ev){
  try{
    if(!ev || !ev.athlete) return "";
    const lista = h2hMeetings_(ev);
    if(!lista.length) return "";
    const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
    const s = h2hStats_(lista), chave = ev.sport + "|" + pgNorm_(ev.athlete);
    const VER = 3;
    const vis = lista.slice(0, VER), resto = lista.slice(VER);
    return `<div class="hv-panel pg-card h2h-card"><div class="hv-panel-head"><h3>Frente a frente</h3><span class="h2h-n">${lista.length} ${lista.length === 1 ? "jogo" : "jogos"}</span></div>
      ${h2hSumHtml_(s)}
      <div class="h2h-lines">${h2hLinesHtml_(ev.sport, s, lista.length)}</div>
      ${vis.map(m=>h2hRow_(m, true)).join("")}
      ${resto.length ? `<details class="h2h-more" data-h2hk="${esc(chave)}"${H2H_OPEN_[chave] ? " open" : ""}><summary>Ver os outros ${resto.length}</summary>${resto.map(m=>h2hRow_(m, true)).join("")}</details>` : ""}
    </div>`;
  }catch(e){ return ""; }
}

// assinatura para a página do jogo saber que o cartão mudou
function h2hSig_(ev){
  try{ return h2hMeetings_(ev).map(m=>m.ev.id + ":" + String(m.st.resultado).trim()).join(","); }catch(e){ return ""; }
}

// ligação dos "Ver os outros N" (guarda aberto/fechado)
function h2hWire_(host){
  if(!host) return;
  host.querySelectorAll("details[data-h2hk]").forEach(d=>{
    d.addEventListener("toggle", ()=>{ H2H_OPEN_[d.getAttribute("data-h2hk")] = d.open; });
  });
}

// separador "Frente a frente" da página da modalidade: um bloco por adversário
function h2hSportPanelHtml_(sport){
  try{
    const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
    const todos = h2hDoneAll_(sport);
    if(!todos.length) return '<div class="hv-panel"><div class="hv-empty">Ainda sem jogos com resultado nesta modalidade.</div></div>';
    const grupos = [];
    todos.forEach(m=>{
      let g = grupos.find(x=>pgSameTeam_(x.nome, m.ev.athlete));
      if(!g){ g = { nome: String(m.ev.athlete || "").trim() || "Adversário", jogos: [] }; grupos.push(g); }
      g.jogos.push(m);
    });
    grupos.sort((a, b)=>(b.jogos.length - a.jogos.length) || (b.jogos[0].when - a.jogos[0].when));
    const cor = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[sport]) || "#e3b23c";
    const blocos = grupos.map(g=>{
      const s = h2hStats_(g.jogos), chave = sport + "|" + pgNorm_(g.nome);
      const nomeHtml = (typeof crestName_ === "function") ? crestName_(g.jogos[0].ev, g.nome) : esc(g.nome);
      return `<details class="h2h-opp" data-h2hk="${esc(chave)}"${H2H_OPEN_[chave] ? " open" : ""}><summary>
        <span class="h2h-opp-n">${nomeHtml}</span>
        <span class="h2h-opp-r"><span class="hv-tag hv-tag-win">${s.w}</span><span class="hv-tag hv-tag-draw">${s.d}</span><span class="hv-tag hv-tag-loss">${s.l}</span></span>
      </summary><div class="h2h-opp-b">${h2hLinesHtml_(sport, s, g.jogos.length)}${g.jogos.map(m=>h2hRow_(m, true)).join("")}</div></details>`;
    }).join("");
    return `<div class="hv-panel h2h-panel" style="--sc:${cor};"><div class="hv-panel-head"><h3>Frente a frente</h3><span class="h2h-n">${grupos.length} ${grupos.length === 1 ? "adversário" : "adversários"}</span></div>
      <div class="pg-sub h2h-legend">Vitórias, empates e derrotas do FC Porto contra cada adversário, em todas as épocas guardadas.</div>${blocos}</div>`;
  }catch(e){ return ""; }
}
