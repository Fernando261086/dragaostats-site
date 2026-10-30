// ===================== v227: SEPARADOR "NOTÍCIAS" =====================
// Todas as notícias (ou de uma modalidade, pelas pílulas). Usa os mesmos cartões do Início (newsCardHtml_).
let newsSport_ = "";
function renderNewsView_(){
  const host = document.getElementById("newsView");
  if(!host || host.style.display === "none") return;
  const esc = homeEsc_;
  const sports = Object.keys(NOTICIAS || {}).filter(sp=>newsHas_(sp)).sort((a, b)=>a.localeCompare(b, "pt"));
  if(!sports.length){ host.innerHTML = '<div class="hv-top"><div class="cls-head"><h2>Notícias</h2></div><div class="hv-panel"><div class="hv-empty">Ainda sem notícias.</div></div></div>'; return; }
  if(newsSport_ && !sports.includes(newsSport_)) newsSport_ = "";
  const pills = ['<button type="button" class="hv-pillbtn' + (newsSport_ ? "" : " active") + '" data-nwsport="">Todas</button>']
    .concat(sports.map(sp=>`<button type="button" class="hv-pillbtn${sp === newsSport_ ? " active" : ""}" data-nwsport="${esc(sp)}">${esc(sp)}</button>`)).join("");
  let items = [];
  const seen = new Set();
  sports.filter(sp=>!newsSport_ || sp === newsSport_).forEach(sp=>(NOTICIAS[sp] || []).forEach(n=>{ if(seen.has(n.id)) return; seen.add(n.id); items.push({ n, sp }); }));
  items.sort((a, b)=>b.n.d - a.n.d);
  const cards = items.map(x=>newsCardHtml_(x.n, x.sp, !newsSport_)).join("");
  host.innerHTML = `<div class="hv-top"><div class="cls-head"><h2>Notícias</h2></div><div class="hv-pills">${pills}</div><div class="hv-panel nw-panel">${cards}${NEWS_NOTE_}</div></div>`;
  host.querySelectorAll("[data-nwsport]").forEach(b=>{ b.onclick = ()=>{ newsSport_ = b.getAttribute("data-nwsport") || ""; renderNewsView_(); }; });
  bindNews_(host, renderNewsView_);
}
