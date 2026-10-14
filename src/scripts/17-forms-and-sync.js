// ===================== NOTIFICAÇÕES PUSH A SÉRIO (Firebase Cloud Messaging) =====================
// Estes dados não são segredos — é a configuração pública do projeto Firebase,
// a mesma que qualquer visitante já vê no código-fonte de qualquer site que use isto.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDSKjE-hTNayvLdjbs616i3K6qYWQOFRYw",
  authDomain: "dragaostats-31945.firebaseapp.com",
  projectId: "dragaostats-31945",
  storageBucket: "dragaostats-31945.firebasestorage.app",
  messagingSenderId: "266556086254",
  appId: "1:266556086254:web:1d8bdfaba3f5b096c320ff"
};
const FCM_VAPID_KEY = "BEuGoc8ENzNnLPhYG0ynUmUo_rYLtHHATKQeSt8Qygw8vNdn3Nz7vWOW8RPNR2ydokUNwz_J6AuNOinM8hh4sGk";

let fcmMessaging = null;
try{
  if(typeof firebase !== "undefined"){
    firebase.initializeApp(FIREBASE_CONFIG);
    fcmMessaging = firebase.messaging();
    // notificação chegou com a app aberta em primeiro plano — o Firebase não a
    // mostra sozinho nesse caso, por isso mostramo-la à mesma, à mão
    fcmMessaging.onMessage((payload)=>{
      const n = payload.notification || {};
      showAppNotification(n.title || "Dragão Stats", n.body || "");
    });
  }
}catch(e){
  // browser sem suporte, ou bloqueado — os avisos locais continuam a funcionar à mesma
}

async function registerForPushNotifications(){
  if(!fcmMessaging) return; // browser sem suporte a isto — não é um erro, só não faz nada
  const registration = await navigator.serviceWorker.ready;
  const token = await fcmMessaging.getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: registration });
  if(!token) return;
  currentPushToken = token; // guardado para se anexar a um feedback, se algum for enviado depois
  const myName = getCurrentPersonName() || "?";
  await fetch(STORE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ registerPushToken: { token: token, name: myName } })
  });
}

async function enableNotifications(){
  if(!("Notification" in window)){
    alert("Este browser não suporta notificações.");
    return false;
  }
  const perm = await Notification.requestPermission();
  if(perm !== "granted"){
    alert("Sem permissão para mostrar notificações — não é possível ativar os avisos.");
    return false;
  }
  notificationsEnabled = true;
  const nudge = document.getElementById("notifyNudge");
  if(nudge) nudge.style.display = "none";
  checkUpcomingForNotifications();
  updateNotifyBtnLabel();
  // além dos avisos locais (só funcionam com a app aberta), tenta também registar
  // este aparelho para avisos a sério via push — se isto falhar por alguma razão,
  // os avisos locais continuam a funcionar na mesma, não trava nada
  try{ await registerForPushNotifications(); }catch(e){}
  return true;
}

document.getElementById("notifyToggleBtn").onclick = async ()=>{
  if(!notificationsEnabled){
    await enableNotifications();
  }else{
    notificationsEnabled = false;
    updateNotifyBtnLabel();
  }
};
setInterval(checkUpcomingForNotifications, 30000); // só um cronómetro, mesmo que ligues/desligues várias vezes

document.getElementById("moreOptionsBtn").onclick = ()=>{
  const panel = document.getElementById("moreOptionsPanel");
  const btn = document.getElementById("moreOptionsBtn");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "flex" : "none";
  btn.classList.toggle("open", opening);
  btn.setAttribute("aria-expanded", opening ? "true" : "false");
};

document.getElementById("summaryBtn").onclick = ()=>{
  const text = buildDaySummaryText();
  alert(text);
  try{
    if(window.speechSynthesis){
      speechSynthesis.cancel(); // corta qualquer leitura anterior ainda a decorrer
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "pt-PT";
      speechSynthesis.speak(utter);
    }
  }catch(e){ console.error("Falha na leitura por voz:", e); }
};

