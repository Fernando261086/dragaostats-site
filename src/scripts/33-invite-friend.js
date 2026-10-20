// ===================== "CONVIDA UM AMIGO" — partilhar a app em si =====================
// Pedido do Fernando: nada de referral a sério, só um botão simples a partilhar o
// link da app (não de um jogo em concreto, esse já tem o seu próprio "Partilhar
// no WhatsApp" por jogo). Visível a toda a gente (editor ou só ver), tal como o
// botão de reportar bug já é.
document.getElementById("inviteFriendBtn").onclick = async ()=>{
  const url = "https://dragaostats.pt";
  const text = "Vê os jogos, resultados e estatísticas das modalidades do FC Porto no Dragão Stats! 💙";
  if(navigator.share){
    try{ await navigator.share({ title: "Dragão Stats", text, url }); return; }catch(e){ return; } // cancelado ou falhou — não força o fallback por cima
  }
  if(navigator.clipboard){
    try{
      await navigator.clipboard.writeText(text + " " + url);
      alert("Link copiado! Já podes enviar a um amigo:\n" + text + " " + url);
      return;
    }catch(e){}
  }
  prompt("Copia este link:", url);
};
