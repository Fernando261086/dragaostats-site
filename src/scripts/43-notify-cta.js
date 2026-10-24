// ===================== CONVITE PARA ATIVAR AS NOTIFICAÇÕES (v155) =====================
// Cartão no Início e na página do jogo, para quem só vê e ainda não tem os avisos ligados.
// Só promete o que existe: o resultado final (quando é publicado) e o lembrete 1 hora antes ("Lembrar-me").
// "Agora não" esconde o cartão 5 dias (não insiste em cada visita). Sem permissão pedida sozinha: só ao tocar.
function notifyCtaVariant_(){
  try{
    if(!READONLY_MODE || notificationsEnabled) return null;
    if("Notification" in window){ return Notification.permission === "default" ? "enable" : null; }
    if(typeof isIOSDevice === "function" && isIOSDevice() && !(typeof isStandaloneMode === "function" && isStandaloneMode())) return "ios";
  }catch(e){}
  return null;
}
function notifyCtaHidden_(){
  try{ const u = localStorage.getItem("dia22-notify-cta-until"); return !!(u && todayISO_() < u); }catch(e){ return false; }
}
function notifyCtaShow_(){ return !!notifyCtaVariant_() && !notifyCtaHidden_(); }
function notifyCtaHtml_(ctx){
  if(!notifyCtaShow_()) return "";
  const ios = notifyCtaVariant_() === "ios";
  const txt = ctx === "jogo"
    ? "Recebe o <b>resultado final</b> assim que for publicado e, com “Lembrar-me”, um aviso 1 hora antes do jogo."
    : "Recebe o <b>resultado final</b> de cada jogo do FC Porto e um aviso 1 hora antes dos jogos que escolheres.";
  return `<div class="nc-card"><span class="nc-ico">🔔</span><div class="nc-body"><b class="nc-t">Não percas nenhum resultado</b><span class="nc-s">${txt}</span></div>
    <div class="nc-btns"><button type="button" class="hv-btn hv-btn-main nc-yes" data-ncyes="1">${ios ? "Como instalar" : "Ativar avisos"}</button><button type="button" class="nc-no" data-ncno="1" aria-label="Agora não">Agora não</button></div></div>`;
}
function bindNotifyCta_(host, rerender){
  host.querySelectorAll("[data-ncyes]").forEach(b=>{ b.onclick = async ()=>{
    if(notifyCtaVariant_() === "ios"){ alert("Para instalar no iPhone/iPad: toca no ícone de Partilhar 🔗 na barra do Safari e depois em \"Adicionar ao ecrã principal\". Depois de instalada, abre a app e ativa os avisos."); return; }
    await enableNotifications();
    try{ rerender(); }catch(e){}
  }; });
  host.querySelectorAll("[data-ncno]").forEach(b=>{ b.onclick = ()=>{
    try{ localStorage.setItem("dia22-notify-cta-until", shiftISODay_(todayISO_(), 5)); }catch(e){}
    try{ rerender(); }catch(e){}
  }; });
}
