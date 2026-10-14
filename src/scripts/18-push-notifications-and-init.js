function applySavedTheme(){
  let saved = null;
  try{ saved = localStorage.getItem("dia22-theme"); }catch(e){}
  const isLight = saved === "light";
  document.documentElement.classList.toggle("theme-light", isLight);
  document.getElementById("themeToggleBtn").textContent = isLight ? "☀️" : "🌙";
}
document.getElementById("themeToggleBtn").onclick = ()=>{
  const isLight = document.documentElement.classList.toggle("theme-light");
  try{ localStorage.setItem("dia22-theme", isLight ? "light" : "dark"); }catch(e){}
  document.getElementById("themeToggleBtn").textContent = isLight ? "☀️" : "🌙";
};
applySavedTheme();

// Modo "só ver" — ativa-se com ?view=readonly no link, esconde tudo o que edita
// Por defeito, o site inteiro é "só ver" — só se torna editável em /edicao (ou
// ?view=edit, como alternativa). Isto substitui a lógica antiga (que era ao
// contrário: por defeito editável, só ver com ?view=readonly) — mas os links
// antigos com ?view=readonly continuam a funcionar na mesma, sem partir nada.
const ON_EDIT_PATH = location.pathname.replace(/\/$/, "").toLowerCase().endsWith("/edicao")
  || new URLSearchParams(location.search).get("view") === "edit";
const READONLY_MODE = !ON_EDIT_PATH;
if(READONLY_MODE) document.body.classList.add("readonly-mode");

document.getElementById("viewOnlyLinkBtn").onclick = async ()=>{
  const url = new URL(location.href.split('?')[0]);
  url.searchParams.set("comp", activeCompId);
  url.searchParams.set("view", "readonly");
  const link = url.toString();
  if(navigator.share){
    try{ await navigator.share({ title: "Ver resultados (só ver)", url: link }); return; }catch(e){}
  }
  if(navigator.clipboard){
    try{
      await navigator.clipboard.writeText(link);
      alert("Link só-para-ver copiado! Já podes enviar:\n" + link);
      return;
    }catch(e){}
  }
  prompt("Copia este link:", link);
};

function showLoadErrorScreen_(){
  const el = document.getElementById("loadErrorScreen");
  if(el) el.style.display = "flex";
  const tl = document.getElementById("timeline");
  if(tl) tl.style.display = "none";
}
function hideLoadErrorScreen_(){
  const el = document.getElementById("loadErrorScreen");
  if(el) el.style.display = "none";
  const tl = document.getElementById("timeline");
  if(tl) tl.style.display = "";
}
function staleMinutesLabel_(at){
  const mins = Math.max(1, Math.round((Date.now() - at) / 60000));
  if(mins < 60) return mins + (mins === 1 ? " minuto" : " minutos");
  const hours = Math.round(mins / 60);
  return hours + (hours === 1 ? " hora" : " horas");
}
function showStaleDataBanner_(at){
  const container = document.getElementById("timeline");
  if(!container || document.getElementById("staleDataBanner")) return;
  const banner = document.createElement("div");
  banner.id = "staleDataBanner";
  banner.className = "stale-data-banner";
  banner.innerHTML = `<span>⚠️ Sem ligação ao servidor — a mostrar a última versão guardada (há ${staleMinutesLabel_(at)}).</span><button id="staleDataRetryBtn">Tentar atualizar</button>`;
  container.parentNode.insertBefore(banner, container);
  document.getElementById("staleDataRetryBtn").onclick = async ()=>{
    const btn = document.getElementById("staleDataRetryBtn");
    btn.disabled = true; btn.textContent = "A tentar…";
    const result = await fetchAll();
    if(result.ok && result.all){
      banner.remove();
      ALL = result.all;
      ALL.competitions = Array.isArray(ALL.competitions) ? ALL.competitions : [];
      ALL.data = (ALL.data && typeof ALL.data === "object") ? ALL.data : {};
      if(!ALL.data[activeCompId]) activeCompId = ALL.competitions.length ? ALL.competitions[0].id : null;
      if(activeCompId) await switchToCompetition(activeCompId);
    }else{
      btn.disabled = false; btn.textContent = "Tentar atualizar";
    }
  };
}