// --- Adicionar nova prova ---
// Ajusta os textos e campos visíveis do formulário consoante o modo da competição ativa
function applyFormModeUI(){
  const matches = currentCompMode()==="matches";
  if(matches) cleanupSportLinks(); // nunca mostrar modalidades do outro modo no menu
  const fDia = document.getElementById("fDia");
  fDia.type = matches ? "date" : "text";
  fDia.placeholder = matches ? "" : ("Dia (ex: " + activeDay + ")");
  document.getElementById("fAtleta").placeholder = matches ? "Adversário" : "Atleta / Equipa";
  document.getElementById("fDetalhe").placeholder = matches ? "Competição (ex: Liga Portugal)" : "Detalhe (ex: 100m)";
  document.getElementById("fFase").placeholder = matches ? "Jornada ou Fase (ex: Jornada 5)" : "Fase (ex: Final)";
  document.getElementById("fLocal").style.display = matches ? "block" : "none";
  document.getElementById("fNotes").style.display = matches ? "block" : "none";
  document.getElementById("fClassLink").style.display = matches ? "block" : "none";
  document.getElementById("addChecksRow").style.display = matches ? "none" : "flex";
  document.getElementById("addHintText").style.display = matches ? "none" : "block";

  const sportInput = document.getElementById("fSport");
  const sportSelect = document.getElementById("fSportSelect");
  sportInput.style.display = matches ? "none" : "block";
  sportSelect.style.display = matches ? "block" : "none";
  if(matches){
    const known = Object.keys(SPORT_LINKS);
    const current = sportInput.value;
    sportSelect.innerHTML = known.map(s=>`<option value="${s}">${s}</option>`).join("")
      + `<option value="__outra__">Outra modalidade...</option>`;
    if(current && known.includes(current)){
      sportSelect.value = current;
    }else if(current){
      sportSelect.value = "__outra__"; // já tinha algo escrito que não está na lista
    }else{
      // formulário novo: sincroniza o valor por defeito do select para o campo
      // escondido (sem isto, a modalidade aparecia visualmente preenchida mas
      // ficava vazia de verdade, e a validação recusava gravar)
      sportSelect.value = known[0] || "__outra__";
      sportInput.value = (sportSelect.value === "__outra__") ? "" : sportSelect.value;
      document.getElementById("fClassLink").value = SPORT_LINKS[sportInput.value] || "";
    }
  }
  refreshDetalheSelect();
}

// Reconstrói o menu de "Competição" consoante a modalidade atual do formulário —
// chamado sempre que a modalidade muda, para nunca mostrar opções de outro desporto
function refreshDetalheSelect(){
  const matches = currentCompMode()==="matches";
  const detalheInput = document.getElementById("fDetalhe");
  const detalheSelect = document.getElementById("fDetalheSelect");
  detalheInput.style.display = matches ? "none" : "block";
  detalheSelect.style.display = matches ? "block" : "none";
  if(!matches) return;

  const sport = document.getElementById("fSport").value;
  const options = sport ? ensureCompetitionOptionsFor(sport) : [];
  const current = detalheInput.value;
  detalheSelect.innerHTML = options.map(o=>`<option value="${o.replace(/"/g,'&quot;')}">${o}</option>`).join("")
    + `<option value="__outra__">Outra competição...</option>`;
  if(current && options.includes(current)){
    detalheSelect.value = current;
  }else if(current){
    detalheSelect.value = "__outra__"; // já tinha algo escrito que não está na lista
  }else{
    detalheSelect.value = options[0] || "__outra__";
    detalheInput.value = (detalheSelect.value === "__outra__") ? "" : detalheSelect.value;
  }
}

