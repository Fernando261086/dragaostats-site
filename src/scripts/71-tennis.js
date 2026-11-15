// ===================== PAINEL «🎾 TÉNIS» (v284, só modo edição, privado) =====================
// Os dados NÃO vêm no GET público: o botão pede-os por POST ao Apps Script (v189) com a password de admin
// ({getTenis:true, adminPassword}). Sem a password certa não há dados. Fontes: Sofascore e API da WTA (ver CLAUDE.md).
function tnSyncBtn_(){ // v287: o separador «Rankings» só existe dentro de uma competição de ténis (só edição)
  const b = document.getElementById("viewRankingsBtn"); if(!b) return;
  const on = !READONLY_MODE && typeof isTenis_ === "function" && isTenis_();
  b.style.display = on ? "" : "none";
  if(!on && window.__curView_ === "tenis-rank" && typeof setView === "function") setView("calendario");
}

const TN_ = { data: null, tab: "rank", gen: "M", sel: null, msg: "", fTab: "res", carr: {}, cat: "todos", rh: {}, rhSel: "ambos", rhPer: "tudo", rhCh: null, allC: { run: false, done: 0, total: 0, erro: "" } }; // v294: fTab = «res»umo | «carr»eira
function tnEsc_(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

async function tnPost_(body){
  const r = await fetch(STORE_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ adminPassword: getAdminPassword() }, body)) });
  return await r.json();
}

function tnMove_(p){ // variação do ranking face à semana anterior (positivo = subiu)
  if(!p.r || !p.pr) return "";
  const d = p.pr - p.r;
  return d > 0 ? `<span class="tn-up">▲${d}</span>` : d < 0 ? `<span class="tn-dn">▼${-d}</span>` : `<span class="tn-eq">=</span>`;
}

function tnJogadores_(g){
  const l = ((TN_.data && TN_.data.jogadores) || []).filter(p => (p.g || "") === g || (!p.g && g === "M"));
  return l.sort((a, b) => (a.r || 99999) - (b.r || 99999));
}

function tnRankingsHtml_(){
  const g = TN_.gen, L = tnJogadores_(g);
  const top = ((TN_.data.top || {})[g] || []).slice(0, 10);
  let h = `<div class="tn-seg"><button type="button" class="sh-chip ${g==="M"?"on":""}" data-gen="M">ATP · Masculino</button><button type="button" class="sh-chip ${g==="F"?"on":""}" data-gen="F">WTA · Feminino</button></div>`;
  h += `<h4 class="tn-h">Portugueses · singulares</h4>`;
  const LS = L.filter(p => p.r);
  if(!L.length) h += `<p class="tn-empty">Ainda sem dados. Carrega em «🔄 Atualizar».</p>`;
  else if(!LS.length) h += `<p class="tn-empty">Nenhum tenista com ranking de singulares.</p>`;
  else h += `<div class="tn-list">` + LS.map(p => `<button type="button" class="tn-row" data-pid="${p.id}"><span class="tn-pos">${p.r ? "#" + p.r : "—"}</span><span class="tn-nm">${tnEsc_(p.n)}</span><span class="tn-sub">${p.p ? p.p + " pts" : ""}${p.lr && p.lr !== p.r ? " · ao vivo #" + p.lr : ""}</span><span class="tn-mv">${tnMove_(p)}</span></button>`).join("") + `</div>`;
  // pares
  const pares = L.map(p => ({ p, d: p.d ? { r: p.d[0], pts: p.d[1], mv: p.d[2] } : (p.m && p.m.pm ? { r: p.m.pm.r, pts: p.m.pm.pts, man: 1 } : null) })).filter(x => x.d).sort((a, b) => a.d.r - b.d.r);
  h += `<h4 class="tn-h">Portugueses · pares</h4>`;
  h += pares.length ? `<div class="tn-list">` + pares.map(x => `<button type="button" class="tn-row" data-pid="${x.p.id}"><span class="tn-pos">#${x.d.r}</span><span class="tn-nm">${tnEsc_(x.p.n)}</span><span class="tn-sub">${x.d.pts ? x.d.pts + " pts" : ""}${x.d.man ? " · à mão" : ""}</span><span class="tn-mv">${x.d.mv > 0 ? `<span class="tn-up">▲${x.d.mv}</span>` : x.d.mv < 0 ? `<span class="tn-dn">▼${-x.d.mv}</span>` : x.d.mv === 0 ? `<span class="tn-eq">=</span>` : ""}</span></button>`).join("") + `</div>`
    : `<p class="tn-empty">Sem pares encontrados. Acrescenta o tenista em «Atletas» e, se for dos mais bem classificados, os pares aparecem sozinhos.</p>`;
  h += `<h4 class="tn-h">Top 10 do mundo</h4>` + (top.length ? `<div class="tn-list tn-top">` + top.map(t => `<div class="tn-row tn-static"><span class="tn-pos">#${t[0]}</span><span class="tn-nm">${tnEsc_(t[1])}</span><span class="tn-sub">${t[3] != null ? t[3] + " pts" : ""}</span><span class="tn-mv">${tnEsc_(t[2])}</span></div>`).join("") + `</div>` : `<p class="tn-empty">—</p>`);
  return h;
}

function tnAtletasHtml_(){
  const all = ((TN_.data && TN_.data.jogadores) || []).slice().sort((a, b) => (a.r || 99999) - (b.r || 99999));
  let h = `<div class="tn-add"><button type="button" class="sh-chip on" id="tnAdd">➕ Acrescentar</button></div>`;
  if(TN_.msg) h += `<p class="tn-msg">${tnEsc_(TN_.msg)}</p>`;
  h += `<div class="tn-list">` + all.map(p => `<button type="button" class="tn-row" data-pid="${p.id}"><span class="tn-pos">${p.r ? "#" + p.r : p.d ? "P#" + p.d[0] : "—"}</span><span class="tn-nm">${tnEsc_(p.n)}</span><span class="tn-sub">${p.g === "F" ? "WTA" : "ATP"}${p.man ? " · à mão" : p.x ? " · acrescentado" : ""}</span><span class="tn-mv">${tnMove_(p)}</span></button>`).join("") + `</div>`;
  return h;
}

