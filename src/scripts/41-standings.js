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
// v173: escudo da equipa de uma linha (o FC Porto usa o seu; as outras, o mapa "Modalidade|Nome na tabela" do Apps Script v126)
function crestCell_(sport, r){
  try{
    if(!sport || typeof crestHtml_ !== "function") return "";
    const nome = r.me ? "FC Porto" : String(r.t || "").trim();
    return crestHtml_(sport, nome, "st-crest") || '<span class="st-crest-ph"></span>';
  }catch(e){ return ""; }
}
// v208: zonas da tabela (linha de água, apuramentos, lugares europeus). Vêm do Apps Script v137 em s.zonas = [{a,b,k,t}]
// (posições a..b, tipo/cor k, texto t) e só se aplicam se a tabela tiver o mesmo nº de equipas (s.zonasN).
function standingsZonasMap_(s){
  try{
    const z = Array.isArray(s.zonas) ? s.zonas.filter(x=>x && x.a && x.b && x.k) : [];
    if(!z.length || Number(s.zonasN) !== (s.rows || []).length) return null;
    const of = p => z.find(x=>Number(p) >= x.a && Number(p) <= x.b) || null;
    const esc = standingsEsc_;
    return {
      cls: (r, prev)=>{
        const a = of(r.p), b = prev ? of(prev.p) : null;
        const cut = prev && (a || b) && a !== b ? " z-cut zc-" + (a || b).k : "";
        return (a ? " z-" + a.k : "") + cut;
      },
      legend: `<div class="st-leg">${z.map(x=>`<span class="st-leg-i"><i class="zd z-${esc(x.k)}"></i>${esc(x.t)} · ${x.a === x.b ? x.a + ".º" : x.a + ".º–" + x.b + ".º"}</span>`).join("")}</div>`
    };
  }catch(e){ return null; }
}
// v172: tabela a partir de um objeto de classificação (opts: title, advName → destaca o adversário)
// v212: jogos do FC Porto nesta modalidade (mais recente primeiro), contra uma equipa ou todos
function stGames_(sport, team){
  if(typeof EVENTS === "undefined" || !sport) return [];
  const w = e=>{ const d = new Date(e.day + "T" + (e.t || "00:00") + ":00"); return isNaN(d) ? 0 : d.getTime(); };
  return EVENTS.filter(e=>e.sport === sport && (!team || (typeof pgSameTeam_ === "function" && pgSameTeam_(e.athlete, team)))).sort((a, b)=>w(b) - w(a));
}
function stDone_(e){ const st = (typeof getEv === "function" && getEv(e.id)) || {}; return (st.resultado && String(st.resultado).trim()) ? st : null; }
function stTag_(st){ return st.resultTag === "win" ? ["V", "win"] : st.resultTag === "loss" ? ["D", "loss"] : st.resultTag === "draw" ? ["E", "draw"] : null; }
// forma do FC Porto (últimos 5 jogos com resultado), do mais antigo para o mais recente
function stFormHtml_(sport){
  const f = stGames_(sport).filter(e=>{ const d = stDone_(e); return d && stTag_(d); }).slice(0, 5).reverse();
  if(f.length < 2) return "";
  return `<span class="st-form">${f.map(e=>{ const t = stTag_(stDone_(e)); return `<span class="hv-tag hv-tag-${t[1]}">${t[0]}</span>`; }).join("")}</span>`;
}
// frase-resumo do FC Porto: distância ao 1.º e à zona de descida (só com as linhas e zonas da própria tabela)
function stSummaryHtml_(s, zmap, esc){
  try{
    const iP = (s.cols || []).indexOf("Pts");
    if(iP < 0) return "";
    const num = r=>{ const v = parseFloat(String(r.c && r.c[iP]).replace(",", ".")); return isNaN(v) ? null : v; };
    const me = s.rows.find(r=>r.me); if(!me) return "";
    const mp = num(me); if(mp == null) return "";
    const pl = x=>x === 1 ? "1 ponto" : x + " pontos";
    const parts = [];
    const first = s.rows[0], second = s.rows[1];
    if(me === first && second && num(second) != null){ const d = mp - num(second); parts.push(d > 0 ? `Lidera com ${pl(d)} de vantagem` : "Lidera, empatado em pontos"); }
    else if(first && num(first) != null){ const d = num(first) - mp; parts.push(d > 0 ? `A ${pl(d)} do 1.º` : "Empatado em pontos com o 1.º"); }
    const z = (Array.isArray(s.zonas) && zmap) ? s.zonas.find(x=>/desce/.test(x.k)) : null;
    if(z){
      const inZ = Number(me.p) >= z.a;
      if(!inZ){ const r = s.rows.find(x=>Number(x.p) === z.a); const rp = r ? num(r) : null; if(rp != null) parts.push(mp - rp > 0 ? `${pl(mp - rp)} acima da zona de descida` : "na linha da zona de descida"); }
      else { const r = s.rows.find(x=>Number(x.p) === z.a - 1); const rp = r ? num(r) : null; if(rp != null) parts.push(`na zona de descida, a ${pl(Math.max(0, rp - mp))} da salvação`); }
    }
    return parts.length ? `<div class="st-sum"><b>FC Porto:</b> ${esc(parts.join(" · "))}</div>` : "";
  }catch(e){ return ""; }
}
function standingsObjHtml_(s, opts){
  const esc = standingsEsc_;
  opts = opts || {};
  const cols = s.cols || [];
  const isAdv = r => !!(opts.advName && !r.me && typeof pgSameTeam_ === "function" && pgSameTeam_(r.t, opts.advName));
  const head = `<tr><th class="st-pos">#</th><th class="st-team">Equipa</th>${cols.map(c=>`<th class="${STANDINGS_OPT_COLS_[c] ? "st-opt " : ""}${c === "Pts" ? "st-pts" : ""}">${esc(c)}</th>`).join("")}</tr>`;
  const zmap = standingsZonasMap_(s);
  const clickable = r => !!(opts.sport && !r.me && stGames_(opts.sport, r.t).length);
  const body = s.rows.map((r, ri)=>`<tr class="${r.me ? "is-me" : ""}${isAdv(r) ? " is-adv" : ""}${zmap ? zmap.cls(r, s.rows[ri - 1]) : ""}${clickable(r) ? " st-click" : ""}"${clickable(r) ? ` data-stsport="${esc(opts.sport)}" data-stteam="${esc(r.t)}" tabindex="0"` : ""}><td class="st-pos">${esc(r.p)}</td><td class="st-team">${crestCell_(opts.sport, r)}${esc(r.t)}${r.me && opts.sport && !opts.noForm ? stFormHtml_(opts.sport) : ""}</td>${cols.map((c, i)=>`<td class="${STANDINGS_OPT_COLS_[c] ? "st-opt " : ""}${c === "Pts" ? "st-pts" : ""}">${esc((r.c || [])[i])}</td>`).join("")}</tr>`).join("");
  const sub = [s.comp, s.fase].filter(Boolean).join(" · ");
  const when = s.updated ? (s.manual ? "Atualizado à mão " + standingsAgo_(s.updated) : "Atualizado " + standingsAgo_(s.updated)) : "";
  return `<div class="hv-panel"><div class="hv-panel-head"><h3>${esc(opts.title || "Classificação")}</h3>${opts.editBtn || ""}</div>
    ${sub && !opts.hideSub ? `<div class="st-sub">${esc(sub)}</div>` : ""}
    ${opts.sport ? stSummaryHtml_(s, zmap, esc) : ""}
    <div class="st-wrap"><table class="st-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>
    ${zmap ? zmap.legend : ""}
    ${opts.sport === "Equipa B" ? `<div class="st-note">ℹ️ As equipas B não podem subir de divisão.</div>` : ""}
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
  const extra = compStandingsFor_(sport).map(t=>standingsObjHtml_(t, { title: t.comp || "Competição", hideSub: false, sport })).join("");
  if(!s || !Array.isArray(s.rows) || !s.rows.length){
    if(extra) return extra;
    if(typeof DATA_FRESH_ !== "undefined" && !DATA_FRESH_ && typeof skelHtml_ === "function") return skelHtml_(7);
    return `<div class="hv-panel"><div class="hv-panel-head"><h3>Classificação</h3>${editBtn}</div><div class="hv-empty">Classificação ainda não disponível para esta modalidade.</div></div>`;
  }
  return standingsObjHtml_(s, { editBtn, sport }) + extra;
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

// v177: mini-tabela depois do jogo — 5 linhas à volta do FC Porto, com J e Pts, e ligação à tabela completa
function miniStandingHtml_(ev){
  try{
    const S = (typeof STANDINGS === "object" && STANDINGS) ? STANDINGS[ev.sport] : null;
    if(!S || !Array.isArray(S.rows) || !S.rows.length) return "";
    const i = S.rows.findIndex(r=>r.me);
    if(i < 0) return "";
    const esc = standingsEsc_, cols = S.cols || [], iP = cols.indexOf("Pts"), iJ = cols.indexOf("J");
    let a = Math.max(0, i - 2), b = Math.min(S.rows.length, a + 5); a = Math.max(0, b - 5);
    const rows = S.rows.slice(a, b);
    const body = rows.map(r=>`<tr class="${r.me ? "is-me" : ""}"><td class="st-pos">${esc(r.p)}</td><td class="st-team">${crestCell_(ev.sport, r)}${esc(r.t)}</td><td>${iJ >= 0 ? esc((r.c || [])[iJ]) : ""}</td><td class="st-pts">${iP >= 0 ? esc((r.c || [])[iP]) : ""}</td></tr>`).join("");
    const zm = (typeof standingsZonasMap_ === "function") ? standingsZonasMap_(S) : null;
    const sum = stSummaryHtml_(S, zm, esc);
    return `<div class="gp-card"><h3>Classificação depois do jogo</h3>
      ${sum}
      <div class="st-wrap"><table class="st-table"><thead><tr><th class="st-pos">#</th><th class="st-team">Equipa</th><th>J</th><th class="st-pts">Pts</th></tr></thead><tbody>${body}</tbody></table></div>
      <button type="button" class="hv-btn hv-btn-ghost gp-act" id="gpTable2" style="width:100%;margin-top:8px;">Ver classificação completa</button></div>`;
  }catch(e){ return ""; }
}

// v212: tocar numa equipa da tabela mostra os jogos do FC Porto contra ela (linha que abre por baixo)
document.addEventListener("click", function(ev){
  const tr = ev.target.closest && ev.target.closest("tr.st-click");
  if(!tr) return;
  const open = tr.nextElementSibling && tr.nextElementSibling.classList.contains("st-games");
  if(open){ tr.nextElementSibling.remove(); tr.classList.remove("st-open"); return; }
  const sport = tr.getAttribute("data-stsport"), team = tr.getAttribute("data-stteam");
  const esc = standingsEsc_;
  const lst = stGames_(sport, team);
  if(!lst.length) return;
  const rows = lst.map(e=>{
    const st = stDone_(e), t = st ? stTag_(st) : null;
    const loc = e.local === "fora" ? "Fora" : e.local === "neutro" ? "Neutro" : "Casa";
    return `<button type="button" class="st-g" data-stg="${esc(e.id)}"><span class="st-g-d">${esc(typeof formatShortDate === "function" ? formatShortDate(e.day) : e.day)}</span><span class="st-g-m">${esc(loc)}${e.phase ? " · " + esc(e.phase) : ""}</span><span class="st-g-r">${st ? esc(String(st.resultado).trim()) : "por jogar"}</span>${t ? `<span class="hv-tag hv-tag-${t[1]}">${t[0]}</span>` : ""}</button>`;
  }).join("");
  const n = tr.children.length;
  const row = document.createElement("tr");
  row.className = "st-games";
  row.innerHTML = `<td colspan="${n}"><div class="st-g-head">FC Porto vs ${esc(team)}</div>${rows}</td>`;
  tr.after(row); tr.classList.add("st-open");
  row.querySelectorAll("[data-stg]").forEach(b=>{ b.onclick = e2=>{ e2.stopPropagation(); if(typeof openGamePage_ === "function") openGamePage_(b.getAttribute("data-stg")); }; });
});
document.addEventListener("keydown", function(ev){
  if((ev.key === "Enter" || ev.key === " ") && ev.target && ev.target.matches && ev.target.matches("tr.st-click")){ ev.preventDefault(); ev.target.click(); }
});