// Ao escolher uma competição nova, regista-a logo na lista desta modalidade —
// mesma lógica do "Outra modalidade..." para o desporto
document.getElementById("fDetalheSelect").addEventListener("change", async (e)=>{
  const val = e.target.value;
  const detalheInput = document.getElementById("fDetalhe");
  const sport = document.getElementById("fSport").value;
  if(val === "__outra__"){
    const custom = prompt("Nome da competição:", detalheInput.value && !(ensureCompetitionOptionsFor(sport).includes(detalheInput.value)) ? detalheInput.value : "");
    if(custom && custom.trim()){
      const nome = custom.trim();
      detalheInput.value = nome;
      if(!ensureCompetitionOptionsFor(sport).includes(nome)){
        COMPETITION_OPTIONS[sport].push(nome);
        await saveCompetitionOptions();
      }
      refreshDetalheSelect();
      document.getElementById("fDetalheSelect").value = nome;
    }
  }else{
    detalheInput.value = val;
  }
});

// Ao escolher uma modalidade conhecida, preenche sozinho o link da classificação geral
document.getElementById("fSportSelect").addEventListener("change", async (e)=>{
  const val = e.target.value;
  const sportInput = document.getElementById("fSport");
  if(val === "__outra__"){
    const custom = prompt("Nome da modalidade:", sportInput.value && !SPORT_LINKS[sportInput.value] ? sportInput.value : "");
    if(custom && custom.trim()){
      const nome = custom.trim();
      sportInput.value = nome;
      // regista já a modalidade nova na lista principal (com link vazio por agora),
      // para aparecer sozinha no menu e no painel de Ligações da próxima vez
      if(!(nome in SPORT_LINKS)){
        SPORT_LINKS[nome] = "";
        await saveSportLinks();
      }
      document.getElementById("fClassLink").value = SPORT_LINKS[nome] || "";
      applyFormModeUI(); // atualiza já o menu para incluir a modalidade nova
      document.getElementById("fSportSelect").value = nome;
    }
  }else{
    sportInput.value = val;
    document.getElementById("fClassLink").value = SPORT_LINKS[val] || "";
  }
  refreshDetalheSelect(); // a modalidade mudou, o menu de competições tem de refletir isso
});

document.getElementById("addToggleBtn").onclick = ()=>{
  const panel = document.getElementById("addPanel");
  const opening = panel.style.display === "none";
  if(!opening) closeEditForm();
  else{
    panel.style.display = "block";
    applyFormModeUI();
    refreshAthleteSuggestions();
  }
};

let editingId = null;
let lastSyncTime = null;

function markSynced(){
  lastSyncTime = Date.now();
  updateSyncLabel();
}
function updateSyncLabel(){
  const el = document.getElementById("syncLabel");
  if(!lastSyncTime){ el.textContent = "A sincronizar..."; return; }
  const secs = Math.round((Date.now() - lastSyncTime)/1000);
  if(secs < 10) el.textContent = "Atualizado agora mesmo";
  else if(secs < 60) el.textContent = `Atualizado há ${secs}s`;
  else el.textContent = `Atualizado há ${Math.round(secs/60)} min`;
}
setInterval(updateSyncLabel, 5000);
setInterval(()=>{
  const matchesMode = currentCompMode()==="matches";
  // sempre os dois, mesmo já escondidos — é como um jogo de hoje passa a
  // "começado" e a troca automática entre os dois banners acontece sozinha,
  // sem precisar de recarregar a página
  renderTodayOpponentBanner(matchesMode);
  renderNextMatchBanner(matchesMode);
}, 30000);