function tnChartSvg_(h){ // evolução do ranking (melhor = mais acima); pontos semanais
  if(!h || h.length < 2) return `<p class="tn-empty">O gráfico começa a encher: guardamos uma foto do ranking por semana (há ${h ? h.length : 0}).</p>`;
  const W = 320, H = 120, P = 10, vals = h.map(x => x[1]), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
  const span = Math.max(1, mx - mn), X = i => P + (W - 2 * P) * i / (h.length - 1), Y = v => P + (H - 2 * P) * (v - mn) / span;
  const pts = h.map((x, i) => X(i).toFixed(1) + "," + Y(x[1]).toFixed(1)).join(" ");
  return `<svg class="tn-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do ranking"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2"/>` +
    h.map((x, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(x[1]).toFixed(1)}" r="2.5" fill="currentColor"/>`).join("") +
    `<text x="${P}" y="${H - 1}" class="tn-ct">#${h[0][1]} · ${tnEsc_(h[0][0].slice(5))}</text><text x="${W - P}" y="${H - 1}" text-anchor="end" class="tn-ct">#${h[h.length-1][1]} · ${tnEsc_(h[h.length-1][0].slice(5))}</text></svg>`;
}

function tnEstado_(r){ // r = [ts, adversário, V/D/A/-, sets, fase, torneio, categoria, piso, nota]
  if(r[2] === "A") return { t: "A decorrer", c: "tn-live" };
  const final = /^final$/i.test(r[4] || "");
  if(r[2] === "V") return final ? { t: "🏆 Campeão", c: "tn-w" } : { t: "Passou", c: "tn-w" };
  if(r[2] === "D") return final ? { t: "Vice-campeão", c: "tn-l2" } : { t: "Não passou", c: "tn-l" };
  return { t: "—", c: "" };
}
const TN_FASES_ = { "Round of 128": "1.ª ronda", "Round of 64": "1.ª ronda", "Round of 32": "2.ª ronda", "Round of 16": "Oitavos", "Quarterfinals": "Quartos", "Semifinals": "Meias-finais", "Final": "Final", "Qualification": "Qualificação" };

function tnFichaHtml_(p){
  const m = p.m || {};
  let h = `<button type="button" class="sh-chip tn-back">‹ Voltar</button><h3 class="tn-name">${tnEsc_(p.n)} <small>${p.g === "F" ? "WTA" : "ATP"}</small></h3>`;
  const temCarr = p.id > 0 && !p.man;
  const temRank = p.g !== "F"; // v296: histórico do ranking ATP (Tennis Explorer) só para homens
  if(temCarr || temRank) h += `<div class="tn-seg tn-fseg"><button type="button" class="sh-chip ${TN_.fTab !== "carr" && TN_.fTab !== "rank" ? "on" : ""}" data-ftab="res">Resumo</button>${temCarr ? `<button type="button" class="sh-chip ${TN_.fTab === "carr" ? "on" : ""}" data-ftab="carr">Carreira</button>` : ""}${temRank ? `<button type="button" class="sh-chip ${TN_.fTab === "rank" ? "on" : ""}" data-ftab="rank">Ranking</button>` : ""}</div>`;
  if(temCarr && TN_.fTab === "carr") return h + tnCarreiraHtml_(p);
  if(temRank && TN_.fTab === "rank") return h + tnRankHistHtml_(p);
  if(p.r || p.lr || p.b || p.p) h += `<div class="tn-kpis"><div><b>${p.r ? "#" + p.r : "—"}</b><small>Ranking ${tnMove_(p)}</small></div><div><b>${p.lr ? "#" + p.lr : "—"}</b><small>Ao vivo</small></div><div><b>${p.b ? "#" + p.b : "—"}</b><small>Melhor</small></div><div><b>${p.p || "—"}</b><small>Pontos</small></div></div>`;
  const dd = p.d ? { r: p.d[0], pts: p.d[1] } : (m.pm ? { r: m.pm.r, pts: m.pm.pts, man: 1 } : null);
  h += `<p class="tn-line">Pares: <b>${dd ? "#" + dd.r : "—"}</b>${dd && dd.pts ? " · " + dd.pts + " pts" : ""}${dd && dd.man ? " <small>(à mão)</small>" : ""}${!p.d ? ` <button type="button" class="tn-lnk" data-man="pm">✏️ editar</button>` : ""}</p>`;
  if (p.src === "te" && p.rd) h += `<p class="tn-line"><small>Ranking ATP de ${p.rd.slice(8,10)}.${p.rd.slice(5,7)}.${p.rd.slice(0,4)} · Tennis Explorer</small></p>`;
  h += `<p class="tn-line">Race: <b>${m.race ? "#" + m.race.r : "—"}</b>${m.race && m.race.pts ? " · " + m.race.pts + " pts" : ""} <small>(à mão)</small> <button type="button" class="tn-lnk" data-man="race">✏️ editar</button></p>`;
  h += `<h4 class="tn-h">Evolução do ranking</h4>` + tnChartSvg_(p.h);
  h += `<h4 class="tn-h">Últimos resultados</h4>`;
  const R = p.res || [];
  h += R.length ? `<div class="tn-res">` + R.map(r => { const e = tnEstado_(r); const d = new Date(r[0] * 1000);
    return `<div class="tn-g"><div class="tn-g1"><span class="tn-badge ${e.c}">${e.t}</span><span class="tn-gd">${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}</span></div><div class="tn-g2">vs ${tnEsc_(r[1])}</div><div class="tn-g3">${tnEsc_(r[3] || "")}${r[8] ? " · " + tnEsc_(r[8]) : ""}</div><div class="tn-g4">${tnEsc_(r[5])}${r[6] ? " · " + tnEsc_(r[6]) : ""}${r[4] ? " · " + tnEsc_(TN_FASES_[r[4]] || r[4]) : ""}${r[7] ? " · " + tnEsc_(r[7]) : ""}</div></div>`; }).join("") + `</div>`
    : `<p class="tn-empty">Sem jogos recentes.</p>`;
  h += `<p class="tn-line tn-small">Atualizado: ${tnEsc_(p.u || "—")}</p>`;
  if(p.man) h += `<button type="button" class="sh-chip tn-edit">✏️ Editar</button> `;
  if(p.x) h += `<button type="button" class="sh-chip tn-rm">🗑 Deixar de acompanhar</button>`;
  return h;
}

// v289+: janela «Acrescentar tenista» — nome, género, ranking de singulares e de pares (o que ficar em branco não conta)
function tnAddDialog_(p){
  const old = document.getElementById("tnAddOv"); if(old) old.remove();
  const g0 = p && p.g === "F" ? "F" : "M";
  const ov = document.createElement("div"); ov.id = "tnAddOv"; ov.className = "sh-overlay tn-ov";
  ov.innerHTML = `<div class="sh-sheet tn-dlg" role="dialog" aria-label="${p ? "Editar tenista" : "Acrescentar tenista"}">
    <div class="sh-top"><b>${p ? "Editar tenista" : "Acrescentar tenista"}</b><button type="button" class="sh-x" id="tnDX" aria-label="Fechar">✕</button></div>
    <label class="tn-fl">Nome do atleta<input id="tnFN" class="sh-in" type="text" autocomplete="off" value="${tnEsc_(p ? p.n : "")}"></label>
    <div class="tn-fl">Masculino ou feminino<div class="tn-seg"><button type="button" class="sh-chip${g0 === "M" ? " on" : ""}" data-fg="M">Masculino</button><button type="button" class="sh-chip${g0 === "F" ? " on" : ""}" data-fg="F">Feminino</button></div></div>
    <label class="tn-fl">Ranking singulares <small>(opcional)</small><input id="tnFS" class="sh-in" type="text" inputmode="numeric" placeholder="ex.: 49" value="${p && p.r && p.src !== "te" ? p.r : ""}"></label>
    <label class="tn-fl">Ranking pares <small>(opcional)</small><input id="tnFP" class="sh-in" type="text" inputmode="numeric" placeholder="ex.: 12" value="${p && p.d && p.dsrc !== "te" ? p.d[0] : ""}"></label>
    <p class="tn-msg" id="tnFM"></p>
    <div class="tn-fb"><button type="button" class="sh-chip" id="tnFC">Cancelar</button><button type="button" class="sh-chip on" id="tnFOK">Guardar</button></div></div>`;
  document.body.appendChild(ov);
  let g = g0;
  const q = id => ov.querySelector(id), close = () => ov.remove();
  ov.querySelectorAll("[data-fg]").forEach(b => b.onclick = () => { g = b.dataset.fg; ov.querySelectorAll("[data-fg]").forEach(x => x.classList.toggle("on", x === b)); });
  q("#tnDX").onclick = close; q("#tnFC").onclick = close;
  ov.addEventListener("click", e => { if(e.target === ov) close(); });
  q("#tnFOK").onclick = async () => {
    const nome = q("#tnFN").value.trim();
    if(!nome){ q("#tnFM").textContent = "Escreve o nome do atleta."; q("#tnFN").focus(); return; }
    const ok = q("#tnFOK"); ok.disabled = true; q("#tnFM").textContent = "A guardar…";
    try{
      const j = await tnPost_({ tenisManualAdd: { id: p ? p.id : undefined, nome, g, s: q("#tnFS").value.trim(), p: q("#tnFP").value.trim() } });
      if(j && j.ok){ TN_.data = j; TN_.msg = ""; TN_.sel = null; close(); tnRender_(); return; }
      q("#tnFM").textContent = (j && j.erro) || "Não consegui guardar (é preciso o Apps Script v191)."; ok.disabled = false;
    }catch(e){ q("#tnFM").textContent = "Sem ligação ao Apps Script."; ok.disabled = false; }
  };
  setTimeout(() => { try{ q("#tnFN").focus(); }catch(e){} }, 50);
}

function tnRender_(){
  const el = document.getElementById("tennisView"); if(!el) return;
  const box = el.querySelector("#tnBody");
  const d = TN_.data;
  if(!d){ box.innerHTML = `<p class="tn-empty">${tnEsc_(TN_.msg || "A pedir os dados…")}</p>`; return; }
  let h;
  if(TN_.sel){ const p = (d.jogadores || []).find(x => x.id === TN_.sel); h = p ? tnFichaHtml_(p) : ""; if(!p) TN_.sel = null; }
  if(!TN_.sel){
    h = `<div class="tn-seg"><button type="button" class="sh-chip ${TN_.tab==="rank"?"on":""}" data-tab="rank">Rankings</button><button type="button" class="sh-chip ${TN_.tab==="atl"?"on":""}" data-tab="atl">Atletas (${(d.jogadores || []).length})</button></div>` + (TN_.tab === "rank" ? tnRankingsHtml_() : tnAtletasHtml_());
  }
  box.innerHTML = h;
  box.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { TN_.tab = b.dataset.tab; tnRender_(); });
  box.querySelectorAll("[data-gen]").forEach(b => b.onclick = () => { TN_.gen = b.dataset.gen; tnRender_(); });
  box.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => { TN_.sel = Number(b.dataset.pid); TN_.fTab = "res"; TN_.cat = "todos"; tnRender_(); box.scrollIntoView({ block: "start" }); });
  const back = box.querySelector(".tn-back"); if(back) back.onclick = () => { TN_.sel = null; TN_.fTab = "res"; tnRender_(); };
  box.querySelectorAll("[data-ftab]").forEach(b => b.onclick = () => { TN_.fTab = b.dataset.ftab; tnRender_(); if(TN_.fTab === "carr") tnCarrLoad_(TN_.sel, false); if(TN_.fTab === "rank"){ const pp = (TN_.data.jogadores || []).find(x => x.id === TN_.sel); if(pp) tnRhLoad_(pp.n, false); } });
  box.querySelectorAll("[data-rhs]").forEach(b => b.onclick = () => { TN_.rhSel = b.dataset.rhs; tnRender_(); });
  box.querySelectorAll("[data-rhp]").forEach(b => b.onclick = () => { TN_.rhPer = b.dataset.rhp; tnRender_(); });
  tnRhHover_(box);
  const rhr = box.querySelector("#tnRhRefresh"); if(rhr) rhr.onclick = () => { const pp = (TN_.data.jogadores || []).find(x => x.id === TN_.sel); if(pp) tnRhLoad_(pp.n, true); };
  box.querySelectorAll("[data-ccat]").forEach(b => b.onclick = () => { TN_.cat = b.dataset.ccat; tnRender_(); });
  const crf = box.querySelector("#tnCarrRefresh"); if(crf) crf.onclick = () => tnCarrLoad_(TN_.sel, true);
  const add = box.querySelector("#tnAdd");
  if(add) add.onclick = () => tnAddDialog_(null);
  const ed = box.querySelector(".tn-edit");
  if(ed) ed.onclick = () => tnAddDialog_((TN_.data.jogadores || []).find(x => x.id === TN_.sel) || null);
  const rm = box.querySelector(".tn-rm");
  if(rm) rm.onclick = async () => {
    if(!confirm("Deixar de acompanhar este tenista?")) return;
    try{ const j = await tnPost_({ tenisRemove: { id: TN_.sel } }); if(j && j.ok){ TN_.data = j; TN_.sel = null; } }catch(e){}
    tnRender_();
  };
  box.querySelectorAll("[data-man]").forEach(b => b.onclick = async () => {
    const campo = b.dataset.man, nome = campo === "pm" ? "ranking de pares" : "posição na Race";
    const v = prompt("Escreve a " + nome + " (número) e, se quiseres, os pontos, separados por espaço. Ex.: 23 3150. Deixa vazio para apagar.", "");
    if(v === null) return;
    const t = v.trim().split(/\s+/).filter(Boolean), r = Number(t[0]), pts = t[1] ? Number(t[1]) : 0;
    const val = r > 0 ? { r, pts } : null;
    try{ const j = await tnPost_({ tenisManual: { id: TN_.sel, [campo]: val } }); if(j && j.ok){ TN_.data = j; tnRender_(); } }catch(e){}
  });
}

