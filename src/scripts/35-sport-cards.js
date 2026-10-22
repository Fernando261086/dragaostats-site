// ===================== CARTÕES POR MODALIDADE (Modo Modalidades, vista Calendário) =====================
// No topo do calendário: um cartão por modalidade com o próximo jogo dela, mais um "Todas".
// Tocar num cartão faz exatamente o mesmo que tocar no botão de filtro da modalidade (que, quando
// estes cartões estão visíveis, fica escondido por CSS — ver 06-tabs-and-medals.css). Se o próximo
// jogo for noutro mês, salta para esse mês, para não ficar uma lista vazia.
let sportCardsSig_ = "";
function renderSportCards_(){
  const host = document.getElementById("sportCards");
  if(!host) return;
  const matches = (typeof currentCompMode === "function") && currentCompMode() === "matches";
  const calBtn = document.getElementById("viewCalendarBtn");
  const cal = !!(calBtn && calBtn.classList.contains("active"));
  if(!matches || !cal || typeof EVENTS === "undefined" || !EVENTS.length){
    host.style.display = "none"; host.innerHTML = ""; sportCardsSig_ = "";
    document.body.classList.remove("has-sport-cards");
    return;
  }
  const now = new Date();
  const liveOf = ev => { const j = (typeof cevLiveFor_ === "function") ? cevLiveFor_(ev) : null; return !!(j && j.estado === "vivo"); };
  const by = {};
  EVENTS.forEach(ev=>{
    if(!ev.sport) return;
    const s = by[ev.sport] = by[ev.sport] || { sport: ev.sport, next: null, nextD: null };
    const d = new Date(ev.day + "T" + (ev.t || "00:00") + ":00");
    if(isNaN(d)) return;
    // conta como "o próximo" o que ainda não começou E o que está a decorrer neste momento
    const decorrer = d < now && (liveOf(ev) || (typeof isLiveNow_ === "function" && isLiveNow_(ev)));
    if(d < now && !decorrer) return;
    if(!s.nextD || d < s.nextD){ s.nextD = d; s.next = ev; }
  });
  const list = Object.values(by).sort((a, b)=>{
    if(a.nextD && b.nextD) return a.nextD - b.nextD;
    if(a.nextD) return -1;
    if(b.nextD) return 1;
    return a.sport.localeCompare(b.sport, "pt");
  });
  const isLive = ev => liveOf(ev) || (typeof isLiveNow_ === "function" && isLiveNow_(ev) && !(typeof getEv === "function" && getEv(ev.id) && getEv(ev.id).resultado));
  const sig = JSON.stringify([activeSport, activeDay, list.map(s=>[s.sport, s.next && s.next.id, s.next && isLive(s.next)])]);
  host.style.display = "";
  document.body.classList.add("has-sport-cards");
  if(sig === sportCardsSig_) return; // nada mudou — não mexe no DOM (mantém a posição do scroll)
  sportCardsSig_ = sig;

  const esc = s => (typeof liveEsc_ === "function") ? liveEsc_(s) : String(s == null ? "" : s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const pill = (sport, label, live) => `<button type="button" class="hv-pillbtn${activeSport === sport ? " active" : ""}" data-sport="${esc(sport)}" aria-pressed="${activeSport === sport}">${esc(label)}${live ? '<span class="pill-live" title="Ao vivo"></span>' : ""}</button>`;
  host.innerHTML = pill("Todos", "Todas", false) + list.map(s=>pill(s.sport, s.sport, !!(s.next && isLive(s.next)))).join("");
  host.querySelectorAll(".hv-pillbtn").forEach(btn=>{
    btn.onclick = ()=>{
      const sport = btn.getAttribute("data-sport");
      const item = by[sport];
      activeSport = sport;
      if(item && item.next){
        const month = (item.next.day || "").slice(0, 7);
        if(month && month !== activeDay){
          activeDay = month;
          gridSelectedDay = null;
          document.getElementById("dayNum").textContent = activeDay;
          if(typeof renderDayTabs === "function") renderDayTabs();
        }
      }
      renderFilters();
      renderProgress();
      renderTimeline();
    };
  });
}
// os cartões mostram "AO VIVO" quando chegam dados novos da CEV — reavalia sem refazer tudo
setInterval(()=>{ try{ renderSportCards_(); }catch(e){} }, 15000);