// Reúne todos os nomes de atleta/equipa já usados, em todas as competições,
// para sugerir enquanto se escreve (evita "Hugo Dores" e "Hugo Dôres" por engano)
let athleteSportMap = {}; // último desporto usado por cada atleta/equipa
function refreshAthleteSuggestions(){
  const mode = currentCompMode();
  const names = new Set();
  const lastSeq = {};
  athleteSportMap = {};
  // só sugere nomes de competições do MESMO modo — "Adversário" nunca deve
  // mostrar atletas do modo Medalhas, e vice-versa
  ALL.competitions.forEach(c=>{
    if(((c.mode)||"medals") !== mode) return;
    const comp = ALL.data[c.id] || {};
    (comp.events || []).forEach(ev=>{
      if(!ev.athlete) return;
      names.add(ev.athlete);
      if(lastSeq[ev.athlete] === undefined || (ev.seq||0) >= lastSeq[ev.athlete]){
        lastSeq[ev.athlete] = ev.seq||0;
        athleteSportMap[ev.athlete] = ev.sport;
      }
    });
  });
  const dl = document.getElementById("athleteSuggestions");
  if(dl){
    dl.innerHTML = Array.from(names).sort().map(n=>`<option value="${n.replace(/"/g,'&quot;')}"></option>`).join("");
  }
}

// Ao escrever/escolher um nome já conhecido, pré-preenche a modalidade dele —
// só se o campo da modalidade ainda estiver vazio, para nunca sobrepor uma escolha feita
document.getElementById("fAtleta").addEventListener("input", (e)=>{
  const name = e.target.value.trim();
  const sportField = document.getElementById("fSport");
  if(name && athleteSportMap[name] && !sportField.value.trim()){
    sportField.value = athleteSportMap[name];
  }
});

function openEditForm(ev){
  document.getElementById("fDia").value = ev.day || "";
  document.getElementById("fHora").value = ev.t || "";
  document.getElementById("fSport").value = ev.sport || "";
  document.getElementById("fAtleta").value = ev.athlete || "";
  document.getElementById("fDetalhe").value = ev.detail || "";
  document.getElementById("fFase").value = ev.phase || "";
  document.getElementById("fWatch").value = ev.watchUrl || "";
  document.getElementById("fLocal").value = ev.local || "casa";
  document.getElementById("fVenue").value = ev.venue || "";
  document.getElementById("fNotes").value = ev.notes || "";
  document.getElementById("fClassLink").value = ev.classLink || "";
  document.getElementById("fApprox").checked = !!ev.approx;
  document.getElementById("fCond").checked = !!ev.cond;
  editingId = ev.id;
  document.getElementById("addSaveBtn").textContent = "Guardar alterações";
  document.getElementById("addCancelBtn").style.display = "inline-block";
  const panel = document.getElementById("addPanel");
  panel.style.display = "block";
  applyFormModeUI();
  panel.scrollIntoView({behavior:"smooth", block:"start"});
  refreshAthleteSuggestions();
}

function openDuplicateForm(ev){
  document.getElementById("fDia").value = ev.day || "";
  document.getElementById("fHora").value = ev.t || "";
  document.getElementById("fSport").value = ev.sport || "";
  document.getElementById("fAtleta").value = ev.athlete || "";
  document.getElementById("fDetalhe").value = ev.detail || "";
  document.getElementById("fFase").value = ev.phase || "";
  document.getElementById("fWatch").value = ev.watchUrl || "";
  document.getElementById("fLocal").value = ev.local || "casa";
  document.getElementById("fVenue").value = ev.venue || "";
  document.getElementById("fNotes").value = ev.notes || "";
  document.getElementById("fClassLink").value = ev.classLink || "";
  document.getElementById("fApprox").checked = !!ev.approx;
  document.getElementById("fCond").checked = !!ev.cond;
  editingId = null; // duplicar cria uma prova nova, não edita a original
  document.getElementById("addSaveBtn").textContent = "Guardar prova";
  document.getElementById("addCancelBtn").style.display = "inline-block";
  const panel = document.getElementById("addPanel");
  panel.style.display = "block";
  applyFormModeUI();
  panel.scrollIntoView({behavior:"smooth", block:"start"});
  refreshAthleteSuggestions();
  document.getElementById("fHora").focus();
}

