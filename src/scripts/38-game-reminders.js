// ===================== "LEMBRAR-ME" NUM JOGO =====================
// O pedido fica guardado no Apps Script (v93+), que avisa por push 1 hora antes do jogo,
// só quem o pediu. Aqui só se guarda, neste aparelho, a lista de jogos já pedidos (para mostrar o estado).
let gameReminders_ = new Set();
try{ JSON.parse(localStorage.getItem("dia22-reminders") || "[]").forEach(x=>gameReminders_.add(x)); }catch(e){}
function saveGameReminders_(){ try{ localStorage.setItem("dia22-reminders", JSON.stringify(Array.from(gameReminders_))); }catch(e){} }
function hasGameReminder_(evId){ return gameReminders_.has(evId); }

async function toggleGameReminder_(evId, btn){
  const on = !gameReminders_.has(evId);
  if(btn) btn.disabled = true;
  try{
    if(on){
      if(!notificationsEnabled){ const ok = await enableNotifications(); if(!ok) return; }
      if(!currentPushToken){ try{ await registerForPushNotifications(); }catch(e){} }
      if(!currentPushToken){ alert("Não foi possível ativar os avisos neste aparelho. Confirma que as notificações estão permitidas no browser."); return; }
    }
    if(currentPushToken){
      let okResp = false;
      try{
        const r = await fetch(STORE_URL, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body: JSON.stringify({ setGameReminder:{ token: currentPushToken, evId: evId, on: on } }) });
        const j = await r.json();
        okResp = !!(j && j.ok && j.reminder === on);
      }catch(e){}
      if(!okResp){ alert("De momento não foi possível guardar o lembrete. Tenta outra vez daqui a pouco."); return; }
    }
    if(on) gameReminders_.add(evId); else gameReminders_.delete(evId);
    saveGameReminders_();
    if(on && typeof showAppNotification === "function") showAppNotification("Lembrete ativo", "Vais receber um aviso 1 hora antes do jogo.");
  }finally{
    if(btn) btn.disabled = false;
    if(typeof renderHomeView_ === "function") renderHomeView_(true);
    if(typeof renderSportPage_ === "function") renderSportPage_();
  }
}