async function tnLoad_(refresh){
  if(!document.getElementById("tennisView")) return;
  TN_.msg = refresh ? "A atualizar (pode demorar uns segundos)…" : "A pedir os dados…"; if(!TN_.data) TN_.data = null; tnRender_();
  try{
    const j = await tnPost_(refresh ? { tenisRefresh: true } : { getTenis: true });
    if(j && j.ok){ TN_.data = j; TN_.msg = ""; }
    else { TN_.msg = "Sem resposta válida. É preciso o Apps Script v189 (ou mais recente) publicado e a password de admin certa."; }
  }catch(e){ TN_.msg = "Não consegui falar com o Apps Script: " + e; }
  tnRender_();
}

function renderTennisView_(){ // v287: chamada por setView("tenis-rank")
  const rl = document.getElementById("tnReload"); if(rl) rl.onclick = () => tnLoad_(true);
  TN_.sel = null;
  if(TN_.data) tnRender_(); else tnLoad_(false);
}

// ===================== «RESULTADOS» (v287): substitui «Medalhas» nas competições de ténis =====================
// Histórico de cada resultado ao longo da época + destaque e contagem de títulos (🏆) e finais (🥈).
const TN_RES_ = { atl: "", ord: "cron", sel: "", ano: "" }; // v289: filtro por atleta, ordem e torneio aberto
function tnFaseRank_(ph){ // quanto mais alto, melhor a fase alcançada
  const t = String(ph || "").toLowerCase();
  if(/qualif|qual\./.test(t)) return 1;
  if(/final/.test(t) && !/meia|semi|quarto|oitavo/.test(t)) return 7;
  if(/meia|semi/.test(t)) return 6;
  if(/quarto|quarter/.test(t)) return 5;
  if(/oitavo|round of 16|r16|1\/8/.test(t)) return 4;
  if(/16|round 3|3\.ª|3ª/.test(t)) return 3;
  return 2;
}
function tnMelhor_(r){ // pontuação de um jogo para «melhores resultados»
  const st = r.st; return (st.medal === "gold" ? 100 : st.medal === "silver" ? 80 : 0) + tnFaseRank_(r.e.phase) * 5 + (st.passou === "yes" ? 2 : 0);
}
function tnDataTxt_(e){ return e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date.slice(8) + "/" + e.date.slice(5, 7) : "Dia " + e.day; }
function tnTorneios_(rows){ // junta os jogos por tenista + torneio («Torneio / local») + categoria + ano
  const m = {};
  rows.forEach(r => {
    const e = r.e, nome = String(e.venue || "").trim(), ano = (e.date || "").slice(0, 4);
    const k = [e.athlete || "", nome.toLowerCase().replace(/\s+/g, " "), String(e.detail || "").toLowerCase(), ano].join("|");
    const g = m[k] || (m[k] = { k, nome: nome || "Sem torneio", ath: e.athlete || "—", cat: e.detail || "", country: e.country || "", piso: e.piso || "", rows: [], dmax: "", melhor: 0 });
    g.rows.push(r); if(!g.country) g.country = e.country || ""; if(!g.piso) g.piso = e.piso || "";
    const d = (e.date || "") + String(e.seq || 0).padStart(8, "0"); if(d > g.dmax) g.dmax = d;
    g.melhor = Math.max(g.melhor, tnMelhor_(r));
  });
  return Object.keys(m).map(k => { const g = m[k];
    g.rows.sort((a, b) => (tnFaseRank_(a.e.phase) - tnFaseRank_(b.e.phase)) || ((a.e.date || "") + String(a.e.seq || 0).padStart(8, "0") < (b.e.date || "") + String(b.e.seq || 0).padStart(8, "0") ? -1 : 1));
    const top = g.rows.slice().sort((a, b) => tnFaseRank_(b.e.phase) - tnFaseRank_(a.e.phase) || 0)[0];
    g.campeao = g.rows.some(r => r.st.medal === "gold"); g.final = g.rows.some(r => r.st.medal === "silver");
    g.chegou = g.campeao ? "🏆 Campeão" : g.final ? "🥈 Final" : (top.e.phase || "");
    const ds = g.rows.map(r => r.e.date).filter(Boolean).sort(); g.datas = ds.length ? (ds[0] === ds[ds.length - 1] ? tnDataTxt_({ date: ds[0] }) : tnDataTxt_({ date: ds[0] }) + " – " + tnDataTxt_({ date: ds[ds.length - 1] })) : "Dia " + g.rows[0].e.day;
    return g; });
}
function tnJogoCard_(r, mostraAtl){
  const e = r.e, st = r.st, win = st.medal === "gold";
  const badge = st.medal === "gold" ? "🏆 Campeão" : st.medal === "silver" ? "🥈 Vice-campeão" : st.passou === "yes" ? "Passou" : st.passou === "no" ? "Não passou" : "";
  const meta = [e.detail, e.piso].filter(Boolean).map(tnEsc_).join(" · ");
  return `<div class="tn-rr${win ? " win" : ""}"><div class="tn-rr1"><span class="tn-rd">${tnEsc_(e.phase || "—")} · ${tnEsc_(tnDataTxt_(e))}</span>${badge ? `<span class="tn-badge ${win ? "gold" : st.passou === "no" ? "tn-l" : "tn-w"}">${badge}</span>` : ""}</div>
    <div class="tn-rr2">${mostraAtl ? tnEsc_(e.athlete) + " " : ""}${e.opp ? "<small>vs</small> " + tnEsc_(e.opp) : ""}</div>
    ${st.resultado ? `<div class="tn-rr3">${tnEsc_(st.resultado)}</div>` : ""}${meta ? `<div class="tn-rr4">${meta}</div>` : ""}</div>`;
}
function renderTennisResults_(){
  const box = document.getElementById("medalsView"); if(!box) return;
  if(TN_RES_.ano){ tnResultadosAno_(box); return; } // v296: época anterior (histórico importado do Sofascore)
  const all = EVENTS.map(e => ({ e, st: getEv(e.id) })).filter(r => r.st.passou || r.st.medal || r.st.resultTag || (r.st.resultado && String(r.st.resultado).trim()));
  const por = {};
  all.forEach(r => { const a = r.e.athlete || "—"; const o = por[a] || (por[a] = { t: 0, f: 0, j: 0 }); o.j++; if(r.st.medal === "gold") o.t++; if(r.st.medal === "silver") o.f++; });
  const nomes = Object.keys(por).sort((a, b) => (por[b].t - por[a].t) || (por[b].f - por[a].f) || (por[b].j - por[a].j));
  if(TN_RES_.atl && !por[TN_RES_.atl]) TN_RES_.atl = "";
  const rows = all.filter(r => !TN_RES_.atl || r.e.athlete === TN_RES_.atl);
  const gs = tnTorneios_(rows);
  const sel = TN_RES_.sel ? gs.find(g => g.k === TN_RES_.sel) : null;
  if(TN_RES_.sel && !sel) TN_RES_.sel = "";
  const cont = {}; nomes.forEach(n => { const o = por[n]; cont[n] = (o.t ? "🏆 " + o.t + " · " : "") + o.j + " jogos"; });
  let h = tnEpocaSelHtml_(sel ? [] : nomes, cont, all.length);
  if(sel){ // ---- detalhe de um torneio: jogos por ronda
    h += `<button type="button" class="sh-chip tn-rback" data-rback="1">← Torneios</button>
      <div class="tn-rhead${sel.campeao ? " win" : ""}"><div class="tn-rh1">${tnEsc_(sel.nome)}</div><div class="tn-rh2">${tnEsc_(sel.ath)}${sel.cat ? " · " + tnEsc_(sel.cat) : ""}</div><div class="tn-rh3">${[sel.datas, sel.country, sel.piso].filter(Boolean).map(tnEsc_).join(" · ")}</div><div class="tn-rh4">${tnEsc_(sel.chegou)}</div></div>`;
    h += sel.rows.map(r => tnJogoCard_(r, false)).join("");
    box.innerHTML = h;
    box.querySelector("[data-rback]").onclick = () => { TN_RES_.sel = ""; renderTennisResults_(); window.scrollTo(0, 0); };
    return;
  }
  const tit = rows.filter(r => r.st.medal === "gold").length, fin = rows.filter(r => r.st.medal === "silver").length;
  h += `<div class="medal-totals tn-rtot">
    <div class="medal-total-card gold"><div class="num">${tit}</div><div class="lbl">🏆 Títulos</div></div>
    <div class="medal-total-card silver"><div class="num">${fin}</div><div class="lbl">🥈 Finais</div></div></div>`;
  if(nomes.length){
    h += `<div class="tn-rord"><button type="button" class="sh-chip${TN_RES_.ord === "cron" ? " on" : ""}" data-rord="cron">Mais recentes</button><button type="button" class="sh-chip${TN_RES_.ord === "melhores" ? " on" : ""}" data-rord="melhores">Melhores resultados</button></div>`;
  }
  if(TN_RES_.ord === "melhores") gs.sort((a, b) => (b.melhor - a.melhor) || (b.dmax < a.dmax ? -1 : 1));
  else gs.sort((a, b) => b.dmax < a.dmax ? -1 : b.dmax > a.dmax ? 1 : 0);
  h += `<div class="medal-section-title">🎾 Torneios${TN_RES_.atl ? " · " + tnEsc_(TN_RES_.atl) : ""}</div>`;
  if(!gs.length) h += `<div class="medal-empty">Ainda sem resultados. Marca «Passou», «Não passou» ou escreve o resultado no Calendário.</div>`;
  else h += gs.map(g => `<button type="button" class="tn-tc${g.campeao ? " win" : ""}" data-tsel="${tnEsc_(g.k)}">
      <span class="tn-tc1"><b>${tnEsc_(g.nome)}</b><em>${tnEsc_(g.chegou)}</em></span>
      <span class="tn-tc2">${TN_RES_.atl ? "" : tnEsc_(g.ath) + (g.cat ? " · " : "")}${tnEsc_(g.cat)}</span>
      <span class="tn-tc3">${[g.datas, g.country, g.piso].filter(Boolean).map(tnEsc_).join(" · ")} · ${g.rows.length} ${g.rows.length === 1 ? "jogo" : "jogos"}</span>
      <span class="tn-chev" aria-hidden="true">›</span></button>`).join("");
  box.innerHTML = h;
  tnEpocaBind_(box);
  box.querySelectorAll("[data-rord]").forEach(b => b.onclick = () => { TN_RES_.ord = b.dataset.rord; renderTennisResults_(); });
  box.querySelectorAll("[data-tsel]").forEach(b => b.onclick = () => { TN_RES_.sel = b.dataset.tsel; renderTennisResults_(); window.scrollTo(0, 0); });
}


