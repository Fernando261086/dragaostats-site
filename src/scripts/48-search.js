// ===================== PESQUISA DE JOGOS (v166) =====================
// Ecrã de pesquisa aberto a partir do Início: procura em TODOS os jogos por adversário, modalidade,
// competição, local, data ("outubro", "26 out") e resultado. Cada resultado abre a página do jogo.
function searchNorm_(s){ return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function searchHay_(ev){
  const st = (typeof getEv === "function" && getEv(ev.id)) || {};
  let data = "";
  try{
    const d = new Date(ev.day + "T00:00:00");
    if(!isNaN(d)) data = d.getDate() + " " + d.toLocaleDateString("pt-PT", { month: "long" }) + " " + d.toLocaleDateString("pt-PT", { month: "short" }) + " " + d.getFullYear() + " " + ev.day;
  }catch(e){}
  return searchNorm_([ev.athlete, ev.sport, ev.detail, ev.phase, ev.venue, data, st.resultado].filter(Boolean).join(" "));
}
function searchEvents_(q){
  const toks = searchNorm_(q).split(/\s+/).filter(Boolean);
  if(!toks.length || typeof EVENTS === "undefined") return [];
  const out = EVENTS.filter(ev=>ev.sport && ev.day).filter(ev=>{ const h = searchHay_(ev); return toks.every(t=>h.indexOf(t) >= 0); });
  const agora = Date.now();
  const when = ev => new Date(ev.day + "T" + (ev.t || "00:00") + ":00").getTime() || 0;
  const futuros = out.filter(ev=>when(ev) >= agora - 3 * 3600000).sort((a, b)=>when(a) - when(b));
  const passados = out.filter(ev=>when(ev) < agora - 3 * 3600000).sort((a, b)=>when(b) - when(a));
  return futuros.concat(passados);
}
function searchRowHtml_(ev){
  const esc = homeEsc_, st = (typeof getEv === "function" && getEv(ev.id)) || {};
  const t = postTeams_(ev);
  const res = st.resultado && String(st.resultado).trim();
  const tag = st.resultTag === "win" ? ["V", "win"] : st.resultTag === "loss" ? ["D", "loss"] : st.resultTag === "draw" ? ["E", "draw"] : null;
  const mid = res ? ` <b>${esc(res)}</b> ` : " vs ";
  return `<button type="button" class="hv-row hv-res" data-sgo="${esc(ev.id)}" style="--sc:${homeColor_(ev.sport)};">
    ${tag ? `<span class="hv-tag hv-tag-${tag[1]}">${tag[0]}</span>` : '<span class="hv-tag"></span>'}
    <span class="hv-row-body"><span class="hv-row-sport">${esc(ev.sport)} · ${esc(formatShortDate(ev.day))}${ev.t ? " · " + esc(ev.t) : ""}</span><span class="hv-row-match">${crestOnly_(ev, t.home)}${esc(t.home)}${mid}${crestOnly_(ev, t.away)}${esc(t.away)}</span></span>
  </button>`;
}
(function(){
  const box = document.createElement("div");
  box.id = "searchSheet"; box.className = "search-sheet"; box.style.display = "none";
  box.innerHTML = '<div class="ss-bar"><input type="search" id="ssInput" class="ss-input" placeholder="Adversário, modalidade, mês…" autocomplete="off" enterkeyhint="search"><button type="button" class="ss-close" id="ssClose">Fechar</button></div><div class="ss-body" id="ssBody"></div>';
  document.body.appendChild(box);
  const input = box.querySelector("#ssInput"), body = box.querySelector("#ssBody");
  function dica_(){ return '<div class="hv-empty">Escreve um adversário (ex.: "Benfica"), uma modalidade ("andebol") ou um mês ("novembro").</div>'; }
  function render_(){
    const q = input.value;
    if(!q.trim()){ body.innerHTML = dica_(); return; }
    const r = searchEvents_(q);
    if(!r.length){ body.innerHTML = '<div class="hv-empty">Sem jogos para "' + homeEsc_(q.trim()) + '".</div>'; return; }
    const MAX = 60;
    body.innerHTML = '<div class="ss-count">' + r.length + (r.length === 1 ? " jogo" : " jogos") + (r.length > MAX ? " (mostro os primeiros " + MAX + ")" : "") + '</div><div class="hv-panel ss-list">' + r.slice(0, MAX).map(searchRowHtml_).join("") + '</div>';
    body.querySelectorAll("[data-sgo]").forEach(b=>{ b.onclick = ()=>{ const id = b.getAttribute("data-sgo"); close_(); goToEventCard(id); }; });
  }
  function open_(){ box.style.display = "block"; document.body.classList.add("search-open"); render_(); setTimeout(()=>input.focus(), 30); }
  function close_(){ box.style.display = "none"; document.body.classList.remove("search-open"); }
  input.addEventListener("input", render_);
  box.querySelector("#ssClose").onclick = close_;
  document.addEventListener("keydown", e=>{ if(e.key === "Escape" && box.style.display !== "none") close_(); });
  window.openSearchSheet_ = open_;
})();
