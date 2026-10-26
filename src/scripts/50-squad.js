// ===================== PLANTEL (v170) =====================
// Separador "Plantel" da página de modalidade: jogadores (número, nome, posição, foto) e equipa técnica. Fotos: autorizadas pelo clube (v171); sem foto (ou se falhar) fica o círculo com o número.
// Vem do site oficial do FC Porto, lido pelo Apps Script v120 (campo `plantel` do doGet).
let PLANTEL = {}; // { "Modalidade": { t, j:[[número,nome,posição]], s:[[nome,cargo]] } }
const SQUAD_POS_ORDER_ = ["guarda-redes", "defesa", "medio", "avancado"];
function squadAvatar_(foto, numTxt, esc, staff){
  if(foto) return `<span class="sq-av${staff ? " sq-staff" : ""}"><img src="${esc(foto)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg');this.remove();"><i>${esc(numTxt)}</i></span>`;
  return `<span class="sq-num${staff ? " sq-staff" : ""}">${esc(numTxt)}</span>`;
}
function squadHas_(sport){ return !!(PLANTEL && PLANTEL[sport] && Array.isArray(PLANTEL[sport].j) && PLANTEL[sport].j.length); }
function squadPanelHtml_(sport){
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  if(!squadHas_(sport)){
    if(typeof DATA_FRESH_ !== "undefined" && !DATA_FRESH_ && typeof skelHtml_ === "function") return skelHtml_(6);
    return '<div class="hv-panel"><div class="hv-empty">Plantel ainda não disponível para esta modalidade.</div></div>';
  }
  const p = PLANTEL[sport];
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const grupos = [];
  p.j.forEach((r, idx)=>{ r._i = idx; });
  p.j.forEach(r=>{
    const pos = r[2] || "Jogadores";
    let g = grupos.find(x=>x.pos === pos);
    if(!g){ g = { pos, rows: [] }; grupos.push(g); }
    g.rows.push(r);
  });
  const rank = g => { const i = SQUAD_POS_ORDER_.indexOf(norm(g.pos)); return i < 0 ? 99 : i; };
  grupos.sort((a, b)=>rank(a) - rank(b)); // estável: as posições desconhecidas ficam pela ordem em que aparecem
  const num = r => { const n = parseInt(r[0], 10); return isNaN(n) ? 999 : n; };
  const jog = grupos.map(g=>{
    g.rows.sort((a, b)=>num(a) - num(b));
    return `<div class="hv-panel sq-grp"><div class="hv-panel-head"><h3>${esc(g.pos)}</h3><span class="sq-n">${g.rows.length}</span></div>${g.rows.map(r=>`<button type="button" class="sq-row sq-click" data-sqp="${r._i}">${squadAvatar_(r[3], r[0] || "–", esc, false)}<span class="sq-name">${esc(r[1])}</span><span class="sq-go">›</span></button>`).join("")}</div>`;
  }).join("");
  const staff = (p.s && p.s.length) ? `<div class="hv-panel sq-grp"><div class="hv-panel-head"><h3>Equipa técnica</h3><span class="sq-n">${p.s.length}</span></div>${p.s.map(r=>`<div class="sq-row">${squadAvatar_(r[2], "•", esc, true)}<span class="sq-name">${esc(r[0])}${r[1] ? `<span class="sq-role">${esc(r[1])}</span>` : ""}</span></div>`).join("")}</div>` : "";
  return jog + staff + '<div class="st-foot">Fonte: fcporto.pt' + (p.t && typeof standingsAgo_ === "function" ? " · atualizado " + standingsAgo_(p.t) : "") + "</div>";
}