(async function init(){
  const result = await fetchAll();
  if(result.ok && result.all){
    ALL = result.all;
    ALL.competitions = Array.isArray(ALL.competitions) ? ALL.competitions : [];
    ALL.data = (ALL.data && typeof ALL.data === "object") ? ALL.data : {};
    if(ALL.competitions.length === 0){
      // primeira vez de sempre a usar a app — cria a competição inicial com a lista original
      ALL.competitions.push({ id:"taranto2026", name:"Jogos do Mediterrâneo 2026" });
      ALL.data["taranto2026"] = { events: DEFAULT_EVENTS, status: {} };
    }
    if(result.migrated || !ALL.data[ALL.competitions[0].id]){
      activeCompId = ALL.competitions[0].id;
      await persistAll(); // grava já no novo formato multi-competição
    }
  }else{
    // falha de rede/ligação (ou demorou mais de 10s): NUNCA finge dados que não são
    // reais (já foram os "Jogos do Mediterrâneo" antigos, e confundia toda a gente).
    // Usa a última cópia boa guardada neste aparelho, com um aviso — ou, sem
    // nenhuma cópia, mostra um ecrã de erro a sério, com botão para tentar de novo.
    let lastGood = null;
    try{ lastGood = JSON.parse(localStorage.getItem("dia22-last-good-data") || "null"); }catch(e){}
    if(lastGood && lastGood.all){
      ALL = lastGood.all;
      ALL.competitions = Array.isArray(ALL.competitions) ? ALL.competitions : [];
      ALL.data = (ALL.data && typeof ALL.data === "object") ? ALL.data : {};
      showStaleDataBanner_(lastGood.at);
      console.error("Não foi possível ligar ao servidor ao abrir — a mostrar a última cópia guardada, sem gravar.");
    }else{
      console.error("Não foi possível ligar ao servidor ao abrir, e não há nenhuma cópia guardada.");
      showLoadErrorScreen_();
      return; // não continua a arrancar a app sem dados nenhuns
    }
  }
  if(READONLY_MODE){
    // link de "só ver": pede só o nome, uma vez — não é controlo de acesso, é para
    // saberes quem esteve a ver
    await ensureViewerRegistered();
  }else if(Object.keys(ADMIN_AUTH).length > 0){
    // link normal (edição): exige a password de administração, sempre que houver
    // pelo menos uma configurada — é o que impede alguém de tirar o "?view=readonly"
    // do link e ficar com acesso total sem pedir nada
    await ensureAdminAuthenticated();
  }
  // 1ª vez: só as boas-vindas (curtas). Quem já cá veio: só as novidades, se houver
  // versão nova. Nunca os dois de seguida.
  if(!maybeShowIntro()) maybeShowChangelog();
  runAskManager(); // pedidos (newsletter/instalar): só a partir da 2ª visita, um por dia
  startNotifyNudgeTimer_(); // popup de notificações: ao fim de ~1 minuto (ou na 1ª reação/prognóstico)
  // Se o link tiver ?comp=...&day=..., abre logo aí em vez do último usado
  const params = new URLSearchParams(location.search);
  const linkedComp = params.get("comp");
  const linkedDay = params.get("day");
  // ?filtro=proximos ou ?filtro=resultados — vem dos atalhos da app instalada
  // (toque longo no ícone); tem de ser lido já aqui, antes de updateModeVisibleTabs(),
  // que é quem marca visualmente qual separador fica ativo
  const linkedFilter = params.get("filtro");
  if(linkedFilter === "proximos" || linkedFilter === "resultados" || linkedFilter === "todos"){
    matchesViewFilter = linkedFilter;
  }

  activeCompId = (linkedComp && ALL.competitions.find(c=>c.id===linkedComp && (!READONLY_MODE || (c.mode||"medals")==="matches")))
    ? linkedComp
    : (pinnedCompId && ALL.competitions.find(c=>c.id===pinnedCompId && (!READONLY_MODE || (c.mode||"medals")==="matches")))
      ? pinnedCompId
      : firstActiveOrAny();
  loadActiveCompetition();
  sortEvents();
  applyCompTheme(activeCompId);
  updateModeVisibleTabs();
  // por defeito mostra o dia mais recente disponível
  const days = getDaysPresent();
  activeDay = (linkedDay && days.includes(linkedDay)) ? linkedDay : defaultDayFor(days);
  document.getElementById("dayNum").textContent = activeDay;
  document.getElementById("fDia").placeholder = "Dia (ex: " + activeDay + ")";

  markSynced();
  renderCompetitionSelector();
  renderDayTabs();
  // ?sport=andebol (vem das páginas de modalidade, para SEO) — abre já filtrado
  // nessa modalidade, se ela existir nesta competição; senão fica em "Todos"
  const linkedSport = params.get("sport");
  if(linkedSport){
    const SPORT_SLUGS = { andebol:"Andebol", basquetebol:"Basquetebol", "hoquei-em-patins":"Hóquei Patins",
      voleibol:"Voleibol", "futebol-feminino":"Futebol Feminino", futsal:"Futsal", "equipa-b":"Equipa B" };
    const wanted = SPORT_SLUGS[linkedSport.toLowerCase()];
    if(wanted && getSportsPresent().includes(wanted)) activeSport = wanted;
  }
  renderFilters();
  renderProgress();
  renderTimeline();
  // confetti breve se o último resultado jogado foi uma vitória (só agora EVENTS já existe);
  // nunca os dois ao mesmo tempo — se já celebrou a vitória, o marco de visitas espera por outro dia
  if(!maybeCelebrateWin_()) maybeCelebrateMilestone_();
  // ?jogo=... — vem das notificações automáticas de "novo resultado", que já
  // sabem exatamente de que jogo se trata; salta logo para o cartão certo,
  // com o mesmo destaque a piscar que o banner do "Próximo jogo" usa
  const linkedEvId = params.get("jogo");
  if(linkedEvId) goToEventCard(linkedEvId);
  // atualiza periodicamente para ver provas, marcações e competições feitas por outra pessoa,
  // sem nunca apagar uma marcação local mais recente
  async function syncPoll_(){
    const typing = document.activeElement && (
      document.activeElement.classList.contains('result-input') ||
      document.activeElement.classList.contains('gate-input') ||
      document.activeElement.closest('#addPanel') ||
      document.activeElement.id === 'pollSelectInput'
    );
    // enquanto o painel de estatísticas dos jogadores estiver aberto, a sincronização
    // espera — senão os dados que estão a ser preenchidos podiam perder-se por baixo
    if(typing || playerStatsEditingEv || questionEditingEv) return;
    const result2 = await fetchAll();
    if(result2.ok && result2.all && !playerStatsEditingEv){
      // a lista de competições vem sempre da Sheet (é onde vivem, não há "local" a preservar)
      ALL.competitions = result2.all.competitions;
      const remoteComp = result2.all.data[activeCompId] || { events:[], status:{} };
      // só substitui as provas se a Sheet tiver mesmo dados — uma falha de rede nunca apaga nada
      // Confia diretamente no servidor, sem "juntar" com o que está guardado localmente —
      // é o que garante que uma prova eliminada desaparece mesmo, sem esperar por um recarregamento.
      if(Array.isArray(remoteComp.events)){ EVENTS = remoteComp.events; sortEvents(); }
      state = mergeState(remoteComp.status || {});
      ALL.data[activeCompId] = { events: EVENTS, status: state };
      checkNewResultsForNotifications();
    }
    markSynced();
    renderCompetitionSelector();
    renderDayTabs();
    renderFilters();
    renderProgress();
    renderTimeline();
    if(document.getElementById("medalsView").style.display !== "none"){
      renderMedals();
    }
    const sportLinksPanel = document.getElementById("sportLinksPanel");
    if(sportLinksPanel && sportLinksPanel.style.display !== "none"){
      renderSportLinksPanel(); // reflete logo alterações feitas no outro dispositivo
    }
    if(document.getElementById("todayAllView").style.display !== "none"){
      if(profileAthlete){
        renderCrossCompetitionList(
          document.getElementById("athleteProfileList") || document.getElementById("todayAllView"),
          (ev)=> ev.athlete === profileAthlete,
          "Sem provas encontradas para esta pessoa/equipa."
        );
      }else if(globalSearch){
        renderGlobalSearchView();
      }else{
        renderTodayAllView();
      }
    }
  }
  // Enquanto a aba está em segundo plano (minimizada, noutro separador, ecrã
  // bloqueado) não há ninguém a ver as atualizações — por isso a sincronização
  // periódica pára nessa altura, para poupar bateria/dados e não sobrecarregar
  // o servidor com pedidos inúteis. Assim que a pessoa volta a olhar para a
  // aba, faz-se logo uma sincronização imediata (para apanhar o que mudou
  // entretanto) e o ritmo normal de 6 em 6 segundos retoma.
  let syncIntervalId = setInterval(syncPoll_, 6000);
  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState === "hidden"){
      if(syncIntervalId !== null){ clearInterval(syncIntervalId); syncIntervalId = null; }
    }else if(syncIntervalId === null){
      syncPoll_();
      syncIntervalId = setInterval(syncPoll_, 6000);
    }
  });
})();

