// ===================== POPUP DE NOTIFICAÇÕES (logo na 1.ª visita, depois de a pessoa já ter espreitado) =====================
// As notificações são o que mais traz as pessoas de volta ao site. Por isso o pedido não
// espera pela 2.ª visita: aparece num popup pequeno ao fim de ~1 minuto no site, ou logo
// depois da 1.ª reação/prognóstico — o que vier primeiro. Só o clique em "Ativar" chama
// o pedido do browser (nunca pedimos a permissão sozinhos). "Agora não" volta a perguntar
// passados 5 dias, até 3 vezes; depois deixa em paz. Só para quem vê (não para o admin),
// no máximo uma vez por dia, e nunca por cima de outro popup aberto.
const NOTIFY_NUDGE_DELAY_MS = 60000;
const NOTIFY_NUDGE_SNOOZE_DAYS = 5;
const NOTIFY_NUDGE_MAX_DISMISSALS = 3;
let notifyNudgeShownThisLoad = false;
let notifyNudgeScheduled = false;
function readNudgeState_(){
  try{ return JSON.parse(localStorage.getItem("dia22-notify-nudge") || "null") || {}; }catch(e){ return {}; }
}
function writeNudgeState_(st){
  try{ localStorage.setItem("dia22-notify-nudge", JSON.stringify(st)); }catch(e){}
}
// "enable" = pode ativar já; "ios-install" = no iPhone/iPad só funciona com a app instalada
function notifyNudgeVariant_(){
  if(notificationsEnabled) return null;
  if("Notification" in window){
    return Notification.permission === "default" ? "enable" : null; // recusadas (ou desligadas de propósito): não insiste
  }
  if(isIOSDevice() && !isStandaloneMode()) return "ios-install";
  return null;
}
function notifyNudgeEligible_(){
  if(!READONLY_MODE) return null;
  const variant = notifyNudgeVariant_();
  if(!variant) return null;
  const st = readNudgeState_(), today = todayISO_();
  if((st.dismissals || 0) >= NOTIFY_NUDGE_MAX_DISMISSALS) return null;
  if(st.until && today < st.until) return null;
  if(st.lastShown === today) return null;
  return variant;
}
function tryShowNotifyNudge_(triesLeft){
  if(notifyNudgeShownThisLoad) return;
  const variant = notifyNudgeEligible_();
  if(!variant) return;
  if(document.visibilityState === "hidden"){
    document.addEventListener("visibilitychange", ()=> tryShowNotifyNudge_(triesLeft), { once:true });
    return;
  }
  const busy = ["introOverlay", "changelogOverlay", "viewerGateOverlay", "adminGateOverlay", "privacyOverlay", "termsOverlay", "aboutOverlay", "myYearOverlay"].some(id=>{
    const el = document.getElementById(id);
    return el && el.style.display && el.style.display !== "none";
  });
  if(busy){
    if(triesLeft > 0) setTimeout(()=> tryShowNotifyNudge_(triesLeft - 1), 8000);
    return;
  }
  notifyNudgeShownThisLoad = true;
  const today = todayISO_();
  const st = readNudgeState_();
  writeNudgeState_({ ...st, lastShown: today });
  const el = document.getElementById("notifyNudge");
  const isIOS = variant === "ios-install";
  document.getElementById("notifyNudgeText").textContent = isIOS
    ? "No iPhone, as notificações só funcionam com a app instalada no ecrã principal."
    : "Com as notificações ativas, nunca mais te esqueces de ver um resultado.";
  document.getElementById("notifyNudgeYes").textContent = isIOS ? "Como instalar" : "Ativar notificações";
  el.style.display = "block";
  // sem resposta ao fim de 30s, fecha sozinho (não conta como "Agora não": amanhã pode voltar)
  const autoHide = setTimeout(()=>{ el.style.display = "none"; }, 30000);
  document.getElementById("notifyNudgeYes").onclick = async ()=>{
    clearTimeout(autoHide);
    el.style.display = "none";
    if(isIOS){
      alert("Para instalar no iPhone/iPad: toca no ícone de Partilhar 🔗 na barra do Safari e depois em \"Adicionar ao ecrã principal\". Depois de instalada, abre a app e ativa as notificações.");
    }else{
      await enableNotifications();
    }
  };
  document.getElementById("notifyNudgeNo").onclick = ()=>{
    clearTimeout(autoHide);
    el.style.display = "none";
    const cur = readNudgeState_();
    writeNudgeState_({ ...cur, dismissals: (cur.dismissals || 0) + 1, until: shiftISODay_(todayISO_(), NOTIFY_NUDGE_SNOOZE_DAYS) });
  };
}
// chamada quando a pessoa reage a um jogo ou faz um prognóstico — bom momento para perguntar
function noteEngagement_(){
  if(notifyNudgeShownThisLoad || notifyNudgeScheduled || !notifyNudgeEligible_()) return;
  notifyNudgeScheduled = true;
  setTimeout(()=>{ notifyNudgeScheduled = false; tryShowNotifyNudge_(8); }, 1500);
}
function startNotifyNudgeTimer_(){
  if(!READONLY_MODE) return;
  setTimeout(()=> tryShowNotifyNudge_(8), NOTIFY_NUDGE_DELAY_MS);
}

