// ===================== "RESULTADO GUARDADO — PARTILHAR?" (v157) =====================
// Quando quem edita acaba de escrever um resultado (ao sair do campo), aparece uma folha em baixo
// com a imagem, o reel e o texto desse jogo prontos a usar — sem ter de ir ao menu 📤 do cartão.
// Só em modo edição, só quando o resultado mudou, e fecha-se com ✕. Não grava nada.
const resultPromptLast_ = {};
function resultShareText_(ev, st){
  const t = postTeams_(ev), score = String(st.resultado).trim();
  let tag = st.resultTag === "win" ? "Vitória" : st.resultTag === "loss" ? "Derrota" : st.resultTag === "draw" ? "Empate" : "";
  if(!tag){
    const m = score.match(/(\d+)\s*[-–:]\s*(\d+)/);
    if(m){
      const a = Number(m[1]), b = Number(m[2]), fcp = ev.local === "fora" ? b : a, adv = ev.local === "fora" ? a : b;
      tag = fcp > adv ? "Vitória" : fcp < adv ? "Derrota" : "Empate";
    }
  }
  const dp = [ev.detail, ev.phase].filter(Boolean).join(", ");
  const tags = ["#FCPorto", "#DragaoStats"], h = postSportHashtag_(ev.sport); if(h) tags.push(h);
  return `${postSportEmoji_(ev.sport)} ${ev.sport} — ${t.home} ${score} ${t.away}${tag ? " (" + tag + ")" : ""}\n${dp ? dp + "\n" : ""}\nTodos os resultados e classificações em https://dragaostats.pt\n\n${tags.join(" ")}`;
}
function closeResultPrompt_(){ const el = document.getElementById("resultSharePrompt"); if(el) el.remove(); }
function showResultSharePrompt_(evId){
  try{
    if(READONLY_MODE || currentCompMode() !== "matches") return;
    const ev = EVENTS.find(e=>e.id === evId); if(!ev) return;
    const st = getEv(evId) || {};
    const res = st.resultado && String(st.resultado).trim();
    if(!res || resultPromptLast_[evId] === res) return;
    resultPromptLast_[evId] = res;
    closeResultPrompt_();
    const esc = (typeof homeEsc_ === "function") ? homeEsc_ : (x=>String(x));
    const t = postTeams_(ev), cor = (typeof SPORT_COLORS !== "undefined" && SPORT_COLORS[ev.sport]) || "#e3b23c";
    const el = document.createElement("div");
    el.id = "resultSharePrompt"; el.className = "rsp";
    el.innerHTML = `<div class="rsp-top"><b>✅ Resultado guardado</b><button type="button" class="rsp-x" aria-label="Fechar">✕</button></div>
      <div class="rsp-match">${esc(t.home)} <b>${esc(res)}</b> ${esc(t.away)}</div>
      <div class="rsp-btns"><button type="button" data-rsp="img">🖼️ Imagem</button><button type="button" data-rsp="reel">🎬 Reel</button><button type="button" data-rsp="txt">📋 Copiar texto</button></div>`;
    document.body.appendChild(el);
    el.querySelector(".rsp-x").onclick = closeResultPrompt_;
    el.querySelector('[data-rsp="img"]').onclick = ()=>generateShareCard(ev, getEv(evId) || {}, cor);
    el.querySelector('[data-rsp="reel"]').onclick = ()=>generateShareReel(ev, getEv(evId) || {}, cor);
    const bt = el.querySelector('[data-rsp="txt"]');
    bt.onclick = async ()=>{
      const txt = resultShareText_(ev, getEv(evId) || {});
      try{ await navigator.clipboard.writeText(txt); }catch(e){ prompt("Copia o texto:", txt); }
      bt.textContent = "Copiado ✓"; setTimeout(()=>{ bt.textContent = "📋 Copiar texto"; }, 1500);
    };
  }catch(e){}
}
// ao sair do campo de resultado (flushResultSave só faz algo se houve alteração) → oferece partilhar
(function(){
  const orig = flushResultSave;
  flushResultSave = function(eventId){
    const mudou = !!resultSaveTimers[eventId];
    const r = orig.apply(this, arguments);
    if(mudou) setTimeout(()=>showResultSharePrompt_(eventId), 300);
    return r;
  };
})();