document.getElementById("loadErrorRetryBtn").onclick = async ()=>{
  const btn = document.getElementById("loadErrorRetryBtn");
  btn.disabled = true; btn.textContent = "A tentar…";
  const result = await fetchAll();
  if(result.ok && result.all){
    ALL = result.all;
    ALL.competitions = Array.isArray(ALL.competitions) ? ALL.competitions : [];
    ALL.data = (ALL.data && typeof ALL.data === "object") ? ALL.data : {};
    // switchToCompetition faz tudo o que é preciso depois de trocar o ALL: recarrega
    // os jogos (loadActiveCompetition), acerta o mês ativo (activeDay), os filtros,
    // etc. — chamar só o loadActiveCompetition não chegava, e a lista ficava vazia
    if(!ALL.data[activeCompId]) activeCompId = ALL.competitions.length ? ALL.competitions[0].id : null;
    if(activeCompId) await switchToCompetition(activeCompId);
    hideLoadErrorScreen_();
  }else{
    btn.disabled = false; btn.textContent = "Tentar outra vez";
  }
};

// Banner discreto para convidar a instalar quem ainda não instalou a app —
// não interfere com o "amortecedor" do registo de acessos, é só uma sugestão visual.
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  runAskManager(); // agora já se sabe que dá para instalar — pode ser o pedido de hoje
});
window.addEventListener("appinstalled", ()=>{
  document.getElementById("installBanner").style.display = "none";
});

