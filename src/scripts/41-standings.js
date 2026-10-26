// ===================== CLASSIFICAÇÃO (separador da página de modalidade) =====================
// Lê STANDINGS (preenchido a partir do Apps Script v94). Em modo edição, as modalidades sem fonte
// automática (ex.: Futsal) podem ser preenchidas à mão colando a tabela.
function standingsEsc_(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function standingsAgo_(ms){
  const m = Math.round((Date.now() - ms) / 60000);
  if(!(m >= 0)) return "";
  if(m < 2) return "agora mesmo";
  if(m < 60) return "há " + m + " min";
  const h = Math.round(m / 60);
  if(h < 24) return "há " + h + " h";
  const d = Math.round(h / 24);
  return "há " + d + (d === 1 ? " dia" : " dias");
}
const STANDINGS_OPT_COLS_ = { "GM":1, "GS":1, "PM":1, "PS":1, "Dif. pontos":1 }; // escondidas no telemóvel estreito
// v172: tabela a partir de um objeto de classificação (opts: title, advName → destaca o adversário)
function standingsObjHtml_(s, opts){
  const esc = standingsEsc_;
  opts = opts || {};
  const cols = s.cols || [];
  const isAdv = r => !!(opts.advName && !r.me && typeof pgSameTeam_ === "function" && pgSameTeam_(r.t, opts.advName));
  const head = `<tr><th class="st-pos">#</th><th class="st-team">Equipa</th>${cols.map(c=>`<th class="${STANDINGS_OPT_COLS_[c] ? "st-opt " : ""}${c === "Pts" ? "st-pts" : ""}">${esc(c)}</th>`).join("")}</tr>`;
  const body = s.rows.map(r=>`<tr class="${r.me ? "is-me" : ""}${isAdv(r) ? " is-adv" : ""}"><td class="st-pos">${esc(r.p)}</td><td class="st-team">${esc(r.t)}</td>${cols.map((c, i)=>`<td class="${STANDINGS_OPT_COLS_[c] ? "st-opt " : ""}${c === "Pts" ? "st-pts" : ""}">${esc((r.c || [])[i])}</td>`).join("")}</tr>`).join("");
  const sub = [s.comp, s.fase].filter(Boolean).join(" · ");
  const when = s.updated ? (s.manual ? "Atualizado à mão " + standingsAgo_(s.updated) : "Atualizado " + standingsAgo_(s.updated)) : "";
  return `<div class="hv-panel"><div class="hv-panel-head"><h3>${esc(opts.title || "Classificação")}</h3>${opts.editBtn || ""}</div>
    ${sub && !opts.hideSub ? `<div class="st-sub">${esc(sub)}</div>` : ""}
    <div class="st-wrap"><table class="st-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>
    <div class="st-foot">${esc(s.source || "")}${when ? " · " + esc(when) : ""}</div></div>`;
}
// v172: competições europeias/taças (Apps Script v123): { "Modalidade": [ {comp, fase, cols, rows, source, updated} ] }
let COMP_STANDINGS = {};
function compStandingsFor_(sport){ const l = (typeof COMP_STANDINGS === "object" && COMP_STANDINGS) ? COMP_STANDINGS[sport] : null; return Array.isArray(l) ? l.filter(t=>t && Array.isArray(t.rows) && t.rows.length) : []; }
// a tabela (de uma competição) onde estão o FC Porto e o adversário deste jogo, ou null
function compStandingForGame_(ev){
  if(!ev) return null;
  return compStandingsFor_(ev.sport).find(t=>t.rows.some(r=>r.me) && t.rows.some(r=>!r.me && typeof pgSameTeam_ === "function" && pgSameTeam_(r.t, ev.athlete))) || null;
}
function standingsPanelHtml_(sport){
  const s = (typeof STANDINGS === "object" && STANDINGS) ? STANDINGS[sport] : null;
  const canEdit = (typeof READONLY_MODE !== "undefined") && !READONLY_MODE;
  const editBtn = (canEdit && (!s || s.manual)) ? `<button type="button" class="st-edit" id="stEditBtn">✏️ ${s ? "Atualizar à mão" : "Preencher à mão"}</button>` : "";
  const extra = compStandingsFor_(sport).map(t=>standingsObjHtml_(t, { title: t.comp || "Competição", hideSub: false })).join("");
  if(!s || !Array.isArray(s.rows) || !s.rows.length){
    if(extra) return extra;
    return `<div class="hv-panel"><div class="hv-panel-head"><h3>Classificação</h3>${editBtn}</div><div class="hv-empty">Classificação ainda não disponível para esta modalidade.</div></div>`;
  }
  return standingsObjHtml_(s, { editBtn }) + extra;
}
function wireStandingsPanel_(host, sport){
  const b = host.querySelector("#stEditBtn");
  if(b) b.onclick = ()=> openStandingsEditor_(sport);
}

// ---------- preenchimento à mão ----------
const STANDINGS_PRESETS_ = {
  "jvedgsDgPts": { label: "J V E D GM GS DG Pts (ZeroZero, FPF)", order: ["J","V","E","D","GM","GS","DG","Pts"] },
  "jvedgsPts":   { label: "J V E D GM GS Pts", order: ["J","V","E","D","GM","GS","Pts"] },
  "ptsjvedgs":   { label: "Pts J V E D GM GS (como no FC Porto)", order: ["Pts","J","V","E","D","GM","GS"] }
};
function parseStandingsText_(text, order){
  const rows = [], errors = [];
  String(text || "").split(/\r?\n/).forEach((raw, idx)=>{
    let line = raw.replace(/ /g, " ").trim();
    if(!line) return;
    let tokens = line.split(/\t|;|\s{2,}|\s+/).filter(x=>x !== "");
    const isNum = t => /^[+\-−]?\d+([.,]\d+)?$/.test(t);
    if(tokens.length && /^\d+[.)º°]?$/.test(tokens[0]) && tokens.length > order.length + 1) tokens.shift(); // posição à cabeça
    const nums = [];
    while(tokens.length && isNum(tokens[tokens.length - 1]) && nums.length < order.length) nums.unshift(tokens.pop().replace("−", "-").replace(",", "."));
    const team = tokens.join(" ").trim();
    if(nums.length !== order.length || !team){ errors.push("Linha " + (idx + 1) + ": '" + raw.trim().slice(0, 40) + "' — esperava equipa + " + order.length + " números"); return; }
    const v = {}; order.forEach((k, i)=>{ v[k] = nums[i]; });
    const gm = Number(v.GM), gs = Number(v.GS);
    const dg = (v.DG != null) ? Number(v.DG) : gm - gs;
    rows.push({ t: team, c: [v.Pts, v.J, v.V, v.E, v.D, v.GM, v.GS, (dg > 0 ? "+" : "") + dg] });
  });
  rows.forEach((r, i)=>{ r.p = i + 1; });
  return { rows, errors };
}
function openStandingsEditor_(sport){
  const esc = standingsEsc_;
  const old = document.getElementById("stEditor"); if(old) old.remove();
  const cur = (STANDINGS && STANDINGS[sport] && STANDINGS[sport].manual) ? STANDINGS[sport] : null;
  const ov = document.createElement("div");
  ov.id = "stEditor"; ov.className = "st-editor";
  ov.innerHTML = `<div class="st-editor-box" role="dialog" aria-label="Classificação à mão">
    <h3>Classificação · ${esc(sport)}</h3>
    <p class="st-help">Copia a tabela do site (uma equipa por linha, da 1.ª à última) e cola aqui. Escolhe a ordem das colunas que o site de onde copiaste usa.</p>
    <label>Competição<input type="text" id="stComp" placeholder="ex.: Liga Placard" value="${esc(cur ? cur.comp : "")}"></label>
    <label>Ordem das colunas<select id="stPreset">${Object.keys(STANDINGS_PRESETS_).map(k=>`<option value="${k}">${esc(STANDINGS_PRESETS_[k].label)}</option>`).join("")}</select></label>
    <textarea id="stText" rows="9" placeholder="1  Sporting CP  8  7  1  0  40  15  25  22"></textarea>
    <div id="stPreview" class="st-preview"></div>
    <div class="st-actions"><button type="button" id="stSave" class="add-save">Guardar</button><button type="button" id="stCancel" class="chip">Cancelar</button>${cur ? '<button type="button" id="stClear" class="chip st-danger">Apagar</button>' : ""}</div>
    <div id="stMsg" class="st-msg"></div></div>`;
  document.body.appendChild(ov);
  const $ = id => ov.querySelector("#" + id);
  const refresh = ()=>{
    const r = parseStandingsText_($("stText").value, STANDINGS_PRESETS_[$("stPreset").value].order);
    ov._parsed = r;
    $("stPreview").innerHTML = r.rows.length ? `<table class="st-table"><thead><tr><th>#</th><th class="st-team">Equipa</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>DG</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td>${x.p}</td><td class="st-team">${esc(x.t)}</td><td>${esc(x.c[0])}</td><td>${esc(x.c[1])}</td><td>${esc(x.c[2])}</td><td>${esc(x.c[3])}</td><td>${esc(x.c[4])}</td><td>${esc(x.c[7])}</td></tr>`).join("")}</tbody></table>` : "";
    $("stMsg").textContent = r.errors.length ? r.errors.slice(0, 3).join(" | ") : "";
  };
  $("stText").oninput = refresh; $("stPreset").onchange = refresh;
  $("stCancel").onclick = ()=> ov.remove();
  ov.addEventListener("click", e=>{ if(e.target === ov) ov.remove(); });
  const send = async (payload)=>{
    $("stMsg").textContent = "A guardar…";
    try{
      const r = await fetch(STORE_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ setManualStandings: payload, adminPassword: getAdminPassword() }) });
      const j = await r.json();
      if(!j.ok){ $("stMsg").textContent = "Não foi possível guardar" + (j.error ? ": " + j.error : "") + "."; return false; }
      return true;
    }catch(e){ $("stMsg").textContent = "Sem ligação ao servidor. Tenta outra vez."; return false; }
  };
  $("stSave").onclick = async ()=>{
    const p = ov._parsed || { rows: [], errors: [] };
    if(p.errors.length || p.rows.length < 2){ $("stMsg").textContent = p.errors.length ? "Corrige as linhas assinaladas." : "Cola pelo menos 2 equipas."; return; }
    const payload = { sport, comp: $("stComp").value.trim(), cols: ["Pts","J","V","E","D","GM","GS","DG"], rows: p.rows };
    if(await send(payload)){
      STANDINGS[sport] = { sport, comp: payload.comp, fase: "", source: "Atualizado à mão", manual: true, updated: Date.now(), cols: payload.cols, rows: p.rows.map(r=>({ p: r.p, t: r.t, c: r.c, me: /\bporto\b/i.test(r.t) })) };
      ov.remove(); if(typeof renderSportPage_ === "function") renderSportPage_();
    }
  };
  const clr = $("stClear");
  if(clr) clr.onclick = async ()=>{
    if(!confirm("Apagar a classificação preenchida à mão?")) return;
    if(await send({ sport, clear: true })){ delete STANDINGS[sport]; ov.remove(); if(typeof renderSportPage_ === "function") renderSportPage_(); }
  };
}
