// ===================== PAINEL «📣 PARTILHAR» NA BARRA DE GESTÃO (v237) =====================
// Um único sítio (só modo edição) para ir buscar a imagem, o reel e o texto de um dia: ontem, hoje, amanhã ou uma data.
// Reutiliza tudo o que já existia em 31-day-share.js e 56-day-reel.js (que agora respeitam DAY_SHARE_DATE_);
// as caixas #dayShareBox/#dayReelBox são mudadas para dentro do painel enquanto ele está aberto.
(function(){
  if(READONLY_MODE) return;
  const tog = document.getElementById("adminToolsToggle");
  if(!tog) return;
  const btn = document.createElement("button");
  btn.type = "button"; btn.id = "shareHubBtn"; btn.className = "admin-tools-toggle share-hub-btn";
  btn.innerHTML = "📣 Partilhar";
  tog.insertAdjacentElement("afterend", btn);
  btn.onclick = openShareHub_;
})();

function closeShareHub_(){
  const el = document.getElementById("shareHub");
  const row = document.getElementById("dayShareToggleRow");
  const sb = document.getElementById("dayShareBox"), rb = document.getElementById("dayReelBox");
  if(row && sb && rb){ row.insertAdjacentElement("afterend", sb); sb.insertAdjacentElement("afterend", rb); }
  [sb, rb].forEach(b=>{ if(b){ b.style.display = "none"; b.innerHTML = ""; } });
  if(el) el.remove();
  document.body.classList.remove("share-hub-open");
  window.__shareHubOpen_ = false;
  DAY_SHARE_DATE_ = "";
  try{ renderDayShareToggle_(); }catch(e){}
}

function openShareHub_(){
  if(document.getElementById("shareHub")) return closeShareHub_();
  const sb = document.getElementById("dayShareBox"), rb = document.getElementById("dayReelBox");
  window.__shareHubOpen_ = true;
  DAY_SHARE_DATE_ = "";
  const el = document.createElement("div");
  el.id = "shareHub"; el.className = "sh-overlay";
  el.innerHTML = `<div class="sh-sheet" role="dialog" aria-label="Partilhar">
    <div class="sh-top"><b>📣 Partilhar</b><button type="button" class="sh-x" aria-label="Fechar">✕</button></div>
    <div class="sh-days" id="shDays"></div>
    <div class="sh-date" id="shDate"></div>
    <div class="sh-btns" id="shBtns"></div>
    <div class="sh-body" id="shBody"></div>
  </div>`;
  document.body.appendChild(el);
  document.body.classList.add("share-hub-open");
  const body = el.querySelector("#shBody");
  if(sb) body.appendChild(sb);
  if(rb) body.appendChild(rb);
  el.querySelector(".sh-x").onclick = closeShareHub_;
  el.addEventListener("click", e=>{ if(e.target === el) closeShareHub_(); });
  const days = el.querySelector("#shDays"), btns = el.querySelector("#shBtns"), dateLab = el.querySelector("#shDate");
  const hoje = todayISO_();
  const quick = [["Ontem", dayShareAddDays_(hoje, -1)], ["Hoje", hoje], ["Amanhã", dayShareAddDays_(hoje, 1)]];

  function resetBoxes_(){ [sb, rb].forEach(b=>{ if(b){ b.style.display = "none"; b.innerHTML = ""; } }); }
  function setDay_(iso){
    DAY_SHARE_DATE_ = (iso === hoje) ? "" : iso;
    resetBoxes_();
    paint_();
  }
  function paint_(){
    const iso = dayShareISO_();
    days.innerHTML = quick.map(q=>`<button type="button" class="sh-chip${q[1] === iso ? " on" : ""}" data-d="${q[1]}">${q[0]}</button>`).join("") +
      `<input type="date" id="shDateIn" class="sh-in" value="${iso}">`;
    days.querySelectorAll("[data-d]").forEach(b=>{ b.onclick = ()=>setDay_(b.getAttribute("data-d")); });
    days.querySelector("#shDateIn").onchange = e=>{ if(e.target.value) setDay_(e.target.value); };
    dateLab.textContent = dayShareDateLabel_();
    const nJ = getDayShareGames_().length, nL = getDayLiveGames_().length, nR = getDayResultGames_().length;
    const defs = [
      ["img-jogos", "🖼️ Imagem dos jogos", nJ], ["img-live", "🔴 Imagem ao vivo", nL], ["img-res", "🏆 Imagem dos resultados", nR],
      ["reel-jogos", "🎬 Reel dos jogos", nJ], ["reel-live", "🔴 Reel com Ao vivo", nL]
    ];
    btns.innerHTML = defs.map(d=>`<button type="button" class="sh-b" data-k="${d[0]}"${d[2] ? "" : " disabled"}>${d[1]}<small>${d[2] ? d[2] + (d[2] === 1 ? " jogo" : " jogos") : "sem jogos"}</small></button>`).join("");
    btns.querySelectorAll("[data-k]").forEach(b=>{
      b.onclick = ()=>{
        const k = b.getAttribute("data-k");
        if(k.indexOf("img") === 0){
          dayShareMode_ = k === "img-live" ? "jogos-live" : k === "img-res" ? "resultados" : "jogos";
          if(rb) rb.style.display = "none";
          if(sb){ sb.style.display = "block"; renderDayShareBox_(); }
        }else{
          if(sb) sb.style.display = "none";
          startDayReel_(k === "reel-live");
        }
        const bd = document.getElementById("shBody"); if(bd) bd.scrollIntoView({ behavior: "smooth", block: "nearest" });
      };
    });
  }
  paint_();
}
