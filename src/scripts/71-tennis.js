// ===================== PAINEL «🎾 TÉNIS» (v284, só modo edição, privado) =====================
// Os dados NÃO vêm no GET público: o botão pede-os por POST ao Apps Script (v189) com a password de admin
// ({getTenis:true, adminPassword}). Sem a password certa não há dados. Fontes: Sofascore e API da WTA (ver CLAUDE.md).
(function(){
  if(READONLY_MODE) return;
  const tog = document.getElementById("adminToolsToggle");
  if(!tog) return;
  const btn = document.createElement("button");
  btn.type = "button"; btn.id = "tennisBtn"; btn.className = "admin-tools-toggle share-hub-btn";
  btn.innerHTML = "🎾 Ténis";
  (document.getElementById("healthBtn") || document.getElementById("shareHubBtn") || tog).insertAdjacentElement("afterend", btn);
  btn.onclick = openTennisPanel_;
})();

const TN_ = { data: null, tab: "rank", gen: "M", sel: null, msg: "" };
function tnEsc_(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function closeTennisPanel_(){ const el = document.getElementById("tennisPanel"); if(el) el.remove(); document.body.classList.remove("share-hub-open"); }

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
  if(!L.length) h += `<p class="tn-empty">Ainda sem dados. Carrega em «🔄 Atualizar».</p>`;
  else h += `<div class="tn-list">` + L.map(p => `<button type="button" class="tn-row" data-pid="${p.id}"><span class="tn-pos">${p.r ? "#" + p.r : "—"}</span><span class="tn-nm">${tnEsc_(p.n)}</span><span class="tn-sub">${p.p ? p.p + " pts" : ""}${p.lr && p.lr !== p.r ? " · ao vivo #" + p.lr : ""}</span><span class="tn-mv">${tnMove_(p)}</span></button>`).join("") + `</div>`;
  // pares
  const pares = L.map(p => ({ p, d: p.d ? { r: p.d[0], pts: p.d[1] } : (p.m && p.m.pm ? { r: p.m.pm.r, pts: p.m.pm.pts, man: 1 } : null) })).filter(x => x.d).sort((a, b) => a.d.r - b.d.r);
  h += `<h4 class="tn-h">Portugueses · pares${g==="M" ? ' <small>(manual)</small>' : ""}</h4>`;
  h += pares.length ? `<div class="tn-list">` + pares.map(x => `<button type="button" class="tn-row" data-pid="${x.p.id}"><span class="tn-pos">#${x.d.r}</span><span class="tn-nm">${tnEsc_(x.p.n)}</span><span class="tn-sub">${x.d.pts ? x.d.pts + " pts" : ""}${x.d.man ? " · à mão" : ""}</span><span class="tn-mv"></span></button>`).join("") + `</div>`
    : `<p class="tn-empty">${g==="M" ? "Os pares masculinos não têm fonte automática: abre a ficha do tenista e escreve a posição." : "Sem pares encontrados."}</p>`;
  h += `<h4 class="tn-h">Top 10 do mundo</h4>` + (top.length ? `<div class="tn-list tn-top">` + top.map(t => `<div class="tn-row tn-static"><span class="tn-pos">#${t[0]}</span><span class="tn-nm">${tnEsc_(t[1])}</span><span class="tn-sub">${t[3] != null ? t[3] + " pts" : ""}</span><span class="tn-mv">${tnEsc_(t[2])}</span></div>`).join("") + `</div>` : `<p class="tn-empty">—</p>`);
  return h;
}

