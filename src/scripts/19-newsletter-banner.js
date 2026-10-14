// ===================== BANNER DA NEWSLETTER (topo da app, ambos os modos) =====================
function maybeShowNewsletterBanner(){
  let subscribed = false;
  try{ subscribed = localStorage.getItem("dia22-newsletter-subscribed") === "1"; }catch(e){}
  if(subscribed) return; // já está inscrito, nunca mais incomoda
  let dismissed = false;
  try{ dismissed = localStorage.getItem("dia22-newsletter-banner-dismissed") === "1"; }catch(e){}
  if(dismissed) return;
  document.getElementById("newsletterBanner").style.display = "flex";
  updateNewsletterBannerNotifyBtn();
}
// O botão de notificações dentro deste banner só aparece enquanto ainda não
// estiverem ativas — assim que a pessoa as liga (aqui ou no botão 🔔 normal),
// desaparece sozinho, sem precisar de fechar o banner todo.
function updateNewsletterBannerNotifyBtn(){
  const btn = document.getElementById("newsletterBannerNotifyBtn");
  const text = document.getElementById("newsletterBannerText");
  if(!btn || !text) return; // o banner pode já ter sido substituído pelo formulário de email
  if(notificationsEnabled){
    btn.style.display = "none";
    text.textContent = "📧 Recebe o resumo semanal por email, com os resultados de todas as modalidades.";
  }else{
    btn.style.display = "";
    text.textContent = "📧🔔 Recebe o resumo semanal por email e ativa as notificações — não percas nenhum resultado!";
  }
}
document.getElementById("newsletterBannerNotifyBtn").onclick = async ()=>{
  await enableNotifications();
  updateNewsletterBannerNotifyBtn();
};
document.getElementById("newsletterBannerDismiss").onclick = ()=>{
  document.getElementById("newsletterBanner").style.display = "none";
  try{ localStorage.setItem("dia22-newsletter-banner-dismissed", "1"); }catch(e){}
};
document.getElementById("newsletterBannerBtn").onclick = ()=>{
  const banner = document.getElementById("newsletterBanner");
  banner.innerHTML = `
    <span style="font-size:13px; color:var(--text); flex:1; min-width:180px;">Qual é o teu email?</span>
    <div style="display:flex; gap:8px; flex:1; min-width:220px;">
      <input type="email" id="newsletterBannerEmailInput" placeholder="o-teu-email@exemplo.com" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:8px; padding:6px 9px; font-size:13px; color:var(--text);">
      <button class="add-save" id="newsletterBannerConfirmBtn" style="padding:6px 14px; font-size:12.5px; white-space:nowrap;">Confirmar</button>
    </div>
    <div style="font-size:10.5px; color:var(--text-dim); opacity:0.75; flex-basis:100%;">Ao inscreveres-te, aceitas receber este email semanal. Podes cancelar a qualquer momento. <span class="newsletter-privacy-link" style="color:var(--gold-dim); text-decoration:underline; cursor:pointer;">Política de Privacidade</span></div>
  `;
  document.getElementById("newsletterBannerConfirmBtn").onclick = async ()=>{
    const input = document.getElementById("newsletterBannerEmailInput");
    const email = input.value.trim();
    if(!email || !email.includes("@") || !email.includes(".")){
      alert("Escreve um email válido.");
      return;
    }
    const btn = document.getElementById("newsletterBannerConfirmBtn");
    btn.disabled = true;
    btn.textContent = "A inscrever...";
    try{
      const r = await fetch(STORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ subscribeNewsletter: { email: email } })
      });
      const result = await r.json().catch(()=>null);
      if(result && result.ok === true){
        try{ localStorage.setItem("dia22-newsletter-subscribed", "1"); }catch(e){}
        banner.innerHTML = `<span style="font-size:13px; color:var(--text);">📩 Falta um passo — abre o teu email e confirma a inscrição. Se não aparecer, verifica a pasta de spam/lixo.</span>`;
        setTimeout(()=>{ banner.style.display = "none"; }, 2500);
      }else{
        btn.disabled = false;
        btn.textContent = "Confirmar";
        alert("⚠️ Não foi possível inscrever: " + (result && result.error ? result.error : "erro desconhecido"));
      }
    }catch(err){
      btn.disabled = false;
      btn.textContent = "Confirmar";
      alert("⚠️ Erro de rede: " + err.message);
    }
  };
};
