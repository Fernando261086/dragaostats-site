// ===================== v183: ECRÃ "TABELAS" (classificações de todas as modalidades) =====================
// Botão da barra de baixo para o público. Escolhe-se a modalidade nas pílulas e mostra-se o mesmo painel
// de classificação da página de modalidade (standingsPanelHtml_), com as tabelas europeias a seguir.
let clsSport_ = "";
function clsSports_(){
  const set = new Set();
  try{ (EVENTS || []).forEach(ev=>{ if(ev.sport) set.add(ev.sport); }); }catch(e){}
  try{ Object.keys(STANDINGS || {}).forEach(k=>set.add(k)); }catch(e){}
  return Array.from(set).sort((a, b)=>a.localeCompare(b, "pt"));
}
function renderClsView_(){
  const host = document.getElementById("clsView");
  if(!host || host.style.display === "none") return;
  const esc = homeEsc_, sports = clsSports_();
  if(!sports.length){ host.innerHTML = '<div class="hv-panel"><div class="hv-empty">Sem modalidades ainda.</div></div>'; return; }
  const fav = (typeof favSport_ === "function") ? favSport_() : "";
  if(!clsSport_ || !sports.includes(clsSport_)){
    const withData = sports.filter(sp=>STANDINGS && STANDINGS[sp] && (STANDINGS[sp].rows || []).length);
    clsSport_ = (fav && sports.includes(fav)) ? fav : (withData[0] || sports[0]);
  }
  const pills = sports.map(sp=>`<button type="button" class="hv-pillbtn${sp === clsSport_ ? " active" : ""}" data-clssport="${esc(sp)}">${esc(sp)}</button>`).join("");
  host.innerHTML = `<div class="hv-top" style="--sc:${homeColor_(clsSport_)};"><div class="cls-head"><h2>Classificações</h2></div><div class="hv-pills">${pills}</div>${(typeof standingsPanelHtml_ === "function") ? standingsPanelHtml_(clsSport_) : ""}</div>`;
  host.querySelectorAll("[data-clssport]").forEach(b=>{ b.onclick = ()=>{ clsSport_ = b.getAttribute("data-clssport"); if(typeof track_ === "function") track_("classificacao_aberta"); renderClsView_(); }; });
  if(typeof wireStandingsPanel_ === "function") wireStandingsPanel_(host, clsSport_);
}
