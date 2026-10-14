// ===================== PEDIDOS: NEWSLETTER E INSTALAR =====================
// Nunca à 1ª visita — quem acabou de chegar ainda nem viu o site. A partir da 2ª visita
// (noutro dia) aparece UM pedido por dia, num banner pequeno que se fecha, por esta
// ordem: newsletter → instalar. (As notificações têm o seu próprio popup, mais abaixo.)
// Quem já cá veio antes desta versão conta logo como visita recorrente. Os botões
// fixos (🔔, 📲 e o formulário do rodapé) continuam sempre disponíveis. Se as
// boas-vindas ou as novidades estiverem abertas, espera.
(function initVisitCount(){
  // corre ao carregar o script, ANTES de a pessoa escrever o nome — senão um visitante
  // novo pareceria "já conhecido" (o nome só fica guardado depois de o escrever)
  try{
    const today = todayISO_();
    let v = null;
    try{ v = JSON.parse(localStorage.getItem("dia22-visits") || "null"); }catch(e){}
    if(!v || typeof v.n !== "number"){
      const returning = !!localStorage.getItem("dia22-intro-seen") || !!localStorage.getItem("dia22-viewer-name");
      v = { n: returning ? 2 : 1, last: today, first: today };
    }else if(v.last !== today){
      v = { ...v, n: v.n + 1, last: today, first: v.first || today };
    }else if(!v.first){
      v.first = today; // quem já tinha o contador de uma versão anterior, sem esta data
    }
    localStorage.setItem("dia22-visits", JSON.stringify(v));
  }catch(e){}
})();
function getVisitCount_(){
  try{ const v = JSON.parse(localStorage.getItem("dia22-visits") || "null"); return (v && v.n) || 1; }catch(e){ return 1; }
}
function getFirstVisitDate_(){
  try{ const v = JSON.parse(localStorage.getItem("dia22-visits") || "null"); return (v && v.first) || null; }catch(e){ return null; }
}
function askApplicable_(type){
  try{
    if(type === "newsletter"){
      return localStorage.getItem("dia22-newsletter-subscribed") !== "1"
          && localStorage.getItem("dia22-newsletter-banner-dismissed") !== "1";
    }
    if(type === "install"){
      if(isStandaloneMode()) return false;
      if(localStorage.getItem("dia22-install-banner-dismissed") === "1") return false;
      return !!deferredInstallPrompt || isIOSDevice();
    }
  }catch(e){}
  return false;
}
function showAsk_(type){
  ["newsletterBanner", "installBanner"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.style.display = "none";
  });
  if(type === "newsletter") maybeShowNewsletterBanner();
  else if(type === "install") maybeShowInstallBanner();
}
function runAskManager(){
  if(getVisitCount_() < 2) return;
  const busy = ["introOverlay", "changelogOverlay", "viewerGateOverlay", "adminGateOverlay"].some(id=>{
    const el = document.getElementById(id);
    return el && el.style.display && el.style.display !== "none";
  });
  if(busy) return; // não empilha um pedido em cima de um popup aberto; fica para a próxima
  const today = todayISO_();
  let cur = null;
  try{ cur = JSON.parse(localStorage.getItem("dia22-ask-current") || "null"); }catch(e){}
  if(cur && cur.day === today){
    // já há pedido decidido para hoje: mantém-se enquanto fizer sentido, sem passar ao seguinte no mesmo dia
    if(askApplicable_(cur.type)) showAsk_(cur.type);
    return;
  }
  const next = ["newsletter", "install"].find(askApplicable_);
  if(!next) return;
  try{ localStorage.setItem("dia22-ask-current", JSON.stringify({ day: today, type: next })); }catch(e){}
  showAsk_(next);
}
