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
let ncSeen_ = false;
// v248: o texto muda com o momento (início, jogo ao vivo, antes do jogo, jogo terminado, link partilhado) e diz o que se recebe.
// state (só na página do jogo): "vivo" | "antes" | "fim"
function notifyCtaHtml_(ctx, state){
  if(!notifyCtaShow_()) return "";
  const ios = notifyCtaVariant_() === "ios";
  let titulo = "Não percas nenhum resultado";
  let txt = "Recebe um aviso quando o jogo começa, os golos das equipas de futebol e o resultado final.";
  if(ctx === "jogo"){
    if(state === "vivo"){ titulo = "Segue este jogo no telemóvel"; txt = "Recebe o resultado final e, nas equipas de futebol, os golos — mesmo com o site fechado."; }
    else if(state === "fim"){ titulo = "Queres saber o resultado do próximo jogo?"; txt = "Ativa os avisos e recebes quando o FC Porto começar a jogar e o resultado final."; }
    else { titulo = window.__linkedGame_ ? "Recebe o resultado deste jogo" : "Não percas este jogo"; txt = "Avisamos-te quando começar e quando houver resultado — mesmo com o site fechado."; }
  }
  if(!ncSeen_){ ncSeen_ = true; try{ if(typeof track_ === "function") track_("nc_visto"); }catch(e){} }
  return `<div class="nc-card"><span class="nc-ico">🔔</span><div class="nc-body"><b class="nc-t">${titulo}</b><span class="nc-s">${txt}</span></div>
    <div class="nc-btns"><button type="button" class="hv-btn hv-btn-main nc-yes" data-ncyes="1">${ios ? "Como instalar" : "Ativar avisos"}</button><button type="button" class="nc-no" data-ncno="1" aria-label="Agora não">Agora não</button></div></div>`;
}
// iPhone/iPad: os avisos só funcionam com o site instalado no ecrã principal; explica-o num painel curto em vez de um alert
function iosInstallSheet_(){
  if(document.getElementById("iosSheet")) return;
  const el = document.createElement("div");
  el.id = "iosSheet"; el.className = "sh-overlay";
  el.innerHTML = `<div class="sh-sheet" role="dialog" aria-label="Instalar no iPhone">
    <div class="sh-top"><b>🔔 Avisos no iPhone</b><button type="button" class="sh-x" aria-label="Fechar">✕</button></div>
    <p class="ios-p">No iPhone os avisos só funcionam com o Dragão Stats instalado no ecrã principal. São 3 passos, demora meio minuto:</p>
    <ol class="ios-ol"><li>Abre este site no <b>Safari</b> e toca em <b>Partilhar</b> (o quadrado com a seta para cima).</li><li>Escolhe <b>«Adicionar ao ecrã principal»</b>.</li><li>Abre o <b>Dragão Stats</b> a partir do novo ícone e toca em <b>«Ativar avisos»</b>.</li></ol>
  </div>`;
  document.body.appendChild(el);
  const close = ()=>el.remove();
  el.querySelector(".sh-x").onclick = close;
  el.addEventListener("click", e=>{ if(e.target === el) close(); });
}
function bindNotifyCta_(host, rerender){
  host.querySelectorAll("[data-ncyes]").forEach(b=>{ b.onclick = async ()=>{
    if(notifyCtaVariant_() === "ios"){ try{ track_("nc_ios_ajuda"); }catch(e){} iosInstallSheet_(); return; }
    try{ track_("nc_clique"); }catch(e){}
    await enableNotifications();
    try{ rerender(); }catch(e){}
  }; });
  host.querySelectorAll("[data-ncno]").forEach(b=>{ b.onclick = ()=>{
    try{ track_("nc_agora_nao"); }catch(e){}
    try{ localStorage.setItem("dia22-notify-cta-until", shiftISODay_(todayISO_(), 5)); }catch(e){}
    try{ rerender(); }catch(e){}
  }; });
}
// botão pequeno no cartão «AO VIVO» (delegado: o cartão é redesenhado a cada 15 s)
document.addEventListener("click", async e=>{
  const b = e.target.closest && e.target.closest("[data-ncquick]");
  if(!b) return;
  e.stopPropagation(); e.preventDefault();
  if(notifyCtaVariant_() === "ios"){ try{ track_("nc_ios_ajuda"); }catch(x){} iosInstallSheet_(); return; }
  try{ track_("nc_ao_vivo"); }catch(x){}
  try{ await enableNotifications(); }catch(x){}
  try{ if(typeof renderLiveNowBanner_ === "function") renderLiveNowBanner_(); }catch(x){}
}, true);
