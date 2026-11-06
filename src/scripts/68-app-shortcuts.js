// ===================== ATALHOS DA APP INSTALADA (v266) =====================
// O manifest (public/manifest.json) tem 3 atalhos que aparecem no toque longo do ícone: ?ir=hoje, ?ir=ao-vivo e ?ir=semana
// (levam também ?src=atalho, por isso o resumo semanal passa a mostrar "origem_atalho"). Chamada por init (18) no lugar do Início por defeito.
// Devolve true se tratou do pedido (e já abriu um ecrã).
function appShortcut_(ir){
  try{
    if(typeof currentCompMode !== "function" || currentCompMode() !== "matches") return false;
    ir = String(ir || "").toLowerCase();
    if(ir === "semana"){
      weekOffset = 0; weekDay_ = null;
      setView("hoje-todas"); window.scrollTo(0, 0);
      return true;
    }
    if(ir === "ao-vivo"){
      const vivos = EVENTS.filter(e=>{ const j = (typeof cevLiveFor_ === "function") ? cevLiveFor_(e) : null; return j && j.estado === "vivo"; });
      if(vivos.length === 1){ goToEventCard(vivos[0].id); return true; } // um só jogo ao vivo: vai direto à página dele
      setView("inicio"); window.scrollTo(0, 0); // vários (o cartão AO VIVO de cada um está no topo) ou nenhum
      return true;
    }
    if(ir === "hoje"){
      const hoje = (typeof getTodaysGames_ === "function") ? getTodaysGames_() : [];
      if(hoje.length === 1){ goToEventCard(hoje[0].id); return true; }
      setView("inicio"); window.scrollTo(0, 0);
      setTimeout(()=>{ try{ const t = document.querySelector(".hv-today"); if(t) t.scrollIntoView({ block: "center", behavior: "smooth" }); }catch(e){} }, 250);
      return true;
    }
  }catch(e){}
  return false;
}