// ===================== «CARREIRA» (v294): todos os jogos desde sempre, por ano e torneio =====================
// Os jogos vêm do Apps Script v197 (`{tenisCarreira:{id}}`, Sofascore, ficheiro privado no Drive); só modo edição.
const TN_CAT_ = { "ATP": "ATP", "Challenger": "Challenger", "ITF Men": "ITF", "ITF Women": "ITF", "Davis Cup": "Taça Davis", "Billie Jean King Cup": "Taça BJK", "WTA": "WTA", "WTA 125": "WTA 125" };
const TN_CAT_SEM_ = { "Exhibition": 1, "Juniors": 1 }; // não contam para a carreira
const TN_PISOS_ = [["clay", "Terra batida"], ["hard", "Piso duro"], ["indoor", "Pavilhão"], ["grass", "Relva"]];
function tnPiso_(g){ const t = String(g || "").toLowerCase(); if(/clay/.test(t)) return "clay"; if(/grass/.test(t)) return "grass"; if(/indoor/.test(t)) return "indoor"; if(/hard/.test(t)) return "hard"; return ""; }
function tnFase_(f){ const t = String(f || ""); if(TN_FASES_[t]) return TN_FASES_[t]; const q = t.match(/^Qualification round (\d)/i); if(q) return "Qualif. " + q[1]; if(/^Qualification final/i.test(t)) return "Qualif. final"; return t; }
function tnRondaRk_(f){ const t = String(f || "").toLowerCase();
  if(/qualif/.test(t)) return 0.5;
  if(/^final$/.test(t)) return 7; if(/semi/.test(t)) return 6; if(/quarter/.test(t)) return 5; if(/round of 16/.test(t)) return 4;
  if(/round of 32/.test(t)) return 3; if(/round of 64/.test(t)) return 2; if(/round of 128/.test(t)) return 1; return 2.5; }
function tnEhTitulo_(r){ return r[2] === "V" && /^final$/i.test(r[4] || "") && !!TN_CAT_[r[6]] && r[6] !== "Davis Cup" && r[6] !== "Billie Jean King Cup"; }
function tnEhFinalPerdida_(r){ return r[2] === "D" && /^final$/i.test(r[4] || "") && !!TN_CAT_[r[6]] && r[6] !== "Davis Cup" && r[6] !== "Billie Jean King Cup"; }
function tnPct_(v, d){ return v + d ? Math.round(100 * v / (v + d)) + "%" : "—"; }

