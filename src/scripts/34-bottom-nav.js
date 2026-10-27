// ===================== BARRA INFERIOR (só no telemóvel) =====================
// No telemóvel, os separadores de vista (Calendário, Esta semana, Histórico, Marcadores…)
// passam para uma barra fixa em baixo, mais fácil de alcançar com o polegar. Não é uma
// navegação nova: cada botão da barra só "carrega" no separador original (que continua
// a existir e a mandar em tudo, escondido por CSS em ecrãs estreitos), e copia o seu estado
// (ativo / escondido / nome) sempre que muda. Assim, nenhuma lógica das vistas é tocada.
(function(){
  const svg = d => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ITEMS = [
    ["viewHomeBtn",        svg('<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/>')],
    ["viewCalendarBtn",    svg('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>')],
    ["viewTodayAllBtn",    svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')],
    ["viewMedalsBtn",      svg('<circle cx="12" cy="9" r="5"/><path d="m9 13.5-1.5 6.5 4.5-2.5 4.5 2.5L15 13.5"/>')],
    ["viewStatsBtn",       svg('<path d="M5 20V10M12 20V4M19 20v-7"/>')],
    ["viewHistoryBtn",     svg('<path d="M4 12a8 8 0 1 0 2.5-5.8L4 8.5"/><path d="M4 4v4.5h4.5M12 8v4l3 2"/>')],
    ["viewStandingsBtn",   svg('<path d="M4 20V9M10 20V4M16 20v-8M22 20H2"/>')],
    ["viewLeaderboardBtn", svg('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/>')]
  ];
  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.id = "bottomNav";
  nav.setAttribute("aria-label", "Navegação principal");
  const items = [];
  ITEMS.forEach(([id, icon])=>{
    const src = document.getElementById(id);
    if(!src) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bn-item";
    btn.innerHTML = icon + '<span class="bn-label"></span>';
    btn.onclick = ()=> src.click();
    nav.appendChild(btn);
    items.push({ src, btn, label: btn.querySelector(".bn-label") });
  });
  function modeMatches_(){ try{ return currentCompMode() === "matches"; }catch(e){ return false; } }
  function cleanLabel_(txt){
    // tira o emoji do início e encurta "Esta semana" para caber na barra
    const t = String(txt || "").replace(/[^\p{L}\p{N} ]/gu, "").trim();
    return t === "Esta semana" ? "Semana" : (t === "Estatísticas" ? "Estatíst." : t);
  }
  function sync_(){
    items.forEach(({src, btn, label})=>{
      const active = src.classList.contains("active");
      btn.classList.toggle("active", active);
      if(active) btn.setAttribute("aria-current", "page"); else btn.removeAttribute("aria-current");
      btn.style.display = (src.style.display === "none" || (src.id === "viewTodayAllBtn" && modeMatches_()) || (src.id === "viewLeaderboardBtn" && modeMatches_())) ? "none" : "";
      let txt = cleanLabel_(src.textContent);
      if(src.id === "viewHistoryBtn") txt = "Resultados"; // como na proposta
      if(label.textContent !== txt) label.textContent = txt;
    });
  }
  // 5.º botão: "Mais" (abre a folha com as restantes opções — ver 39-more-sheet.js)
  const moreBtn = document.createElement("button");
  moreBtn.type = "button"; moreBtn.className = "bn-item";
  moreBtn.innerHTML = svg('<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>') + '<span class="bn-label">Mais</span>';
  moreBtn.onclick = ()=>{ if(window.openMoreSheet_) window.openMoreSheet_(); };
  nav.appendChild(moreBtn);
  const mo = new MutationObserver(sync_);
  items.forEach(({src})=> mo.observe(src, { attributes:true, attributeFilter:["class","style"], childList:true, characterData:true, subtree:true }));
  document.body.appendChild(nav);
  sync_();
})();
