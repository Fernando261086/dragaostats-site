// ===================== PLANTEL (v170) =====================
// Separador "Plantel" da página de modalidade: jogadores (número, nome, posição) e equipa técnica, só texto.
// Vem do site oficial do FC Porto, lido pelo Apps Script v120 (campo `plantel` do doGet).
let PLANTEL = {}; // { "Modalidade": { t, j:[[número,nome,posição]], s:[[nome,cargo]] } }
const SQUAD_POS_ORDER_ = ["guarda-redes", "defesa", "medio", "avancado"];
function squadHas_(sport){ return !!(PLANTEL && PLANTEL[sport] && Array.isArray(PLANTEL[sport].j) && PLANTEL[sport].j.length); }
function squadPanelHtml_(sport){
  const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (s=>String(s == null ? "" : s));
  if(!squadHas_(sport)) return '<div class="hv-panel"><div class="hv-empty">Plantel ainda não disponível para esta modalidade.</div></div>';
  const p = PLANTEL[sport];
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const grupos = [];
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
    return `<div class="hv-panel sq-grp"><div class="hv-panel-head"><h3>${esc(g.pos)}</h3><span class="sq-n">${g.rows.length}</span></div>${g.rows.map(r=>`<div class="sq-row"><span class="sq-num">${esc(r[0] || "–")}</span><span class="sq-name">${esc(r[1])}</span></div>`).join("")}</div>`;
  }).join("");
  const staff = (p.s && p.s.length) ? `<div class="hv-panel sq-grp"><div class="hv-panel-head"><h3>Equipa técnica</h3><span class="sq-n">${p.s.length}</span></div>${p.s.map(r=>`<div class="sq-row"><span class="sq-num sq-staff">•</span><span class="sq-name">${esc(r[0])}${r[1] ? `<span class="sq-role">${esc(r[1])}</span>` : ""}</span></div>`).join("")}</div>` : "";
  return jog + staff + '<div class="st-foot">Fonte: fcporto.pt' + (p.t && typeof standingsAgo_ === "function" ? " · atualizado " + standingsAgo_(p.t) : "") + "</div>";
}