async function tnCarrLoad_(id, refresh){
  if(!id) return;
  const cur = TN_.carr[id] || {};
  if(cur.c && !refresh && cur.fresh) return;
  if(cur.loading) return;
  TN_.carr[id] = Object.assign({}, cur, { loading: true, erro: "" }); tnRender_();
  try{
    const j = await tnPost_({ tenisCarreira: { id, refresh: !!refresh } });
    if(j && j.ok && j.c) TN_.carr[id] = { c: j.c, loading: false, erro: "", fresh: true };
    else TN_.carr[id] = Object.assign({}, cur, { loading: false, erro: (j && j.erro) || "Sem resposta válida. É preciso o Apps Script v197 (ou mais recente) publicado." });
  }catch(e){ TN_.carr[id] = Object.assign({}, cur, { loading: false, erro: "Não consegui falar com o Apps Script: " + e }); }
  tnRender_();
}

function tnCarreiraHtml_(p){
  const st = TN_.carr[p.id] || {};
  if(!st.c){
    if(st.erro) return `<p class="tn-empty">${tnEsc_(st.erro)}</p><button type="button" class="sh-chip" id="tnCarrRefresh">↻ Tentar outra vez</button>`;
    return `<p class="tn-empty">A importar a carreira de ${tnEsc_(p.n)}… A 1.ª vez demora cerca de 15 segundos.</p>`;
  }
  const todos = (st.c.j || []).filter(r => !TN_CAT_SEM_[r[6]]);
  const cats = []; todos.forEach(r => { const k = TN_CAT_[r[6]] || r[6] || "Outros"; if(cats.indexOf(k) < 0) cats.push(k); });
  const ordem = ["ATP", "WTA", "Challenger", "WTA 125", "ITF", "Taça Davis", "Taça BJK"];
  cats.sort((a, b) => (ordem.indexOf(a) < 0 ? 99 : ordem.indexOf(a)) - (ordem.indexOf(b) < 0 ? 99 : ordem.indexOf(b)));
  const cat = cats.indexOf(TN_.cat) >= 0 ? TN_.cat : "todos";
  const J = todos.filter(r => cat === "todos" || (TN_CAT_[r[6]] || r[6] || "Outros") === cat);
  let h = `<div class="tn-seg tn-ccats"><button type="button" class="sh-chip ${cat === "todos" ? "on" : ""}" data-ccat="todos">Tudo</button>` + cats.map(c => `<button type="button" class="sh-chip ${cat === c ? "on" : ""}" data-ccat="${tnEsc_(c)}">${tnEsc_(c)}</button>`).join("") + `</div>`;
  if(!J.length) return h + `<p class="tn-empty">Sem jogos nesta categoria.</p>`;
  const V = J.filter(r => r[2] === "V").length, D = J.length - V, T = J.filter(tnEhTitulo_).length, F = J.filter(tnEhFinalPerdida_).length;
  const desde = new Date(J[J.length - 1][0] * 1000).getFullYear();
  h += `<div class="tn-kpis tn-ckpis"><div><b>${V}–${D}</b><small>Vitórias–derrotas</small></div><div><b>${tnPct_(V, D)}</b><small>% de vitórias</small></div><div><b>${T}</b><small>🏆 Títulos</small></div><div><b>${F}</b><small>🥈 Finais</small></div></div>`;
  h += `<p class="tn-line tn-small">${J.length} jogos desde ${desde}. Só singulares; os pares não estão incluídos.</p>`;
  // balanço por piso
  const pisos = {}; J.forEach(r => { const k = tnPiso_(r[7]); if(!k) return; (pisos[k] = pisos[k] || [0, 0])[r[2] === "V" ? 0 : 1]++; });
  const ps = TN_PISOS_.filter(x => pisos[x[0]]);
  if(ps.length) h += `<div class="tn-pisos">` + ps.map(x => `<div><b>${pisos[x[0]][0]}–${pisos[x[0]][1]}</b><small>${x[1]} · ${tnPct_(pisos[x[0]][0], pisos[x[0]][1])}</small></div>`).join("") + `</div>`;
  // por ano → torneios → jogos
  const anos = {};
  J.slice().sort((a, b) => a[0] - b[0]).forEach(r => { const y = new Date(r[0] * 1000).getFullYear(); (anos[y] = anos[y] || []).push(r); });
  const ys = Object.keys(anos).map(Number).sort((a, b) => b - a);
  h += `<h4 class="tn-h">Por ano <small>(toca num ano ou num torneio para abrir)</small></h4><div class="tn-years">`;
  ys.forEach((y, yi) => {
    const L = anos[y], v = L.filter(r => r[2] === "V").length, d = L.length - v, t = L.filter(tnEhTitulo_).length, f = L.filter(tnEhFinalPerdida_).length;
    const grupos = []; // torneio = mesmo nome e jogos a menos de 12 dias uns dos outros
    L.forEach(r => { const g = grupos[grupos.length - 1]; if(g && g.n === r[5] && r[0] - g.fim < 12 * 86400) { g.j.push(r); g.fim = r[0]; } else grupos.push({ n: r[5], j: [r], fim: r[0] }); });
    h += `<details class="tn-yr"${yi === 0 ? " open" : ""}><summary><b>${y}</b><span>${v}–${d}</span><span>${tnPct_(v, d)}</span><span>${t ? "🏆 " + t : ""}${t && f ? " " : ""}${f ? "🥈 " + f : ""}</span></summary>`;
    h += grupos.slice().reverse().map(g => {
      let best = g.j[0]; g.j.forEach(r => { if(tnRondaRk_(r[4]) > tnRondaRk_(best[4]) || (tnRondaRk_(r[4]) === tnRondaRk_(best[4]) && r[2] === "V")) best = r; });
      const titulo = g.j.some(tnEhTitulo_), final = g.j.some(tnEhFinalPerdida_);
      const rotulo = titulo ? "🏆 Campeão" : final ? "🥈 Final" : (best[2] === "V" ? tnFase_(best[4]) + " ✓" : "Parou em " + tnFase_(best[4]));
      const gv = g.j.filter(r => r[2] === "V").length, gd = g.j.length - gv, meta = g.j[0];
      return `<details class="tn-tor${titulo ? " is-w" : ""}"><summary><span class="tn-tn">${tnEsc_(g.n || "—")}</span><small>${tnEsc_(TN_CAT_[meta[6]] || meta[6] || "")}${meta[7] ? " · " + tnEsc_(meta[7]) : ""}</small><span class="tn-tr">${tnEsc_(rotulo)} · ${gv}–${gd}</span></summary>` +
        g.j.map(r => { const dt = new Date(r[0] * 1000);
          return `<div class="tn-cg"><span class="tn-cgd">${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}</span><span class="tn-cgr ${r[2] === "V" ? "tn-w" : "tn-l"}">${r[2]}</span><span class="tn-cgo">vs ${tnEsc_(r[1])}</span><span class="tn-cgs">${tnEsc_(r[3] || "")}${r[8] ? " · " + tnEsc_(r[8]) : ""}</span><span class="tn-cgf">${tnEsc_(tnFase_(r[4]))}</span></div>`; }).join("") + `</details>`;
    }).join("") + `</details>`;
  });
  h += `</div><p class="tn-line tn-small">Atualizado: ${tnEsc_(st.c.u || "—")} · fonte: Sofascore ${st.loading ? "· a atualizar…" : ""} <button type="button" class="tn-lnk" id="tnCarrRefresh">↻ Atualizar</button></p>`;
  return h;
}