// ===================== ESTATÍSTICAS DO JOGADOR (v174) =====================
// Ao tocar num jogador do plantel abre uma folha com os totais da época e o jogo a jogo, a partir do que é registado em cada jogo
// (📊 estatísticas / ⚽ marcadores e 👥 quem jogou). Os nomes do plantel (clube) e os escritos à mão são ligados de forma tolerante.
function sqNorm_(s){ return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
// `todos` = nomes completos do plantel (para só aceitar um nome só com apelido/primeiro nome quando não é ambíguo)
function sqNameMatch_(full, other, todos){
  const a = sqNorm_(full), b = sqNorm_(other);
  if(!a || !b) return false;
  if(a === b) return true;
  const ta = a.split(" "), tb = b.split(" ");
  const sub = (x, y)=>x.every(t=>y.indexOf(t) >= 0); // todas as palavras de x estão em y
  if(tb.length >= 2 && sub(tb, ta)) return true; // "Francisco Moura" dentro de "Francisco Jorge Moura"
  if(ta.length >= 2 && sub(ta, tb)) return true;
  // "F. Moura": inicial + último apelido
  if(tb.length >= 2 && ta[ta.length - 1] === tb[tb.length - 1] && tb[0].length === 1 && ta[0][0] === tb[0]) return true;
  if(tb.length === 1){ // só um nome: só serve se for único no plantel
    const quem = (todos || []).filter(n=>{ const t = sqNorm_(n).split(" "); return t.indexOf(tb[0]) >= 0; });
    return ta.indexOf(tb[0]) >= 0 && quem.length <= 1;
  }
  return false;
}
function playerSeasonStats_(sport, nome){
  const todos = (PLANTEL[sport] && PLANTEL[sport].j || []).map(r=>r[1]);
  const igual = n=>sqNameMatch_(nome, n, todos);
  const goalsMode = (typeof MARCADORES_LABEL_SPORTS !== "undefined" && MARCADORES_LABEL_SPORTS.has(sport));
  const tipos = goalsMode ? ["Golos"] : getStatTypesFor(sport);
  const totais = {}; tipos.forEach(t=>{ totais[t] = 0; });
  const jogos = [];
  (typeof EVENTS !== "undefined" ? EVENTS : []).filter(ev=>ev.sport === sport && ev.day).forEach(ev=>{
    const rows = (ev.playerStats || []).filter(p=>p.team !== "adv" && p.name && igual(p.name));
    const presente = (Array.isArray(ev.presentes) ? ev.presentes : []).some(igual);
    if(!rows.length && !presente) return;
    const g = { ev, vals: {}, minutos: [] };
    if(goalsMode){
      rows.forEach(r=>{ g.vals.Golos = (g.vals.Golos || 0) + 1; if(r.minute != null) g.minutos.push(r.minute); });
      if(g.vals.Golos) totais.Golos += g.vals.Golos;
    }else{
      rows.forEach(r=>{ tipos.forEach(t=>{ const v = r.stats && r.stats[t]; if(v != null && !isNaN(v)){ g.vals[t] = (g.vals[t] || 0) + Number(v); totais[t] += Number(v); } }); });
    }
    jogos.push(g);
  });
  jogos.sort((a, b)=>String(b.ev.day).localeCompare(String(a.ev.day)));
  return { tipos, totais, jogos };
}
function playerSheetHtml_(sport, r){
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const s = playerSeasonStats_(sport, r[1]);
  const comValor = s.tipos.filter(t=>s.totais[t] > 0);
  const media = sport === "Basquetebol"; // no Basquetebol mostra-se a média por jogo (total em pequeno)
  const fmt = n=>{ const x = Math.round(n * 10) / 10; return String(x).replace(".", ","); };
  const tiles = `<div class="ps-tile"><b>${s.jogos.length}</b><i>Jogos</i></div>` + comValor.map(t=>media
    ? `<div class="ps-tile"><b>${fmt(s.totais[t] / s.jogos.length)}</b><i>${esc(t)} / jogo</i><u>total ${s.totais[t]}</u></div>`
    : `<div class="ps-tile"><b>${s.totais[t]}</b><i>${esc(t)}</i></div>`).join("");
  // por competição (texto "Competição" de cada jogo: Campeonato, Amigável, …) — só se houver mais do que uma
  const comps = [];
  s.jogos.forEach(g=>{
    const nome = (g.ev.detail && String(g.ev.detail).trim()) || "Sem competição";
    const k = sqNorm_(nome);
    let c = comps.find(x=>x.k === k);
    if(!c){ c = { k, nome, n: 0, tot: {} }; comps.push(c); }
    c.n++;
    comValor.forEach(t=>{ c.tot[t] = (c.tot[t] || 0) + (g.vals[t] || 0); });
  });
  comps.sort((a, b)=>b.n - a.n);
  const porComp = comps.length > 1 ? `<div class="hv-panel"><div class="hv-panel-head"><h3>Por competição</h3></div>${comps.map(c=>{
    const bits = comValor.map(t=>media ? `${esc(t)} <b>${fmt(c.tot[t] / c.n)}</b> / jogo` : `${esc(t)} <b>${c.tot[t]}</b>`).join(" · ");
    return `<div class="ps-comp"><span class="ps-cn">${esc(c.nome)}</span><span class="ps-cj">${c.n} jogo${c.n === 1 ? "" : "s"}</span>${bits ? `<span class="ps-cv">${bits}</span>` : ""}</div>`;
  }).join("")}</div>` : "";
  const lista = s.jogos.map(g=>{
    const st = (typeof getEv === "function" && getEv(g.ev.id)) || {};
    const vals = s.tipos.filter(t=>g.vals[t]).map(t=>`${g.vals[t]} ${esc(t.toLowerCase())}`).join(" · ");
    const min = g.minutos.length ? ` (${g.minutos.map(m=>esc(m) + "'").join(", ")})` : "";
    const res = st.resultado && String(st.resultado).trim();
    return `<div class="ps-game"><span class="ps-d">${esc(typeof formatShortDate === "function" ? formatShortDate(g.ev.day) : g.ev.day)}</span><span class="ps-a">${esc(g.ev.athlete || "")}${res ? ` <i>${esc(res)}</i>` : ""}</span><span class="ps-v">${vals ? vals + min : "—"}</span></div>`;
  }).join("");
  const vazio = !s.jogos.length ? '<div class="hv-empty">Ainda sem estatísticas registadas para este jogador.</div>' : "";
  const nota = (sport === "Voleibol") ? '<div class="hv-empty">No Voleibol só se registam os pontos de cada set, não os de cada jogadora.</div>' : "";
  return `<div class="ps-head">${squadAvatar_(r[3], r[0] || "–", esc, false)}<div><h2>${esc(r[1])}</h2><span>${esc(r[2] || "")}${r[0] ? " · Nº " + esc(r[0]) : ""}</span></div></div>
    <div class="ps-tiles">${tiles}</div>${nota}${vazio}${porComp}${lista ? `<div class="hv-panel"><div class="hv-panel-head"><h3>Jogo a jogo</h3></div>${lista}</div>` : ""}`;
}
(function(){
  const box = document.createElement("div");
  box.id = "playerSheet"; box.className = "search-sheet"; box.style.display = "none";
  box.innerHTML = '<div class="ss-bar"><span style="flex:1"></span><button type="button" class="ss-close" id="psClose">Fechar</button></div><div class="ss-body" id="psBody"></div>';
  document.body.appendChild(box);
  const close_ = ()=>{ box.style.display = "none"; document.body.classList.remove("search-open"); };
  window.openPlayerSheet_ = function(sport, idx){
    const r = PLANTEL[sport] && PLANTEL[sport].j && PLANTEL[sport].j[idx];
    if(!r) return;
    box.querySelector("#psBody").innerHTML = playerSheetHtml_(sport, r);
    box.style.display = "block"; document.body.classList.add("search-open"); box.scrollTop = 0;
  };
  box.querySelector("#psClose").onclick = close_;
  document.addEventListener("keydown", e=>{ if(e.key === "Escape" && box.style.display !== "none") close_(); });
})();

// posição de um nome (como escrito nos marcadores) na lista do plantel, ou -1
function squadIndexOf_(sport, nome){
  const j = (PLANTEL[sport] && PLANTEL[sport].j) || [];
  const todos = j.map(r=>r[1]);
  for(let i = 0; i < j.length; i++) if(sqNameMatch_(j[i][1], nome, todos)) return i;
  return -1;
}
