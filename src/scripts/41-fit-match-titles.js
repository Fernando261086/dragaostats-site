// ===================== "FC Porto" -> "FCP" quando o título passa para duas linhas =====================
// Os títulos dos jogos (Calendário, Esta semana, Resultados, modalidades) trazem "FC Porto" dentro de
// <span class="fcp-name">. Se a linha ficar com mais de uma linha de altura, troca para "FCP".
(function(){
  let busy = false, queued = false, mo = null;
  function fit_(){
    queued = false; busy = true;
    if(mo) mo.disconnect();
    try{
      const rows = document.querySelectorAll(".hv-row-match");
      rows.forEach(r=>{ r.querySelectorAll(".fcp-name").forEach(n=>{ if(n.textContent !== "FC Porto") n.textContent = "FC Porto"; }); });
      rows.forEach(r=>{
        const names = r.querySelectorAll(".fcp-name");
        if(!names.length || !r.offsetWidth) return; // escondido: tentar noutra altura
        const lh = parseFloat(getComputedStyle(r).lineHeight) || (parseFloat(getComputedStyle(r).fontSize) * 1.25);
        if(r.getBoundingClientRect().height > lh * 1.5) names.forEach(n=>{ n.textContent = "FCP"; });
      });
    }catch(e){}
    if(mo) mo.observe(document.body, { childList:true, subtree:true });
    busy = false;
  }
  function schedule_(){ if(queued || busy) return; queued = true; requestAnimationFrame(fit_); }
  mo = new MutationObserver(schedule_);
  mo.observe(document.body, { childList:true, subtree:true });
  window.addEventListener("resize", schedule_);
  window.addEventListener("orientationchange", schedule_);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(schedule_);
  schedule_();
  window.fitMatchTitles_ = fit_;
})();