// ===================== v296: «RANKING» na ficha (gráfico desde 2010) e ÉPOCAS ANTERIORES nos Resultados =====================
// Ranking: Apps Script v199 (`{tenisRankHist:{nome}}`, fotos mensais do Tennis Explorer num ficheiro privado do Drive).
async function tnRhLoad_(nome, refresh){
  if(!nome) return;
  const cur = TN_.rh[nome] || {};
  if(cur.loading || (cur.d && !refresh && cur.pend === 0)) return;
  TN_.rh[nome] = Object.assign({}, cur, { loading: true, erro: "" }); tnRender_();
  try{
    const j = await tnPost_({ tenisRankHist: { nome } });
    if(j && j.ok) TN_.rh[nome] = { d: { s: j.s || [], d: j.d || [] }, pend: j.pend || 0, loading: false, erro: "" };
    else TN_.rh[nome] = Object.assign({}, cur, { loading: false, erro: (j && j.erro) || "Sem resposta válida. É preciso o Apps Script v199 (ou mais recente) publicado." });
  }catch(e){ TN_.rh[nome] = Object.assign({}, cur, { loading: false, erro: "Não consegui falar com o Apps Script: " + e }); }
  tnRender_();
}
function tnYm_(ym){ return Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1; }
function tnYmTxt_(ym){ const M = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]; return M[Number(ym.slice(5, 7)) - 1] + " " + ym.slice(0, 4); }
function tnRankHistHtml_(p){
  const st = TN_.rh[p.n] || {};
  if(!st.d){
    if(st.erro) return `<p class="tn-empty">${tnEsc_(st.erro)}</p><button type="button" class="sh-chip" id="tnRhRefresh">↻ Tentar outra vez</button>`;
    return `<p class="tn-empty">A carregar o histórico do ranking de ${tnEsc_(p.n)}…</p>`;
  }
  const hoje = new Date(), ymHoje = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0");
  const S = st.d.s.slice(), D = st.d.d.slice();
  const juntaAgora = (L, r, pts) => { if(!r) return; const i = L.findIndex(x => x[0] === ymHoje); if(i >= 0) L[i] = [ymHoje, r, pts || L[i][2]]; else L.push([ymHoje, r, pts || 0]); };
  juntaAgora(S, p.r, p.p); if(p.d) juntaAgora(D, p.d[0], p.d[1]);
  const nota = `<p class="tn-line tn-small">Uma foto por mês (1.ª segunda-feira), desde 2010 · fonte: Tennis Explorer (ATP) ${st.loading ? "· a atualizar…" : ""} <button type="button" class="tn-lnk" id="tnRhRefresh">↻ Atualizar</button></p>` +
    (st.pend ? `<p class="tn-line tn-small">A importar o arquivo: faltam ${st.pend} fotos (continua sozinho de 5 em 5 minutos; volta a abrir daqui a pouco).</p>` : "");
  if(!S.length && !D.length) return `<p class="tn-empty">Ainda sem histórico para ${tnEsc_(p.n)}${st.pend ? " — o arquivo ainda está a ser importado" : " (o nome pode não coincidir com o do Tennis Explorer)"}.</p>` + nota;
  const sel = (TN_.rhSel === "s" && S.length) || (TN_.rhSel === "d" && D.length) ? TN_.rhSel : "ambos";
  const mostra = { s: sel !== "d" && S.length, d: sel !== "s" && D.length };
  // v298: período (zoom) — «tudo» | «10» | «5» anos, contado a partir do último mês
  const tudoYms = [].concat(mostra.s ? S : [], mostra.d ? D : []).map(x => tnYm_(x[0])), fimYm = Math.max.apply(null, tudoYms), iniYm = Math.min.apply(null, tudoYms);
  const per = TN_.rhPer === "5" || TN_.rhPer === "10" ? Number(TN_.rhPer) * 12 : 0, podeZoom = fimYm - iniYm > 60;
  const cut = L => per && podeZoom ? L.filter(x => tnYm_(x[0]) >= fimYm - per) : L;
  const Sv = cut(S), Dv = cut(D);
  const todos = [].concat(mostra.s ? Sv : [], mostra.d ? Dv : []);
  const yms = todos.map(x => tnYm_(x[0])), x0 = Math.min.apply(null, yms), x1 = Math.max.apply(null, yms), span = Math.max(1, x1 - x0);
  const rk = todos.map(x => x[1]), rMin = Math.min.apply(null, rk), rMax = Math.max.apply(null, rk);
  const lg = v => Math.log(v), lo = lg(Math.max(1, rMin * 0.8)), hi = lg(rMax * 1.15);
  const W = 340, H = 230, PL = 40, PR = 14, PT = 16, PB = 26;
  const X = ym => PL + (W - PL - PR) * (tnYm_(ym) - x0) / span, Y = r => PT + (H - PT - PB) * (lg(r) - lo) / Math.max(0.01, hi - lo);
  const ticks = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].filter(v => v >= rMin * 0.8 && v <= rMax * 1.15);
  let svg = `<svg class="tn-chart tn-rhc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do ranking ao longo dos anos"><defs><linearGradient id="tnGs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="tn-gs0" stop-opacity=".34"/><stop offset="1" class="tn-gs0" stop-opacity="0"/></linearGradient><linearGradient id="tnGd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="tn-gd0" stop-opacity=".26"/><stop offset="1" class="tn-gd0" stop-opacity="0"/></linearGradient></defs>`;
  ticks.forEach(v => { svg += `<line x1="${PL}" x2="${W - PR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="tn-gl"/><text x="${PL - 6}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end" class="tn-ct">#${v}</text>`; });
  const a0 = Math.floor(x0 / 12), a1 = Math.floor(x1 / 12), passo = a1 - a0 > 12 ? 3 : a1 - a0 > 7 ? 2 : 1;
  for(let a = a0; a <= a1; a += passo){ const xx = PL + (W - PL - PR) * (a * 12 - x0) / span; if(xx < PL - 1) continue; svg += `<line x1="${xx.toFixed(1)}" x2="${xx.toFixed(1)}" y1="${H - PB}" y2="${H - PB + 4}" class="tn-gl tn-tk"/><text x="${xx.toFixed(1)}" y="${H - 6}" text-anchor="${xx < PL + 8 ? "start" : "middle"}" class="tn-ct">${a}</text>`; }
  const bottom = H - PB;
  const mono = P => { const n = P.length; if(n < 2) return n ? `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}` : ""; const dx = [], m = [], t = [];
    for(let i = 0; i < n - 1; i++){ dx[i] = P[i + 1][0] - P[i][0]; m[i] = (P[i + 1][1] - P[i][1]) / (dx[i] || 1); }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for(let i = 1; i < n - 1; i++) t[i] = (m[i - 1] * m[i] <= 0) ? 0 : 2 * m[i - 1] * m[i] / (m[i - 1] + m[i]);
    let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
    for(let i = 0; i < n - 1; i++){ const h3 = dx[i] / 3; d += `C${(P[i][0] + h3).toFixed(1)},${(P[i][1] + t[i] * h3).toFixed(1)} ${(P[i + 1][0] - h3).toFixed(1)},${(P[i + 1][1] - t[i + 1] * h3).toFixed(1)} ${P[i + 1][0].toFixed(1)},${P[i + 1][1].toFixed(1)}`; }
    return d; };
  const linha = (L, cls, grad, abaixo, area) => { if(!L.length) return ""; const P = L.map(x => [X(x[0]), Y(x[1])]), d = mono(P);
    const b = L.reduce((m, x) => x[1] < m[1] ? x : m, L[0]), bx = X(b[0]), by = Y(b[1]), ult = P[P.length - 1];
    const txt = "#" + b[1], tw = txt.length * 6 + 10, lx = Math.min(W - PR - tw / 2, Math.max(PL + tw / 2, bx)), ly = abaixo ? by + 20 : by - 9;
    const lyy = !abaixo && ly < PT + 6 ? by + 20 : ly;
    return (area ? `<path d="${d}L${ult[0].toFixed(1)},${bottom}L${P[0][0].toFixed(1)},${bottom}Z" fill="url(#${grad})" stroke="none"/>` : "") + `<path d="${d}" fill="none" class="${cls}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<circle cx="${ult[0].toFixed(1)}" cy="${ult[1].toFixed(1)}" r="7" class="${cls} tn-halo"/><circle cx="${ult[0].toFixed(1)}" cy="${ult[1].toFixed(1)}" r="3.4" class="${cls} tn-best"/>` +
      `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="4.2" class="${cls} tn-best tn-ring"/><rect x="${(lx - tw / 2).toFixed(1)}" y="${(lyy - 11).toFixed(1)}" width="${tw}" height="15" rx="7.5" class="${cls} tn-pill"/><text x="${lx.toFixed(1)}" y="${(lyy).toFixed(1)}" text-anchor="middle" class="tn-bt">${txt}</text>`; };
  if(mostra.d) svg += linha(Dv, "tn-ld", "tnGd", true, !mostra.s); // área só numa linha (duas áreas sobrepostas ficam cinzentas)
  if(mostra.s) svg += linha(Sv, "tn-ls", "tnGs", false, true);
  svg += `<g class="tn-cross" style="display:none"><line y1="${PT}" y2="${bottom}" class="tn-cl"/><circle r="4.6" class="tn-cs tn-ls" style="display:none"/><circle r="4.6" class="tn-cd tn-ld" style="display:none"/></g></svg>`;
  TN_.rhCh = { S: mostra.s ? Sv : [], D: mostra.d ? Dv : [], x0, span, W, H, PL, PR, PT, lo, hi, bottom };
  const melhor = L => L.length ? L.reduce((m, x) => x[1] < m[1] ? x : m, L[0]) : null, bS = melhor(S), bD = melhor(D);
  let h = `<div class="tn-seg tn-rhsel">${S.length && D.length ? `<button type="button" class="sh-chip ${sel === "ambos" ? "on" : ""}" data-rhs="ambos">Singulares + pares</button>` : ""}${S.length ? `<button type="button" class="sh-chip ${sel === "s" || (sel === "ambos" && !D.length) ? "on" : ""}" data-rhs="s">Singulares</button>` : ""}${D.length ? `<button type="button" class="sh-chip ${sel === "d" || (sel === "ambos" && !S.length) ? "on" : ""}" data-rhs="d">Pares</button>` : ""}</div>`;
  h += `<div class="tn-kpis tn-rhk"><div><b>${bS ? "#" + bS[1] : "—"}</b><small>Melhor singulares${bS ? " · " + tnEsc_(tnYmTxt_(bS[0])) : ""}</small></div><div><b>${bD ? "#" + bD[1] : "—"}</b><small>Melhor pares${bD ? " · " + tnEsc_(tnYmTxt_(bD[0])) : ""}</small></div><div><b>${p.r ? "#" + p.r : "—"}</b><small>Singulares agora</small></div><div><b>${p.d ? "#" + p.d[0] : "—"}</b><small>Pares agora</small></div></div>`;
  if(podeZoom) h += `<div class="tn-seg tn-rhper" aria-label="Período">${[["tudo", "Tudo"], ["10", "10 anos"], ["5", "5 anos"]].map(([k, t]) => `<button type="button" class="sh-chip ${(per ? String(per / 12) : "tudo") === k ? "on" : ""}" data-rhp="${k}">${t}</button>`).join("")}</div>`;
  h += `<div class="tn-rhw">${svg}<div class="tn-tip" hidden></div></div><p class="tn-line tn-small tn-leg">${mostra.s ? `<span class="tn-lg tn-ls"></span> Singulares ` : ""}${mostra.d ? `<span class="tn-lg tn-ld"></span> Pares ` : ""}· toca ou passa o rato no gráfico para ver cada mês · o ponto com etiqueta é o melhor ranking · quanto mais alto, melhor</p>`;
  // por ano: fim do ano e melhor
  const anos = {}; S.forEach(x => (anos[x[0].slice(0, 4)] = anos[x[0].slice(0, 4)] || { s: [], d: [] }).s.push(x)); D.forEach(x => (anos[x[0].slice(0, 4)] = anos[x[0].slice(0, 4)] || { s: [], d: [] }).d.push(x));
  const fim = L => L.length ? "#" + L[L.length - 1][1] : "—", mel = L => L.length ? "#" + Math.min.apply(null, L.map(x => x[1])) : "—";
  h += `<h4 class="tn-h">Por ano <small>(fim do ano · melhor do ano)</small></h4><div class="tn-rha"><div class="tn-rhr tn-rhh"><span>Ano</span><span>Singulares</span><span>Pares</span></div>` +
    Object.keys(anos).sort((a, b) => b - a).map(y => `<div class="tn-rhr"><b>${y}</b><span>${fim(anos[y].s)} · ${mel(anos[y].s)}</span><span>${fim(anos[y].d)} · ${mel(anos[y].d)}</span></div>`).join("") + `</div>`;
  return h + nota;
}

