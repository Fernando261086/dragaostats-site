// ===================== CRONOLOGIA E ESTATÍSTICAS DO JOGO (v162) =====================
// Vêm do Apps Script v112 (campo "detalhes" do doGet, lido do Sofascore): golos, cartões, substituições e estatísticas.
// É só informação para ver — nunca altera o resultado nem os marcadores oficiais, que continuam a ser escritos à mão.
let DETALHES = {};
function gameDetailsHtml_(ev){
  const d = (DETALHES && typeof DETALHES === "object") ? DETALHES[ev.id] : null;
  if(!d) return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const inc = Array.isArray(d.inc) ? d.inc : [], st = Array.isArray(d.st) ? d.st : [];
  if(!inc.length && !st.length) return "";
  const icone = {G:"⚽", GP:"⚽", AG:"⚽", CA:"🟨", CV:"🟥", CA2:"🟥", S:"🔄", O:"•"};
  let html = "";
  if(inc.length){
    const linhas = inc.slice().reverse().map(x=>{
      const min = esc(x[0]), tipo = x[1], lado = x[2] === 1 ? "adv" : "fcp", nome = esc(x[3] || ""), extra = esc(x[4] || "");
      let txt = "";
      if(tipo === "S") txt = `<b>↑ ${nome}</b>${extra ? ` <i>↓ ${extra}</i>` : ""}`;
      else if(tipo === "GP") txt = `<b>${nome}</b> <i>(penálti)</i>`;
      else if(tipo === "AG") txt = `<b>${nome}</b> <i>(auto-golo)</i>`;
      else if(tipo === "G") txt = `<b>${nome}</b>${extra ? ` <i>(ass. ${extra})</i>` : ""}`;
      else if(tipo === "CA2") txt = `<b>${nome}</b> <i>(2.º amarelo)</i>`;
      else txt = `<b>${nome}</b>${extra ? ` <i>${extra}</i>` : ""}`;
      return `<div class="gd-row gd-${lado}"><span class="gd-min">${min}'</span><span class="gd-ic">${icone[tipo] || "•"}</span><span class="gd-tx">${txt}</span></div>`;
    }).join("");
    html += `<div class="gp-card"><h3>Cronologia</h3><div class="gd-list">${linhas}</div></div>`;
  }
  if(st.length){
    const linhas = st.map(x=>{
      const a = parseFloat(String(x[1]).replace(",", ".")) || 0, b = parseFloat(String(x[2]).replace(",", ".")) || 0, tot = a + b;
      const pa = tot > 0 ? Math.round(a / tot * 100) : 50;
      return `<div class="gd-st"><div class="gd-st-t"><b>${esc(x[1])}</b><span>${esc(x[0])}</span><b>${esc(x[2])}</b></div><div class="gd-bar"><i style="width:${pa}%"></i></div></div>`;
    }).join("");
    html += `<div class="gp-card"><h3>Estatísticas</h3>${linhas}</div>`;
  }
  return html + `<div class="gd-src">Cronologia e estatísticas: Sofascore, podem ter atraso. O resultado oficial é o do site.</div>`;
}

// v177: últimos acontecimentos no cartão "ao vivo" do Início (3 mais recentes da cronologia, se houver)
function liveRecentHtml_(ev){
  const d = (DETALHES && typeof DETALHES === "object") ? DETALHES[ev.id] : null;
  const inc = d && Array.isArray(d.inc) ? d.inc.filter(x=>x && x[1] && x[1] !== "O" && x[1] !== "S").slice(-3).reverse() : [];
  if(!inc.length) return "";
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  const icone = {G:"⚽", GP:"⚽", AG:"⚽", CA:"🟨", CV:"🟥", CA2:"🟥"};
  const rot = {G:"Golo", GP:"Golo de penálti", AG:"Auto-golo", CA:"Cartão amarelo", CV:"Cartão vermelho", CA2:"2.º amarelo"};
  return `<div class="hv-live-ev"><div class="hv-live-ev-t">Últimos acontecimentos</div>${inc.map(x=>{
    const lado = x[2] === 1 ? (typeof homeOpp_ === "function" ? homeOpp_(ev) : "Adversário") : "FC Porto";
    return `<div class="hv-live-row"><span class="hv-live-min">${esc(x[0])}'</span><span>${icone[x[1]] || "•"}</span><span class="hv-live-tx">${esc(rot[x[1]] || "Lance")} · ${esc(lado)}${x[3] ? " <i>" + esc(x[3]) + "</i>" : ""}</span></div>`;
  }).join("")}</div>`;
}
