// ===================== RENOMEAR A «COMPETIÇÃO» DE VÁRIOS JOGOS (v267) =====================
// Botão 🏷️ junto aos da competição (só edição). O nome da competição de cada jogo (ev.detail, campo «Competição» do editor) é texto livre;
// isto troca-o de uma vez em todos os jogos de uma modalidade que tenham o nome antigo, em todas as competições/épocas em Modo Modalidades.
// Só mexe em ev.detail (não na fase, nem no resultado). A competição ativa grava-se como sempre (saveEvents); as outras com o mesmo pedido de gravação do persistAll.
function renameDetailScan_(sport){
  const out = {}; // nome -> { n: jogos, comps: Set }
  (ALL.competitions || []).forEach(c=>{
    if(!c || c.mode !== "matches") return;
    const evs = c.id === activeCompId ? EVENTS : ((ALL.data[c.id] || {}).events || []);
    (evs || []).forEach(e=>{
      if(!e || e.sport !== sport || !String(e.detail || "").trim()) return;
      const k = String(e.detail).trim();
      (out[k] = out[k] || { n: 0 }).n++;
    });
  });
  return out;
}
async function renameDetailRun_(sport, de, para){
  let total = 0;
  const falhas = [];
  for(const c of (ALL.competitions || [])){
    if(!c || c.mode !== "matches") continue;
    const ativa = c.id === activeCompId;
    const evs = ativa ? EVENTS : ((ALL.data[c.id] || {}).events || []);
    let n = 0;
    (evs || []).forEach(e=>{ if(e && e.sport === sport && String(e.detail || "").trim() === de){ e.detail = para; n++; } });
    if(!n) continue;
    total += n;
    if(ativa){ await saveEvents(); continue; }
    try{
      const r = await fetch(STORE_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ compId: c.id, compData: { events: ALL.data[c.id].events, status: ALL.data[c.id].status || {} }, adminPassword: getAdminPassword() }) });
      const j = await r.json().catch(()=>null);
      if(!j || j.ok !== true) falhas.push(c.name);
    }catch(e){ falhas.push(c.name); }
  }
  return { total, falhas };
}
document.getElementById("renameDetailBtn").onclick = async ()=>{
  if(READONLY_MODE) return;
  const sport = (prompt("Em que modalidade? (escreve o nome exatamente como aparece)", "Basquetebol") || "").trim();
  if(!sport) return;
  const achados = renameDetailScan_(sport);
  const nomes = Object.keys(achados);
  if(!nomes.length){ alert('Não encontrei jogos de "' + sport + '" com competição escrita.'); return; }
  const lista = nomes.map((n, i)=>(i + 1) + ") " + n + " — " + achados[n].n + (achados[n].n === 1 ? " jogo" : " jogos")).join("\n");
  const esc = (prompt("Competições de " + sport + " (em todas as épocas). Escreve o NÚMERO da que queres renomear:\n\n" + lista, "") || "").trim();
  const de = nomes[parseInt(esc, 10) - 1];
  if(!de) return;
  const para = (prompt('Novo nome para "' + de + '":', de) || "").trim();
  if(!para || para === de) return;
  if(para.length > 80){ alert("Esse nome é demasiado comprido."); return; }
  if(!confirm('Trocar "' + de + '" por "' + para + '" em ' + achados[de].n + (achados[de].n === 1 ? " jogo" : " jogos") + " de " + sport + "?\n\nSó muda o nome da competição; o resto dos jogos fica igual.")) return;
  const r = await renameDetailRun_(sport, de, para);
  try{ renderFilters(); renderProgress(); renderTimeline(); if(typeof renderHomeView_ === "function") renderHomeView_(true); }catch(e){}
  alert(r.falhas.length ? ("Renomeei " + r.total + " jogos, mas a gravação falhou em: " + r.falhas.join(", ") + ". Tenta outra vez nessas épocas.") : ("Feito: " + r.total + (r.total === 1 ? " jogo renomeado." : " jogos renomeados.")));
};