function isStandaloneMode(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isIOSDevice(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function maybeShowInstallBanner(){
  if(isStandaloneMode()) return; // já está instalada, nunca incomoda
  let dismissed = false;
  try{ dismissed = localStorage.getItem("dia22-install-banner-dismissed") === "1"; }catch(e){}
  if(dismissed) return;
  // No iPhone/iPad não existe o evento beforeinstallprompt (limitação do iOS) — nesse
  // caso mostra sempre instruções manuais; nos outros só mostra se houver mesmo hipótese de instalar
  if(!deferredInstallPrompt && !isIOSDevice()) return;
  const banner = document.getElementById("installBanner");
  const btn = document.getElementById("installBannerBtn");
  btn.textContent = deferredInstallPrompt ? "Instalar" : "Como instalar";
  banner.style.display = "flex";
}
document.getElementById("installBannerBtn").onclick = async ()=>{
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    try{ await deferredInstallPrompt.userChoice; }catch(e){}
    deferredInstallPrompt = null;
    document.getElementById("installBanner").style.display = "none";
  }else if(isIOSDevice()){
    alert("Para instalar no iPhone/iPad: toca no ícone de Partilhar 🔗 na barra do Safari e depois em \"Adicionar ao ecrã principal\".");
  }
};
document.getElementById("installBannerDismiss").onclick = ()=>{
  document.getElementById("installBanner").style.display = "none";
  try{ localStorage.setItem("dia22-install-banner-dismissed", "1"); }catch(e){}
};
// (o banner de instalar já não aparece sozinho à entrada — ver "PEDIDOS" mais abaixo)

// Botão FIXO "📲 Instalar app" — ao contrário do banner (que desaparece para sempre com
// "Agora não"), este fica sempre à mão para quem ainda não instalou. Só some quando a
// app já está aberta como app instalada, ou mal seja instalada.
(function setupInstallButton(){
  const btn = document.getElementById("installAppBtn");
  if(isStandaloneMode()){ btn.style.display = "none"; return; }
  // o mesmo destaque discreto do botão de notificações, enquanto a app não
  // estiver instalada — pediste que tivessem a mesma importância
  btn.classList.add("needs-attention");
  window.addEventListener("appinstalled", ()=>{ btn.style.display = "none"; });
  btn.onclick = async ()=>{
    logVisit(CURRENT_VIEWER_NAME || "Anónimo", "install_click");
    if(deferredInstallPrompt){
      // Android/Chrome/Edge: abre o pedido de instalação a sério
      deferredInstallPrompt.prompt();
      let outcome = "";
      try{ const r = await deferredInstallPrompt.userChoice; outcome = r && r.outcome; }catch(e){}
      deferredInstallPrompt = null;
      document.getElementById("installBanner").style.display = "none";
      if(outcome === "accepted"){ btn.style.display = "none"; btn.classList.remove("needs-attention"); }
    }else if(isIOSDevice()){
      alert("Para instalar no iPhone/iPad: toca no ícone de Partilhar 🔗 na barra do Safari e depois em \"Adicionar ao ecrã principal\".");
    }else{
      alert("Para instalar: abre o menu do browser (⋮ ou ⋯) e escolhe \"Instalar app\" ou \"Adicionar ao ecrã principal\". No computador, com Chrome ou Edge, procura o ícone de instalar na barra de endereço.");
    }
  };
})();

