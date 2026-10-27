// ===================== CABEÇALHO LIMPO + MENU "MAIS" =====================
// Sino das notificações no cabeçalho e um menu "Mais" (folha por baixo) que junta as opções que
// antes ocupavam o topo do ecrã. Cada linha limita-se a clicar no botão original, por isso
// o comportamento é exatamente o de sempre.
(function(){
  document.documentElement.classList.toggle("readonly-view", !!READONLY_MODE);

  // ---- sino
  const themeBtn = document.getElementById("themeToggleBtn");
  const bell = document.createElement("button");
  bell.type = "button"; bell.id = "headerBellBtn"; bell.className = "theme-toggle header-bell";
  bell.setAttribute("aria-label", "Notificações");
  bell.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>';
  if(themeBtn && themeBtn.parentNode) themeBtn.parentNode.insertBefore(bell, themeBtn);
  bell.onclick = async ()=>{
    if(typeof notificationsEnabled !== "undefined" && notificationsEnabled){
      if(typeof showAppNotification === "function") showAppNotification("Notificações ligadas", "Vais receber avisos dos jogos e resultados.");
    }else{
      document.getElementById("notifyToggleBtn").click();
    }
  };
  function syncBell_(){ bell.classList.toggle("on", typeof notificationsEnabled !== "undefined" && !!notificationsEnabled); }
  setInterval(syncBell_, 1500); syncBell_();

  // ---- folha "Mais"
  const rows = [
    ["🔔", "Notificações", "notifyToggleBtn"],
    ["📲", "Instalar app", "installAppBtn"],
    ["🌓", "Tema claro / escuro", "themeToggleBtn"],
    ["🌍", "Esta semana", "viewTodayAllBtn"],
    ["🌐", "Pesquisar em tudo", "globalSearchBtn"],
    ["🏆", "Marcadores", "viewLeaderboardBtn"],
    ["🗓️", "Calendário em grelha", "gridToggleBtn"],
    ["📖", "A tua época", "myYearBtn"],
    ["🎯", "Ranking de palpites", "predictionRankingBtn"],
    ["🧠", "Quiz do Dragão", "quizBtn"],
    ["☕", "Apoiar o projeto", "supportBtn"],
    ["📣", "Convida um amigo adepto", "inviteFriendBtn"],
    ["🐛", "Reportar um bug ou sugestão", "feedbackBtn"],
    ["ℹ️", "Sobre o Dragão Stats", "aboutBtn"],
    ["🔒", "Política de Privacidade", "privacyBtn"],
    ["📄", "Termos de Uso", "termsBtn"]
  ];
  const sheet = document.createElement("div");
  sheet.id = "moreSheet"; sheet.className = "more-sheet"; sheet.style.display = "none";
  sheet.innerHTML = '<div class="more-sheet-bg"></div><div class="more-sheet-panel" role="dialog" aria-label="Mais opções"><div class="more-sheet-grip"></div><div class="more-sheet-list"></div></div>';
  document.body.appendChild(sheet);
  const list = sheet.querySelector(".more-sheet-list");
  rows.forEach(([ico, label, id])=>{
    const b = document.createElement("button");
    b.type = "button"; b.className = "more-sheet-row"; b.setAttribute("data-src", id);
    b.innerHTML = '<span class="ms-ico">' + ico + '</span><span>' + label + '</span>';
    b.onclick = ()=>{ close_(); const src = document.getElementById(id); if(src) setTimeout(()=>src.click(), 60); };
    list.appendChild(b);
  });
  function open_(){
    // só mostra as linhas cujo botão original existe e não está escondido
    list.querySelectorAll(".more-sheet-row").forEach(b=>{
      const src = document.getElementById(b.getAttribute("data-src"));
      const hidden = !src || src.style.display === "none" || (src.offsetParent === null && src.id !== "themeToggleBtn" && src.id !== "installAppBtn" && src.id !== "notifyToggleBtn" && getComputedStyle(src).display === "none" && src.style.display === "none");
      b.style.display = (!src || src.style.display === "none") ? "none" : "";
    });
    sheet.style.display = "block";
    document.body.classList.add("more-open");
  }
  function close_(){ sheet.style.display = "none"; document.body.classList.remove("more-open"); }
  sheet.querySelector(".more-sheet-bg").onclick = close_;
  window.openMoreSheet_ = open_;
})();
