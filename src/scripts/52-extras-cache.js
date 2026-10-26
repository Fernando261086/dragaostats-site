// ===================== ABRIR JÁ PREENCHIDO + "SKELETONS" (v179) =====================
// Os eventos já tinham uma cópia local; classificações, plantel, escudos, forma e cronologia não — por isso, a cada visita, estes
// painéis apareciam vazios ("ainda não disponível") até o servidor responder. Agora guardamos a última cópia no aparelho e mostramo-la
// logo (o servidor continua a mandar: quando responde, substitui). Sem cópia (1.ª visita), mostram-se barras cinzentas em vez de "vazio".
let DATA_FRESH_ = false;
const EXTRAS_KEY_ = "dia22-extras-v1";
function extrasSave_(){
  try{
    const o = { at: Date.now(), standings: STANDINGS, comp: COMP_STANDINGS, plantel: PLANTEL, formas: FORMAS, detalhes: DETALHES, escudos: ESCUDOS };
    const txt = JSON.stringify(o);
    if(txt.length < 900000) localStorage.setItem(EXTRAS_KEY_, txt); else localStorage.removeItem(EXTRAS_KEY_);
  }catch(e){}
}
(function extrasRestore_(){
  try{
    const o = JSON.parse(localStorage.getItem(EXTRAS_KEY_) || "null");
    if(!o || typeof o !== "object") return;
    const ok = x=>x && typeof x === "object";
    if(ok(o.standings)) STANDINGS = o.standings;
    if(ok(o.comp)) COMP_STANDINGS = o.comp;
    if(ok(o.plantel)) PLANTEL = o.plantel;
    if(ok(o.formas)) FORMAS = o.formas;
    if(ok(o.detalhes)) DETALHES = o.detalhes;
    if(ok(o.escudos)) ESCUDOS = o.escudos;
  }catch(e){}
})();
setTimeout(()=>{ DATA_FRESH_ = true; }, 12000); // sem resposta (offline): deixa de mostrar barras
// barras cinzentas no lugar de um painel que ainda está a carregar
function skelHtml_(rows){
  const n = rows || 4;
  let r = "";
  for(let i = 0; i < n; i++) r += '<div class="skel-row"><i class="skel skel-c"></i><span class="skel skel-l" style="width:' + (48 + (i * 17) % 38) + '%"></span><span class="skel skel-r"></span></div>';
  return '<div class="hv-panel skel-panel" aria-busy="true" aria-label="A carregar"><div class="skel skel-h"></div>' + r + '</div>';
}