function closeEditForm(){
  editingId = null;
  document.getElementById("addSaveBtn").textContent = "Guardar prova";
  document.getElementById("addCancelBtn").style.display = "none";
  ["fDia","fHora","fSport","fAtleta","fDetalhe","fFase","fWatch","fVenue","fNotes","fClassLink"].forEach(id=>document.getElementById(id).value = "");
  document.getElementById("fApprox").checked = false;
  document.getElementById("fCond").checked = false;
  document.getElementById("addPanel").style.display = "none";
}

document.getElementById("addCancelBtn").onclick = closeEditForm;

document.getElementById("addSaveBtn").onclick = async ()=>{
  const dayRaw = document.getElementById("fDia").value.trim() ||
    (currentCompMode()==="matches" ? new Date().toISOString().slice(0,10) : activeDay);
  // normaliza "01" para "1" — evita a inconsistência que já deu vários problemas
  const day = /^\d+$/.test(dayRaw) ? String(parseInt(dayRaw,10)) : dayRaw;
  const t = document.getElementById("fHora").value.trim();
  const athlete = document.getElementById("fAtleta").value.trim();
  const sport = document.getElementById("fSport").value.trim();
  if(!t || !athlete || !sport){
    alert("Preenche pelo menos a hora, a modalidade e o atleta/equipa.");
    return;
  }
  const fields = {
    day, t, sport, athlete,
    detail: document.getElementById("fDetalhe").value.trim(),
    phase: document.getElementById("fFase").value.trim(),
    watchUrl: document.getElementById("fWatch").value.trim(),
    local: document.getElementById("fLocal").value,
    venue: document.getElementById("fVenue").value.trim(),
    notes: document.getElementById("fNotes").value.trim(),
    classLink: document.getElementById("fClassLink").value.trim(),
    approx: document.getElementById("fApprox").checked,
    cond: document.getElementById("fCond").checked
  };

  if(editingId){
    const idx = EVENTS.findIndex(e=>e.id===editingId);
    if(idx !== -1) EVENTS[idx] = {...EVENTS[idx], ...fields};
  }else{
    EVENTS.push({ id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2,6), seq: nextSeq(), ...fields });
  }
  sortEvents();
  await saveEvents();

  // no modo Modalidades os separadores são por mês, não pelo dia exato
  activeDay = (currentCompMode()==="matches") ? day.slice(0,7) : day;
  document.getElementById("dayNum").textContent = day;

  renderDayTabs();
  renderFilters();
  renderProgress();
  renderTimeline();
  closeEditForm();
};

document.getElementById("searchInput").addEventListener("input", (e)=>{
  searchQuery = e.target.value;
  if(globalSearch){
    renderGlobalSearchView();
  }else{
    renderTimeline();
  }
});

// Em telemóvel a busca começa fechada (só a lupa) — isto só tem efeito visual
// dentro dessa media query; em ecrãs largos o campo já está sempre "expanded".
(function(){
  const searchBox = document.getElementById("searchBox");
  const searchToggleBtn = document.getElementById("searchToggleBtn");
  const searchInput = document.getElementById("searchInput");
  if(!searchBox || !searchToggleBtn || !searchInput) return;
  searchToggleBtn.onclick = ()=>{
    searchBox.classList.add("expanded");
    searchToggleBtn.setAttribute("aria-expanded", "true");
    searchInput.focus();
  };
  searchInput.addEventListener("blur", ()=>{
    if(!searchInput.value.trim()){
      searchBox.classList.remove("expanded");
      searchToggleBtn.setAttribute("aria-expanded", "false");
    }
  });
})();

document.getElementById("hideCompletedBtn").onclick = ()=>{
  hideCompleted = !hideCompleted;
  document.getElementById("hideCompletedBtn").classList.toggle("active", hideCompleted);
  document.getElementById("hideCompletedBtn").textContent = hideCompleted ? "Mostrar todas" : "Esconder concluídas";
  renderTimeline();
};