function tnRhHover_(box){ // v298: linha vertical + cartão com o ranking de cada mês (rato ou toque)
  const w = box.querySelector(".tn-rhw"); if(!w || !TN_.rhCh) return;
  const svg = w.querySelector("svg"), tip = w.querySelector(".tn-tip"), g = svg.querySelector(".tn-cross"), C = TN_.rhCh;
  const ym2s = i => Math.floor(i / 12) + "-" + String(i % 12 + 1).padStart(2, "0");
  const perto = (L, i) => { let m = null, dm = 99; L.forEach(x => { const d = Math.abs(tnYm_(x[0]) - i); if(d < dm){ dm = d; m = x; } }); return dm <= 2 ? m : null; };
  const mover = ev => {
    const r = svg.getBoundingClientRect(); if(!r.width) return;
    const sx = (ev.clientX - r.left) * C.W / r.width, i = Math.round(C.x0 + (sx - C.PL) / (C.W - C.PL - C.PR) * C.span), ic = Math.max(C.x0, Math.min(C.x0 + C.span, i));
    const xx = C.PL + (C.W - C.PL - C.PR) * (ic - C.x0) / C.span, Yy = rr => C.PT + (C.bottom - C.PT) * (Math.log(rr) - C.lo) / Math.max(0.01, C.hi - C.lo);
    const ps = perto(C.S, ic), pd = perto(C.D, ic);
    g.style.display = ""; g.querySelector(".tn-cl").setAttribute("x1", xx); g.querySelector(".tn-cl").setAttribute("x2", xx);
    [[".tn-cs", ps], [".tn-cd", pd]].forEach(([sel, pt]) => { const c = g.querySelector(sel); if(pt){ c.style.display = ""; c.setAttribute("cx", xx); c.setAttribute("cy", Yy(pt[1])); } else c.style.display = "none"; });
    const lin = (nome, pt, cls) => pt ? `<div class="tn-tr"><i class="${cls}"></i>${nome} <b>#${pt[1]}</b>${pt[2] ? `<small>${String(pt[2]).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} pts</small>` : ""}</div>` : "";
    tip.innerHTML = `<div class="tn-tm">${tnEsc_(tnYmTxt_(ym2s(ic)))}</div>` + lin("Singulares", ps, "tn-ls") + lin("Pares", pd, "tn-ld");
    tip.hidden = false;
    const wr = w.getBoundingClientRect(), px = (xx / C.W) * r.width + (r.left - wr.left), tw = tip.offsetWidth;
    tip.style.left = Math.max(2, Math.min(wr.width - tw - 2, px - tw / 2)) + "px";
  };
  const esconder = () => { g.style.display = "none"; tip.hidden = true; };
  svg.addEventListener("pointermove", mover); svg.addEventListener("pointerdown", mover);
  svg.addEventListener("pointerleave", ev => { if(ev.pointerType === "mouse") esconder(); });
}

