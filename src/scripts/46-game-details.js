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