document.querySelectorAll('[data-matches-filter]').forEach(btn=>{
  btn.onclick = ()=>{
    matchesViewFilter = btn.getAttribute('data-matches-filter');
    document.querySelectorAll('[data-matches-filter]').forEach(b=>{
      b.classList.toggle('active', b === btn);
    });
    renderTimeline();
  };
});

document.getElementById("compactToggleBtn").onclick = ()=>{
  compactMode = !compactMode;
  expandedIds.clear();
  document.getElementById("compactToggleBtn").classList.toggle("active", compactMode);
  document.getElementById("compactToggleBtn").textContent = compactMode ? "📋 Normal" : "📋 Compacto";
  renderTimeline();
};

document.getElementById("gridToggleBtn").onclick = ()=>{
  calendarGridMode = !calendarGridMode;
  gridSelectedDay = null;
  document.getElementById("gridToggleBtn").classList.toggle("active", calendarGridMode);
  renderTimeline();
};

document.getElementById("supportBtn").onclick = ()=>{
  logVisit(CURRENT_VIEWER_NAME || "Anónimo", "support_click");
  window.open("https://ko-fi.com/dragaostats", "_blank", "noopener");
};

document.getElementById("facebookBtn").onclick = ()=>{
  logVisit(CURRENT_VIEWER_NAME || "Anónimo", "facebook_click");
  window.open("https://www.facebook.com/profile.php?id=61594855463005", "_blank", "noopener");
};

document.getElementById("instagramBtn").onclick = ()=>{
  logVisit(CURRENT_VIEWER_NAME || "Anónimo", "instagram_click");
  window.open("https://www.instagram.com/dragaostats/", "_blank", "noopener");
};

document.getElementById("filterToggleBtn").onclick = ()=>{
  const box = document.getElementById("filters");
  const open = box.classList.toggle("open");
  document.getElementById("filterToggleBtn").textContent = open ? "✕ Fechar" : "☰ Modalidades";
};

document.getElementById("compSelect").addEventListener("change", (e)=>{
  switchToCompetition(e.target.value);
});

document.getElementById("newCompBtn").onclick = async ()=>{
  const name = prompt("Nome da nova competição (ex: Jogos Olímpicos 2028):");
  if(!name || !name.trim()) return;
  const trimmed = name.trim();
  if(trimmed.length > 100 || /^[\{\[]/.test(trimmed) || /^\d+$/.test(trimmed)){
    alert("Esse nome não parece válido — usa um nome curto e normal para a competição.");
    return;
  }
  const wantsMatches = confirm(
    'Criar em "Modo Modalidades" (jogos por jornada, com data completa e resultado)?\n\n' +
    'OK = Modo Modalidades\nCancelar = Modo normal (provas/medalhas)'
  );
  const mode = wantsMatches ? "matches" : "medals";
  const id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  ALL.competitions.push({ id, name: trimmed, mode });
  ALL.data[id] = { events: [], status: {} };
  activeCompId = id;
  // Ação dedicada e rara — só aqui (e ao eliminar) é que a lista de competições é
  // mesmo enviada ao servidor, nunca numa gravação normal de provas.
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ competitions: ALL.competitions, compId: id, compData: ALL.data[id], adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      alert("⚠️ Não foi possível criar a competição: " + (result && result.error ? result.error : "erro desconhecido"));
    }
    markSynced();
  }catch(e){
    console.error("Falha ao criar competição:", e);
    alert("⚠️ Erro de rede ao criar a competição: " + e.message);
  }
  await switchToCompetition(id);
};

document.getElementById("deleteCompBtn").onclick = async ()=>{
  if(ALL.competitions.length <= 1){
    alert("Tem de existir sempre pelo menos uma competição.");
    return;
  }
  const comp = ALL.competitions.find(c=>c.id===activeCompId);
  if(!confirm(`Eliminar a competição "${comp.name}"? Todas as provas e marcações dela são apagadas para sempre.`)) return;
  const deletedId = activeCompId;
  ALL.competitions = ALL.competitions.filter(c=>c.id!==activeCompId);
  delete ALL.data[activeCompId];
  try{
    await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ competitions: ALL.competitions, deleteCompId: deletedId, adminPassword: getAdminPassword() })
    });
    markSynced();
  }catch(e){ console.error("Falha ao eliminar competição:", e); }
  await switchToCompetition(firstActiveOrAny());
};