function tnEpocaSelHtml_(nomes, contagem, total){ // v297: Época + Tenista, dois menus
  const y = new Date().getFullYear(), ys = []; for(let a = y; a >= 2014; a--) ys.push(a);
  let h = `<div class="tn-rselrow"><div class="tn-rseason"><label for="tnRAno">Época</label><select id="tnRAno"><option value="">Esta época (competição ativa)</option>${ys.map(a => `<option value="${a}"${String(TN_RES_.ano) === String(a) ? " selected" : ""}>${a}${a === y ? " (a decorrer)" : ""}</option>`).join("")}</select></div>`;
  if(nomes && nomes.length) h += `<div class="tn-rseason"><label for="tnRAtl">Tenista</label><select id="tnRAtl"><option value="">Todos os tenistas (${total})</option>${nomes.map(n => `<option value="${tnEsc_(n)}"${TN_RES_.atl === n ? " selected" : ""}>${tnEsc_(n)} (${contagem[n] || ""})</option>`).join("")}</select></div>`;
  return h + `</div>`;
}
function tnEpocaBind_(box){
  const sel = box.querySelector("#tnRAno");
  if(sel) sel.onchange = () => { TN_RES_.ano = sel.value; TN_RES_.sel = ""; TN_RES_.atl = ""; renderTennisResults_(); if(TN_RES_.ano) tnCarrTodas_(); };
  const at = box.querySelector("#tnRAtl");
  if(at) at.onchange = () => { TN_RES_.atl = at.value; TN_RES_.sel = ""; renderTennisResults_(); };
}
async function tnCarrFetchUm_(id, force){
  const cur = TN_.carr[id] || {};
  if(cur.loading) return !!cur.c;
  if(cur.c && !force && (!cur.at || Date.now() - cur.at < 3600e3)) return true; // v297: no ano corrente, uma carreira com >1 h pede só os jogos novos
  TN_.carr[id] = Object.assign({}, cur, { loading: true });
  try{
    const j = await tnPost_({ tenisCarreira: { id, refresh: !!force } });
    if(j && j.ok && j.c){ TN_.carr[id] = { c: j.c, loading: false, erro: "", fresh: true, at: Date.now() }; return true; }
    if(cur.c){ TN_.carr[id] = cur; return true; }
    TN_.carr[id] = { loading: false, erro: (j && j.erro) || "sem resposta" };
  }catch(e){ TN_.carr[id] = { loading: false, erro: String(e) }; }
  return false;
}
async function tnCarrTodas_(force){ // importa (uma vez) a carreira de todos os tenistas com ficha, um de cada vez
  if(TN_.allC.run) return;
  TN_.allC = { run: true, done: 0, total: 0, erro: "", falhas: [] };
  try{
    if(!TN_.data){ const j = await tnPost_({ getTenis: true }); if(j && j.ok) TN_.data = j; else throw new Error("sem dados dos tenistas (é preciso o Apps Script v197 ou mais recente)"); }
    const L = (TN_.data.jogadores || []).filter(p => p.id > 0 && !p.man);
    TN_.allC.total = L.length;
    for(const p of L){
      { const antes = TN_.carr[p.id] && TN_.carr[p.id].c ? TN_.carr[p.id].at : -1; const ok = await tnCarrFetchUm_(p.id, !!force && antes !== -1 ? true : false); if(!ok) TN_.allC.falhas.push(p.n); }
      TN_.allC.done++;
      if(TN_RES_.ano) renderTennisResults_();
    }
  }catch(e){ TN_.allC.erro = String(e.message || e); }
  TN_.allC.run = false;
  if(TN_RES_.ano) renderTennisResults_();
}
function tnGruposAno_(ano){ // [{ath, nome, cat, piso, j:[jogos], fim, titulo, final, best, rotulo, melhor}]
  const out = [];
  ((TN_.data && TN_.data.jogadores) || []).forEach(p => {
    const c = TN_.carr[p.id]; if(!c || !c.c) return;
    const J = (c.c.j || []).filter(r => !TN_CAT_SEM_[r[6]] && new Date(r[0] * 1000).getFullYear() === Number(ano)).sort((a, b) => a[0] - b[0]);
    const gs = [];
    J.forEach(r => { const g = gs[gs.length - 1]; if(g && g.nome === r[5] && r[0] - g.fim < 12 * 86400) { g.j.push(r); g.fim = r[0]; } else gs.push({ ath: p.n, nome: r[5] || "—", j: [r], fim: r[0] }); });
    gs.forEach(g => {
      let best = g.j[0]; g.j.forEach(r => { if(tnRondaRk_(r[4]) > tnRondaRk_(best[4]) || (tnRondaRk_(r[4]) === tnRondaRk_(best[4]) && r[2] === "V")) best = r; });
      g.titulo = g.j.some(tnEhTitulo_); g.final = g.j.some(tnEhFinalPerdida_); g.best = best;
      g.rotulo = g.titulo ? "🏆 Campeão" : g.final ? "🥈 Final" : (best[2] === "V" ? tnFase_(best[4]) + " ✓" : "Parou em " + tnFase_(best[4]));
      g.cat = TN_CAT_[g.j[0][6]] || g.j[0][6] || ""; g.piso = g.j[0][7] || "";
      g.melhor = (g.titulo ? 100 : g.final ? 80 : 0) + tnRondaRk_(best[4]) * 5 + (best[2] === "V" ? 2 : 0);
      out.push(g);
    });
  });
  return out;
}
function tnResultadosAno_(box){ // época anterior, a partir da carreira importada
  const ano = TN_RES_.ano, A = TN_.allC;
  const gs = tnGruposAno_(ano);
  const nomes = []; gs.forEach(g => { if(nomes.indexOf(g.ath) < 0) nomes.push(g.ath); });
  const cont = {}; nomes.forEach(n => { const o = gs.filter(g => g.ath === n); cont[n] = (o.some(g => g.titulo) ? "🏆 " + o.filter(g => g.titulo).length + " · " : "") + o.length + " torneios"; });
  if(TN_RES_.atl && nomes.indexOf(TN_RES_.atl) < 0) TN_RES_.atl = "";
  const L = gs.filter(g => !TN_RES_.atl || g.ath === TN_RES_.atl);
  let h = tnEpocaSelHtml_(nomes, cont, gs.length);
  const tit = L.filter(g => g.titulo).length, fin = L.filter(g => g.final).length;
  h += `<div class="medal-totals tn-rtot"><div class="medal-total-card gold"><div class="num">${tit}</div><div class="lbl">🏆 Títulos</div></div><div class="medal-total-card silver"><div class="num">${fin}</div><div class="lbl">🥈 Finais</div></div></div>`;
  if(A.run) h += `<p class="tn-line tn-small tn-prog">A importar as carreiras… ${A.done}/${A.total}${A.total ? "" : ""} <small>(a 1.ª vez demora cerca de 15 segundos por tenista)</small></p>`;
  if(A.erro) h += `<p class="tn-empty">${tnEsc_(A.erro)}</p>`;
  if(A.falhas && A.falhas.length && !A.run) h += `<p class="tn-line tn-small">Sem carreira importada: ${A.falhas.map(tnEsc_).join(", ")}. <button type="button" class="tn-lnk" id="tnRAnoRetry">↻ Tentar outra vez</button></p>`;
  if(nomes.length){
    h += `<div class="tn-rord"><button type="button" class="sh-chip${TN_RES_.ord === "cron" ? " on" : ""}" data-rord="cron">Mais recentes</button><button type="button" class="sh-chip${TN_RES_.ord === "melhores" ? " on" : ""}" data-rord="melhores">Melhores resultados</button></div>`;
  }
  if(TN_RES_.ord === "melhores") L.sort((a, b) => (b.melhor - a.melhor) || (b.fim - a.fim)); else L.sort((a, b) => b.fim - a.fim);
  h += `<div class="medal-section-title">🎾 Torneios de ${tnEsc_(ano)}${TN_RES_.atl ? " · " + tnEsc_(TN_RES_.atl) : ""}</div><div class="tn-years">`;
  if(!L.length) h += `<div class="medal-empty">${A.run ? "A importar…" : "Sem jogos em " + tnEsc_(ano) + " nas carreiras importadas (só singulares, dos tenistas com ficha)."}</div>`;
  h += L.map(g => { const gv = g.j.filter(r => r[2] === "V").length, gd = g.j.length - gv, a = new Date(g.j[0][0] * 1000), b = new Date(g.fim * 1000), f = d => String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
    return `<details class="tn-tor${g.titulo ? " is-w" : ""}"><summary><span class="tn-tn">${tnEsc_(g.nome)}</span><small>${TN_RES_.atl ? "" : tnEsc_(g.ath) + " · "}${tnEsc_(g.cat)}${g.piso ? " · " + tnEsc_(g.piso) : ""} · ${f(a)}${f(a) !== f(b) ? "–" + f(b) : ""}</small><span class="tn-tr">${tnEsc_(g.rotulo)} <small>${gv}–${gd}</small></span></summary>` +
      g.j.map(r => { const dt = new Date(r[0] * 1000); return `<div class="tn-cg"><span class="tn-cgd">${f(dt)}</span><span class="tn-cgr ${r[2] === "V" ? "tn-w" : "tn-l"}">${r[2]}</span><span class="tn-cgo">vs ${tnEsc_(r[1])}</span><span class="tn-cgs">${tnEsc_(r[3] || "")}</span><span class="tn-cgf">${tnEsc_(tnFase_(r[4]))}</span></div>`; }).join("") + `</details>`; }).join("") + `</div>`;
  h += `<p class="tn-line tn-small">Fonte: Sofascore (só singulares)${Number(ano) === new Date().getFullYear() ? ` · o ano a decorrer atualiza-se sozinho <button type="button" class="tn-lnk" id="tnRAnoUpd">↻ Atualizar agora</button>` : ""}.</p>`;
  box.innerHTML = h;
  tnEpocaBind_(box);
  box.querySelectorAll("[data-rord]").forEach(b => b.onclick = () => { TN_RES_.ord = b.dataset.rord; renderTennisResults_(); });
  const rt = box.querySelector("#tnRAnoRetry"); if(rt) rt.onclick = () => tnCarrTodas_();
  const up = box.querySelector("#tnRAnoUpd"); if(up) up.onclick = () => tnCarrTodas_(true);
}
