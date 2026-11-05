// v260: ícones de linha (em vez de emojis). uiIco_(nome, tamanho) devolve um <svg>; função (não const) para poder ser usada por ficheiros que carregam antes.
function uiIco_(n, s){
  const P = {
 "bell": "<path d=\"M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z\"/><path d=\"M10 20.5a2 2 0 0 0 4 0\"/>",
 "install": "<path d=\"M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14\"/>",
 "moon": "<path d=\"M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z\"/>",
 "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4\"/>",
 "theme": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 3.5v17a8.5 8.5 0 0 0 0-17z\" fill=\"currentColor\"/>",
 "news": "<rect x=\"4\" y=\"4.5\" width=\"16\" height=\"15\" rx=\"2\"/><path d=\"M8 9h8M8 12.5h8M8 16h5\"/>",
 "week": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15\" rx=\"2\"/><path d=\"M8 3v4M16 3v4M3.5 10h17M8 14h2M14 14h2\"/>",
 "search": "<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m20 20-4.2-4.2\"/>",
 "trophy": "<path d=\"M8 4h8v5a4 4 0 0 1-8 0z\"/><path d=\"M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6\"/>",
 "grid": "<rect x=\"4\" y=\"4\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"13\" y=\"4\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"4\" y=\"13\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"13\" y=\"13\" width=\"7\" height=\"7\" rx=\"1.5\"/>",
 "book": "<path d=\"M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z\"/><path d=\"M5 20.5A2.5 2.5 0 0 0 7.5 23H19v-5\"/>",
 "target": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>",
 "brain": "<path d=\"M9.5 4A3.5 3.5 0 0 0 6 7.5 3.5 3.5 0 0 0 4.5 11a3.5 3.5 0 0 0 1.5 3 3.5 3.5 0 0 0 3.5 5.5A2.5 2.5 0 0 0 12 17V6.5A2.5 2.5 0 0 0 9.5 4zM14.5 4A3.5 3.5 0 0 1 18 7.5 3.5 3.5 0 0 1 19.5 11a3.5 3.5 0 0 1-1.5 3 3.5 3.5 0 0 1-3.5 5.5A2.5 2.5 0 0 1 12 17\"/>",
 "cup": "<path d=\"M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z\"/><path d=\"M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2.5M12 3v2.5\"/>",
 "megaphone": "<path d=\"M4 10v4h3l7 4V6L7 10z\"/><path d=\"M17.5 9.5a4 4 0 0 1 0 5\"/>",
 "bug": "<rect x=\"8\" y=\"8\" width=\"8\" height=\"11\" rx=\"4\"/><path d=\"M12 8V5M9 5.5 10.5 8M15 5.5 13.5 8M4 12h4M16 12h4M4.5 18 8 16M19.5 18 16 16\"/>",
 "info": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 11v5.5M12 7.8v.4\"/>",
 "lock": "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"9.5\" rx=\"2\"/><path d=\"M8 10.5V8a4 4 0 0 1 8 0v2.5\"/>",
 "doc": "<path d=\"M7 3.5h7l4 4V20.5H7z\"/><path d=\"M14 3.5v4h4M9.5 12h5M9.5 15.5h5\"/>",
 "mail": "<rect x=\"3.5\" y=\"5.5\" width=\"17\" height=\"13\" rx=\"2\"/><path d=\"m4 7 8 6 8-6\"/>",
 "bulb": "<path d=\"M9 18h6M10 21h4M12 3.5a5.5 5.5 0 0 0-3 10.1c.6.5 1 1.2 1 2V16h4v-.4c0-.8.4-1.5 1-2A5.5 5.5 0 0 0 12 3.5z\"/>",
 "radio": "<circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14\"/>",
 "home": "<path d=\"M4 11 12 4l8 7\"/><path d=\"M6 10v10h12V10\"/>",
 "away": "<path d=\"M3 15V9h10l4 3.5V15M6 15v2M16 15v2\"/><circle cx=\"7\" cy=\"17.5\" r=\"1.4\"/><circle cx=\"16\" cy=\"17.5\" r=\"1.4\"/>",
 "cal": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15\" rx=\"2\"/><path d=\"M8 3v4M16 3v4M3.5 10h17\"/>",
 "stats": "<path d=\"M5 20V10M12 20V4M19 20v-7\"/>"
};
  s = s || 18;
  return P[n] ? `<svg class="ui-ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>` : "";
}

// v260: botão «Pesquisar» na barra de separadores (computador) e botões «ir para…» dos estados vazios
document.addEventListener("click", e=>{
  const ts = e.target.closest && e.target.closest("#tabsSearchBtn");
  if(ts){ if(typeof openSearchSheet_ === "function") openSearchSheet_(); return; }
  const g = e.target.closest && e.target.closest("[data-goview]");
  if(g){ const el = document.getElementById(g.getAttribute("data-goview")); if(el) el.click(); }
});

// v260: na fila deslizante dos meses, o mês ativo fica sempre visível (sem mexer na página)
(function(){
  const host = document.getElementById("dayTabs");
  if(!host) return;
  function centrar_(){
    const a = host.querySelector(".active");
    if(a && host.scrollWidth > host.clientWidth) { const x = a.getBoundingClientRect().left - host.getBoundingClientRect().left + host.scrollLeft; host.scrollLeft = Math.max(0, x - (host.clientWidth - a.offsetWidth) / 2); }
  }
  let busy = false;
  if(typeof MutationObserver !== "undefined") new MutationObserver(()=>{ if(busy) return; busy = true; requestAnimationFrame(()=>{ busy = false; centrar_(); }); }).observe(host, { childList:true, subtree:true, attributes:true, attributeFilter:["class"] });
  if(typeof IntersectionObserver !== "undefined") new IntersectionObserver(es=>{ if(es.some(x=>x.isIntersecting)) setTimeout(centrar_, 30); }).observe(host);
  setTimeout(centrar_, 400); setTimeout(centrar_, 1500);
  document.addEventListener("click", e=>{ if(e.target.closest && e.target.closest("#viewCalendarBtn, .bn-item")) setTimeout(centrar_, 120); });
})();

// v261: acessibilidade — cartões clicáveis que não são botões passam a ser focáveis e abrem com Enter/Espaço
(function(){
  const SEL = ".match-row, .hv-hero[data-hero], .pg-click";
  function marcar_(){
    document.querySelectorAll(SEL).forEach(el=>{
      if(el.dataset.a11y) return;
      el.dataset.a11y = "1";
      if(!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      if(!el.hasAttribute("role")) el.setAttribute("role", "button");
    });
  }
  let busy = false;
  const agendar_ = ()=>{ if(busy) return; busy = true; setTimeout(()=>{ busy = false; marcar_(); }, 200); };
  if(typeof MutationObserver !== "undefined") new MutationObserver(agendar_).observe(document.body, { childList:true, subtree:true });
  marcar_();
  document.addEventListener("keydown", e=>{
    if(e.key !== "Enter" && e.key !== " ") return;
    const el = e.target;
    if(el && el.dataset && el.dataset.a11y === "1" && el.matches(SEL)){ e.preventDefault(); el.click(); }
  });
})();