function tnAtletasHtml_(){
  const all = ((TN_.data && TN_.data.jogadores) || []).slice().sort((a, b) => (a.r || 99999) - (b.r || 99999));
  let h = `<div class="tn-add"><input id="tnNome" class="sh-in" type="text" placeholder="Acrescentar tenista (nome)" autocomplete="off"><button type="button" class="sh-chip" id="tnAdd">➕ Acrescentar</button></div>`;
  if(TN_.msg) h += `<p class="tn-msg">${tnEsc_(TN_.msg)}</p>`;
  h += `<div class="tn-list">` + all.map(p => `<button type="button" class="tn-row" data-pid="${p.id}"><span class="tn-pos">${p.r ? "#" + p.r : "—"}</span><span class="tn-nm">${tnEsc_(p.n)}</span><span class="tn-sub">${p.g === "F" ? "WTA" : "ATP"}${p.x ? " · acrescentado" : ""}</span><span class="tn-mv">${tnMove_(p)}</span></button>`).join("") + `</div>`;
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
  h += `<div class="tn-kpis"><div><b>${p.r ? "#" + p.r : "—"}</b><small>Ranking ${tnMove_(p)}</small></div><div><b>${p.lr ? "#" + p.lr : "—"}</b><small>Ao vivo</small></div><div><b>${p.b ? "#" + p.b : "—"}</b><small>Melhor</small></div><div><b>${p.p || "—"}</b><small>Pontos</small></div></div>`;
  const dd = p.d ? { r: p.d[0], pts: p.d[1] } : (m.pm ? { r: m.pm.r, pts: m.pm.pts, man: 1 } : null);
  h += `<p class="tn-line">Pares: <b>${dd ? "#" + dd.r : "—"}</b>${dd && dd.pts ? " · " + dd.pts + " pts" : ""}${dd && dd.man ? " <small>(à mão)</small>" : ""}${p.g === "M" || !p.d ? ` <button type="button" class="tn-lnk" data-man="pm">✏️ editar</button>` : ""}</p>`;
  h += `<p class="tn-line">Race: <b>${m.race ? "#" + m.race.r : "—"}</b>${m.race && m.race.pts ? " · " + m.race.pts + " pts" : ""} <small>(à mão)</small> <button type="button" class="tn-lnk" data-man="race">✏️ editar</button></p>`;
  h += `<h4 class="tn-h">Evolução do ranking</h4>` + tnChartSvg_(p.h);
  h += `<h4 class="tn-h">Últimos resultados</h4>`;
  const R = p.res || [];
  h += R.length ? `<div class="tn-res">` + R.map(r => { const e = tnEstado_(r); const d = new Date(r[0] * 1000);
    return `<div class="tn-g"><div class="tn-g1"><span class="tn-badge ${e.c}">${e.t}</span><span class="tn-gd">${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}</span></div><div class="tn-g2">vs ${tnEsc_(r[1])}</div><div class="tn-g3">${tnEsc_(r[3] || "")}${r[8] ? " · " + tnEsc_(r[8]) : ""}</div><div class="tn-g4">${tnEsc_(r[5])}${r[6] ? " · " + tnEsc_(r[6]) : ""}${r[4] ? " · " + tnEsc_(TN_FASES_[r[4]] || r[4]) : ""}${r[7] ? " · " + tnEsc_(r[7]) : ""}</div></div>`; }).join("") + `</div>`
    : `<p class="tn-empty">Sem jogos recentes.</p>`;
  h += `<p class="tn-line tn-small">Atualizado: ${tnEsc_(p.u || "—")}</p>`;
  if(p.x) h += `<button type="button" class="sh-chip tn-rm">🗑 Deixar de acompanhar</button>`;
  return h;
}

function tnRender_(){
  const el = document.getElementById("tennisPanel"); if(!el) return;
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
  box.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => { TN_.sel = Number(b.dataset.pid); tnRender_(); box.scrollIntoView({ block: "start" }); });
  const back = box.querySelector(".tn-back"); if(back) back.onclick = () => { TN_.sel = null; tnRender_(); };
  const add = box.querySelector("#tnAdd");
  if(add) add.onclick = async () => {
    const nome = (box.querySelector("#tnNome").value || "").trim(); if(!nome) return;
    add.disabled = true; TN_.msg = "A procurar «" + nome + "»…"; tnRender_();
    try{ const j = await tnPost_({ tenisAdd: { nome } }); if(j && j.ok){ TN_.data = j; TN_.msg = "Acrescentado: " + (j.achado || nome); } else TN_.msg = (j && j.erro) || "Não consegui acrescentar."; }
    catch(e){ TN_.msg = "Sem ligação ao Apps Script."; }
    tnRender_();
  };
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
  const el = document.getElementById("tennisPanel"); if(!el) return;
  TN_.msg = refresh ? "A atualizar (pode demorar uns segundos)…" : "A pedir os dados…"; if(!TN_.data) TN_.data = null; tnRender_();
  try{
    const j = await tnPost_(refresh ? { tenisRefresh: true } : { getTenis: true });
    if(j && j.ok){ TN_.data = j; TN_.msg = ""; }
    else { TN_.msg = "Sem resposta válida. É preciso o Apps Script v189 (ou mais recente) publicado e a password de admin certa."; }
  }catch(e){ TN_.msg = "Não consegui falar com o Apps Script: " + e; }
  tnRender_();
}

function openTennisPanel_(){
  if(document.getElementById("tennisPanel")) return closeTennisPanel_();
  const el = document.createElement("div");
  el.id = "tennisPanel"; el.className = "sh-overlay";
  el.innerHTML = `<div class="sh-sheet tn-sheet" role="dialog" aria-label="Ténis">
    <div class="sh-top"><b>🎾 Ténis <small class="tn-priv">privado</small></b><span><button type="button" class="sh-x" id="tnReload" aria-label="Atualizar" title="Atualizar">🔄</button><button type="button" class="sh-x" id="tnClose" aria-label="Fechar">✕</button></span></div>
    <div id="tnBody"></div></div>`;
  document.body.appendChild(el);
  document.body.classList.add("share-hub-open");
  el.querySelector("#tnClose").onclick = closeTennisPanel_;
  el.querySelector("#tnReload").onclick = () => tnLoad_(true);
  el.addEventListener("click", e => { if(e.target === el) closeTennisPanel_(); });
  TN_.sel = null;
  tnLoad_(false);
}