document.getElementById("renameCompBtn").onclick = async ()=>{
  const comp = ALL.competitions.find(c=>c.id===activeCompId);
  if(!comp) return;
  const novoNome = prompt("Novo nome da competição:", comp.name);
  if(!novoNome || !novoNome.trim()) return;
  const trimmed = novoNome.trim();
  if(trimmed.length > 100 || /^[\{\[]/.test(trimmed) || /^\d+$/.test(trimmed)){
    alert("Esse nome não parece válido — usa um nome curto e normal para a competição.");
    return;
  }
  comp.name = trimmed;
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ competitions: ALL.competitions })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      alert("⚠️ Não foi possível mudar o nome: " + (result && result.error ? result.error : "erro desconhecido"));
    }
    markSynced();
  }catch(e){
    alert("⚠️ Erro de rede ao mudar o nome: " + e.message);
  }
  renderCompetitionSelector();
};

document.getElementById("pinCompBtn").onclick = ()=>{
  pinnedCompId = (pinnedCompId === activeCompId) ? null : activeCompId;
  try{
    if(pinnedCompId) localStorage.setItem("dia22-pinned-comp", pinnedCompId);
    else localStorage.removeItem("dia22-pinned-comp");
  }catch(e){}
  updateModeVisibleTabs();
};

document.getElementById("archiveCompBtn").onclick = async ()=>{
  const comp = ALL.competitions.find(c=>c.id===activeCompId);
  if(!comp) return;
  const goingToArchive = !comp.archived;
  if(goingToArchive && !confirm(`Arquivar "${comp.name}"? Deixa de aparecer na lista principal, mas fica acessível em "Ver competições arquivadas".`)) return;
  comp.archived = goingToArchive;
  try{
    await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ compId: comp.id, setArchived: goingToArchive, adminPassword: getAdminPassword() })
    });
    markSynced();
  }catch(e){ console.error("Falha ao arquivar/repor competição:", e); }
  if(goingToArchive){
    await switchToCompetition(firstActiveOrAny());
  }else{
    renderCompetitionSelector();
  }
};

document.getElementById("showArchivedBtn").onclick = ()=>{
  const row = document.getElementById("archivedRow");
  row.style.display = row.style.display === "none" ? "flex" : "none";
};

document.getElementById("restoreCompBtn").onclick = async ()=>{
  const id = document.getElementById("archivedSelect").value;
  if(!id) return;
  const comp = ALL.competitions.find(c=>c.id===id);
  if(!comp) return;
  comp.archived = false;
  try{
    await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ compId: id, setArchived: false, adminPassword: getAdminPassword() })
    });
    markSynced();
  }catch(e){ console.error("Falha ao repor competição:", e); }
  document.getElementById("archivedRow").style.display = "none";
  await switchToCompetition(id);
};

// --- Cabeçalho fixo que esconde ao descer e reaparece ao subir ---
const headerEl = document.querySelector("header");
const backToTopBtn = document.getElementById("backToTopBtn");

// O cabeçalho já não é "fixed" — comporta-se como uma parte normal da página,
// desaparece ao passares por cima dele a descer, e volta a aparecer sozinho ao
// chegares lá outra vez a subir, tal como qualquer conteúdo normal.
window.addEventListener("scroll", ()=>{
  backToTopBtn.classList.toggle("show", window.scrollY > 400);
}, { passive:true });

backToTopBtn.onclick = ()=>{
  window.scrollTo({ top:0, behavior:"smooth" });
};

// Tema claro/escuro — preferência guardada só neste dispositivo (localStorage)
