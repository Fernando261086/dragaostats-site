// ===================== PAINEL «🎾 TÉNIS» (v284, só modo edição, privado) =====================
// Os dados NÃO vêm no GET público: o botão pede-os por POST ao Apps Script (v189) com a password de admin
// ({getTenis:true, adminPassword}). Sem a password certa não há dados. Fontes: Sofascore e API da WTA (ver CLAUDE.md).
function tnSyncBtn_(){ // v287: o separador «Rankings» só existe dentro de uma competição de ténis (só edição)
  const b = document.getElementById("viewRankingsBtn"); if(!b) return;
  const on = !READONLY_MODE && typeof isTenis_ === "function" && isTenis_();
  b.style.display = on ? "" : "none";
  if(!on && window.__curView_ === "tenis-rank" && typeof setView === "function") setView("calendario");
}

const TN_ = { data: null, tab: "rank", gen: "M", sel: null, msg: "", fTab: "res", carr: {}, cat: "todos" }; // v294: fTab = «res»umo | «carr»eira
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
  if(temCarr) h += `<div class="tn-seg tn-fseg"><button type="button" class="sh-chip ${TN_.fTab !== "carr" ? "on" : ""}" data-ftab="res">Resumo</button><button type="button" class="sh-chip ${TN_.fTab === "carr" ? "on" : ""}" data-ftab="carr">Carreira</button></div>`;
  if(temCarr && TN_.fTab === "carr") return h + tnCarreiraHtml_(p);
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
  box.querySelectorAll("[data-ftab]").forEach(b => b.onclick = () => { TN_.fTab = b.dataset.ftab; tnRender_(); if(TN_.fTab === "carr") tnCarrLoad_(TN_.sel, false); });
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
const TN_RES_ = { atl: "", ord: "cron", sel: "" }; // v289: filtro por atleta, ordem e torneio aberto
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
  const all = EVENTS.map(e => ({ e, st: getEv(e.id) })).filter(r => r.st.passou || r.st.medal || r.st.resultTag || (r.st.resultado && String(r.st.resultado).trim()));
  const por = {};
  all.forEach(r => { const a = r.e.athlete || "—"; const o = por[a] || (por[a] = { t: 0, f: 0, j: 0 }); o.j++; if(r.st.medal === "gold") o.t++; if(r.st.medal === "silver") o.f++; });
  const nomes = Object.keys(por).sort((a, b) => (por[b].t - por[a].t) || (por[b].f - por[a].f) || (por[b].j - por[a].j));
  if(TN_RES_.atl && !por[TN_RES_.atl]) TN_RES_.atl = "";
  const rows = all.filter(r => !TN_RES_.atl || r.e.athlete === TN_RES_.atl);
  const gs = tnTorneios_(rows);
  const sel = TN_RES_.sel ? gs.find(g => g.k === TN_RES_.sel) : null;
  if(TN_RES_.sel && !sel) TN_RES_.sel = "";
  let h = "";
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
    h += `<div class="tn-rfil" role="tablist" aria-label="Filtrar por atleta"><button type="button" class="tn-ra${TN_RES_.atl ? "" : " on"}" data-ratl=""><b>Todos</b><span>${all.length}</span></button>` + nomes.map(n => { const o = por[n]; return `<button type="button" class="tn-ra${o.t ? " win" : ""}${TN_RES_.atl === n ? " on" : ""}" data-ratl="${tnEsc_(n)}"><b>${tnEsc_(n)}</b><span>${o.t ? "🏆 " + o.t : ""}${o.t && o.f ? " · " : ""}${o.f ? "🥈 " + o.f : ""}${!o.t && !o.f ? o.j : ""}</span></button>`; }).join("") + `</div>`;
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
  box.querySelectorAll("[data-ratl]").forEach(b => b.onclick = () => { TN_RES_.atl = b.dataset.ratl; renderTennisResults_(); });
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
