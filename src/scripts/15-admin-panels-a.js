// ===================== "A TUA ÉPOCA" (9) — resumo pessoal, só com o que já temos
// neste aparelho (visitas); nada disto é enviado nem guardado no servidor =====
document.getElementById("myYearBtn").onclick = ()=>{
  const n = getVisitCount_();
  const first = getFirstVisitDate_();
  const firstLabel = first ? formatFullDate(first) : "hoje";
  document.getElementById("myYearContent").innerHTML = `
    <div class="medal-section-title">📖 A tua época</div>
    <p style="margin:14px 0; font-size:13px; color:var(--text-dim); line-height:1.6;">Já visitaste o Dragão Stats <b style="color:var(--text);">${n} ${n===1 ? "vez" : "vezes"}</b>.</p>
    <p style="margin:0; font-size:13px; color:var(--text-dim); line-height:1.6;">A tua primeira visita (neste aparelho) foi a <b style="color:var(--text);">${firstLabel}</b>.</p>
  `;
  document.getElementById("myYearOverlay").style.display = "flex";
};
document.getElementById("myYearCloseBtn").onclick = ()=>{
  document.getElementById("myYearOverlay").style.display = "none";
};

function maybeShowChangelog(){
  let seen = null;
  try{ seen = localStorage.getItem("dia22-changelog-seen"); }catch(e){}
  if(seen === CHANGELOG_VERSION) return;
  const overlay = document.getElementById("changelogOverlay");
  document.getElementById("changelogContent").innerHTML = CHANGELOG_HTML;
  overlay.style.display = "flex";
  document.getElementById("changelogCloseBtn").onclick = ()=>{
    try{ localStorage.setItem("dia22-changelog-seen", CHANGELOG_VERSION); }catch(e){}
    overlay.style.display = "none";
  };
}

function ensureAdminAuthenticated(){
  return new Promise((resolve)=>{
    // Confia numa entrada já feita antes neste aparelho, sem voltar a perguntar
    // ao servidor — tal como o nome de quem só vê. Se a password tiver sido
    // entretanto removida no painel de acessos, esta pessoa só dá por isso se
    // algum dia limpar os dados do site ou mudar de aparelho.
    let saved = null;
    try{ saved = JSON.parse(localStorage.getItem("dia22-admin-auth") || "null"); }catch(e){}
    if(saved && saved.password && saved.name){
      resolve();
      return;
    }
    const overlay = document.getElementById("adminGateOverlay");
    overlay.style.display = "flex";
    const submit = async ()=>{
      const pwd = document.getElementById("adminPasswordInput").value.trim();
      if(!pwd) return;
      const btn = document.getElementById("adminGateSubmit");
      btn.disabled = true;
      // A password é confirmada no servidor (nunca localmente): o cliente não
      // tem — nem pode ter — a lista toda de passwords de admin, só quem já
      // estiver autenticado é que a pode voltar a pedir (ver renderAccessManagePanel).
      let result = null;
      try{
        const r = await fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ adminLoginAttempt: pwd })
        });
        result = await r.json().catch(()=>null);
      }catch(e){}
      btn.disabled = false;
      if(result && result.ok && result.valid && result.name){
        try{ localStorage.setItem("dia22-admin-auth", JSON.stringify({ password: pwd, name: result.name })); }catch(e){}
        overlay.style.display = "none";
        resolve();
      }else{
        document.getElementById("adminGateError").style.display = "block";
      }
    };
    document.getElementById("adminGateSubmit").onclick = submit;
    document.getElementById("adminPasswordInput").addEventListener("keydown", (e)=>{
      if(e.key === "Enter") submit();
    });
  });
}

async function saveAdminAuth(){
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ setAdminAuth: ADMIN_AUTH, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      alert("⚠️ Não foi possível gravar: " + (result && result.error ? result.error : "erro desconhecido"));
    }
  }catch(e){
    alert("⚠️ Erro de rede: " + e.message);
  }
}

function renderAccessManagePanel(){
  const panel = document.getElementById("accessManagePanel");
  const rows = Object.keys(ADMIN_AUTH).map(pwd => `
    <div style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
      <input class="result-input" data-name-for="${pwd.replace(/"/g,'&quot;')}" value="${ADMIN_AUTH[pwd].replace(/"/g,'&quot;')}" placeholder="Nome" style="flex:1;">
      <span style="font-family:'Archivo Narrow',sans-serif; font-size:12px; color:var(--text-dim); min-width:90px;">pw: ${pwd}</span>
      <button class="del-btn" data-remove-access="${pwd.replace(/"/g,'&quot;')}" title="Remover">✕</button>
    </div>
  `).join("");

  panel.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">
      ⚠️ Guarda bem estas passwords — quem as tiver consegue editar tudo (fora do
      link "só ver"). Se as perderes, fica-se sem conseguir editar pelo site até
      corrigires isto diretamente na Google Sheet.
    </div>
    ${rows || '<div class="medal-empty">Ainda sem ninguém aqui — sem nenhuma password aqui, a edição fica livre para toda a gente com o link normal.</div>'}
    <div style="display:flex; gap:8px; margin-top:10px;">
      <input id="newAccessName" class="result-input" placeholder="Nome da pessoa" style="flex:1;">
      <input id="newAccessPassword" class="result-input" placeholder="Password" style="flex:1;">
      <button class="add-save" id="addAccessBtn" style="white-space:nowrap;">+ Adicionar</button>
    </div>
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-save" id="saveAccessBtn">Guardar</button>
      <button class="add-cancel" id="closeAccessBtn">Fechar</button>
    </div>
  `;

  panel.querySelectorAll('[data-remove-access]').forEach(btn=>{
    btn.onclick = ()=>{
      delete ADMIN_AUTH[btn.getAttribute('data-remove-access')];
      renderAccessManagePanel();
    };
  });

  document.getElementById("addAccessBtn").onclick = ()=>{
    const name = document.getElementById("newAccessName").value.trim();
    const pwd = document.getElementById("newAccessPassword").value.trim();
    if(!name || !pwd) return;
    ADMIN_AUTH[pwd] = name;
    renderAccessManagePanel();
  };

  document.getElementById("saveAccessBtn").onclick = async ()=>{
    panel.querySelectorAll('[data-name-for]').forEach(input=>{
      const pwd = input.getAttribute('data-name-for');
      if(input.value.trim()) ADMIN_AUTH[pwd] = input.value.trim();
    });
    await saveAdminAuth();
    panel.style.display = "none";
  };

  document.getElementById("closeAccessBtn").onclick = ()=>{ panel.style.display = "none"; };
}

document.getElementById("accessManageBtn").onclick = async ()=>{
  const panel = document.getElementById("accessManagePanel");
  const opening = panel.style.display === "none";
  if(!opening){ panel.style.display = "none"; return; }
  panel.style.display = "block";
  // A lista de passwords só é pedida ao servidor neste momento (nunca antes),
  // e só porque já temos a nossa própria password de admin validada para a
  // pedir com ela — ver "getAdminAuth" no doPost, que exige exatamente isso.
  panel.innerHTML = '<div class="medal-empty">A carregar...</div>';
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ getAdminAuth: true, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(result && result.ok && result.adminAuth && typeof result.adminAuth === "object"){
      ADMIN_AUTH = result.adminAuth;
      renderAccessManagePanel();
    }else{
      panel.innerHTML = '<div class="medal-empty">⚠️ Não foi possível carregar a lista de acessos. Tenta fechar e abrir outra vez.</div>';
    }
  }catch(e){
    panel.innerHTML = '<div class="medal-empty">⚠️ Erro de rede ao carregar os acessos.</div>';
  }
};

// Formulário de reportar bug/sugestão — visível para toda a gente, incluindo
// quem só vê, já que é para eles também poderem avisar de algo.
let feedbackType = "bug";
document.getElementById("newsletterSubscribeBtn").onclick = async ()=>{
  const input = document.getElementById("newsletterEmailInput");
  const email = input.value.trim();
  if(!email || !email.includes("@") || !email.includes(".")){
    alert("Escreve um email válido.");
    return;
  }
  const btn = document.getElementById("newsletterSubscribeBtn");
  btn.disabled = true;
  btn.textContent = "A inscrever...";
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ subscribeNewsletter: { email: email } })
    });
    const result = await r.json().catch(()=>null);
    btn.disabled = false;
    if(result && result.ok === true){
      btn.textContent = "📩 Confirma no email!";
      input.value = "";
      setTimeout(()=>{ btn.textContent = "Receber Newsletter"; }, 4000);
      try{ localStorage.setItem("dia22-newsletter-subscribed", "1"); }catch(e){}
      const nlBanner = document.getElementById("newsletterBanner");
      if(nlBanner) nlBanner.style.display = "none";
      alert("📩 Enviámos um email de confirmação — clica no link lá dentro para começares a receber. Se não aparecer em alguns minutos, verifica a pasta de spam/lixo.");
    }else{
      btn.textContent = "Receber Newsletter";
      alert("⚠️ Não foi possível inscrever: " + (result && result.error ? result.error : "erro desconhecido"));
    }
  }catch(e){
    btn.disabled = false;
    btn.textContent = "Receber Newsletter";
    alert("⚠️ Erro de rede: " + e.message);
  }
};

document.getElementById("feedbackBtn").onclick = ()=>{
  document.getElementById("feedbackNameInput").value = (typeof CURRENT_VIEWER_NAME !== "undefined" && CURRENT_VIEWER_NAME) ? CURRENT_VIEWER_NAME : "";
  document.getElementById("feedbackMessageInput").value = "";
  feedbackType = "bug";
  document.getElementById("feedbackTypeBug").classList.add("active");
  document.getElementById("feedbackTypeSugestao").classList.remove("active");
  document.getElementById("feedbackFormOverlay").style.display = "flex";
};
document.getElementById("feedbackTypeBug").onclick = ()=>{
  feedbackType = "bug";
  document.getElementById("feedbackTypeBug").classList.add("active");
  document.getElementById("feedbackTypeSugestao").classList.remove("active");
};
document.getElementById("feedbackTypeSugestao").onclick = ()=>{
  feedbackType = "sugestao";
  document.getElementById("feedbackTypeSugestao").classList.add("active");
  document.getElementById("feedbackTypeBug").classList.remove("active");
};
document.getElementById("feedbackCancelBtn").onclick = ()=>{
  document.getElementById("feedbackFormOverlay").style.display = "none";
};
document.getElementById("feedbackSubmitBtn").onclick = async ()=>{
  const message = document.getElementById("feedbackMessageInput").value.trim();
  if(!message){ alert("Escreve alguma coisa antes de enviar."); return; }
  // limite simples contra "inundação" de reportes seguidos, do mesmo aparelho
  let lastSent = 0;
  try{ lastSent = parseInt(localStorage.getItem("dia22-last-feedback-sent") || "0", 10); }catch(e){}
  if(Date.now() - lastSent < 60000){
    alert("Já enviaste um reporte há pouco — espera um bocadinho antes de enviares outro.");
    return;
  }
  const name = document.getElementById("feedbackNameInput").value.trim() || "Anónimo";
  const t = new Date().toISOString();
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ submitFeedback: { type: feedbackType, name: name, message: message, t: t, pushToken: currentPushToken } })
    });
    const result = await r.json().catch(()=>null);
    if(result && result.ok === true){
      try{ localStorage.setItem("dia22-last-feedback-sent", String(Date.now())); }catch(e){}
      try{
        const mine = JSON.parse(localStorage.getItem("dia22-my-feedback-ts") || "[]");
        mine.push(t);
        localStorage.setItem("dia22-my-feedback-ts", JSON.stringify(mine));
      }catch(e){}
      document.getElementById("feedbackFormOverlay").style.display = "none";
      alert("Obrigado! Já foi enviado. 🙌");
    }else{
      alert("⚠️ Não foi possível enviar: " + (result && result.error ? result.error : "erro desconhecido"));
    }
  }catch(e){
    alert("⚠️ Erro de rede: " + e.message);
  }
};

// Painel de administração (só Fernando/irmão) para ver os bugs/sugestões recebidos
let feedbackShowingFull = false;

// Verifica se há reportes novos desde a última vez que o painel foi aberto —
// atualiza a bolinha vermelha e dispara um aviso do telemóvel para cada um novo
// (só uma vez por reporte, mesmo com a sincronização a repetir a cada 6s)
// Verifica se algum dos MEUS reportes (guardados neste aparelho, por hora de
// envio) já tem resposta do admin que ainda não vi — mostra um toast + uma
// notificação do telemóvel, uma única vez por resposta.
function checkMyFeedbackReplies(){
  let mine = [];
  try{ mine = JSON.parse(localStorage.getItem("dia22-my-feedback-ts") || "[]"); }catch(e){}
  if(mine.length === 0) return;
  let shown = [];
  try{ shown = JSON.parse(localStorage.getItem("dia22-my-feedback-replies-seen") || "[]"); }catch(e){}
  const shownSet = new Set(shown);
  let changed = false;
  FEEDBACK_LOG.forEach(entry=>{
    if(!mine.includes(entry.t) || !entry.reply || shownSet.has(entry.t)) return;
    shownSet.add(entry.t);
    changed = true;
    showToast(`💬 Resposta ao teu reporte: "${entry.reply.slice(0,80)}"`);
    if(notificationsEnabled) showAppNotification("💬 Resposta ao teu reporte", entry.reply.slice(0,120));
  });
  if(changed){
    try{ localStorage.setItem("dia22-my-feedback-replies-seen", JSON.stringify(Array.from(shownSet))); }catch(e){}
  }
}

function checkFeedbackUpdates(){
  let lastSeen = 0;
  try{ lastSeen = parseInt(localStorage.getItem("dia22-feedback-last-seen") || "0", 10); }catch(e){}

  const newOnes = FEEDBACK_LOG.filter(entry=>{
    const t = new Date(entry.t).getTime();
    return !isNaN(t) && t > lastSeen;
  });

  const badge = document.getElementById("feedbackBadge");
  if(badge){
    if(newOnes.length > 0){
      badge.textContent = newOnes.length > 9 ? "9+" : String(newOnes.length);
      badge.style.display = "inline-block";
    }else{
      badge.style.display = "none";
    }
  }

  // Só faz sentido avisar de bugs/sugestões reportados a quem edita — quem só vê
  // não tem de saber sempre que outra pessoa qualquer reporta algo.
  if(!notificationsEnabled || READONLY_MODE) return;
  let notified = [];
  try{ notified = JSON.parse(localStorage.getItem("dia22-feedback-notified") || "[]"); }catch(e){}
  const notifiedSet = new Set(notified);
  let changed = false;
  newOnes.forEach(entry=>{
    if(notifiedSet.has(entry.t)) return;
    notifiedSet.add(entry.t);
    changed = true;
    const icon = entry.type === "sugestao" ? "💡 Sugestão" : "🐛 Bug";
    showAppNotification(`${icon} reportado`, `${entry.name}: ${entry.message.slice(0,80)}`);
  });
  if(changed){
    try{ localStorage.setItem("dia22-feedback-notified", JSON.stringify(Array.from(notifiedSet))); }catch(e){}
  }
}

function renderFeedbackAdminPanel(list){
  const panel = document.getElementById("feedbackAdminPanel");
  const entries = [...(list || FEEDBACK_LOG)].reverse();
  const rows = entries.map(entry=>{
    const d = new Date(entry.t);
    const when = isNaN(d) ? entry.t : d.toLocaleString("pt-PT");
    const icon = entry.type === "sugestao" ? "💡" : "🐛";
    const replyBlock = entry.reply
      ? `<div style="margin-top:6px; padding:6px 10px; background:rgba(227,178,60,0.08); border-left:2px solid var(--gold-dim); border-radius:4px; font-size:12.5px; color:var(--text-dim);">💬 <b style="color:var(--text);">A tua resposta:</b> ${entry.reply} <button class="reply-edit-btn" data-reply-t="${entry.t}" style="background:none; border:none; color:var(--gold-dim); cursor:pointer; font-size:11px; text-decoration:underline; margin-left:6px;">editar</button></div>`
      : `<div class="reply-form" data-reply-t="${entry.t}" style="margin-top:6px; display:flex; gap:6px;">
          <input type="text" class="reply-input" placeholder="Responder..." style="flex:1; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:6px; padding:5px 8px; font-size:12.5px; color:var(--text);">
          <button class="add-save reply-send-btn" style="padding:4px 10px; font-size:12px;">Enviar</button>
        </div>`;
    return `<div style="padding:10px 0; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; gap:10px;">
      <div style="flex:1;">
        <div style="font-size:12px; color:var(--text-dim); margin-bottom:4px;">${icon} ${entry.name} · ${when}</div>
        <div style="font-size:13px; color:var(--text);">${entry.message}</div>
        ${replyBlock}
      </div>
      ${!feedbackShowingFull ? `<button class="del-btn" data-delete-feedback="${entry.t}" title="Eliminar este reporte">✕</button>` : ''}
    </div>`;
  }).join("");

  panel.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">
      ${feedbackShowingFull ? `Histórico completo (${entries.length} registos).` : `Página atual (${entries.length} registos mais recentes).`}
    </div>
    ${rows || '<div class="medal-empty">Ainda sem nada reportado.</div>'}
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-save" id="loadFullFeedbackBtn">${feedbackShowingFull ? 'A ver tudo ✓' : '📜 Ver histórico completo'}</button>
      <button class="add-cancel" id="closeFeedbackAdminBtn">Fechar</button>
    </div>
  `;
  async function sendFeedbackReply(t, reply){
    try{
      const r = await fetch(STORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ replyFeedback: { t: t, reply: reply }, adminPassword: getAdminPassword() })
      });
      const result = await r.json().catch(()=>null);
      if(result && result.ok === true){
        FEEDBACK_LOG = FEEDBACK_LOG.map(e=> e.t === t ? { ...e, reply: reply } : e);
        renderFeedbackAdminPanel(feedbackShowingFull ? FEEDBACK_LOG : null);
      }else{
        alert("⚠️ Não foi possível gravar a resposta: " + (result && result.error ? result.error : "erro desconhecido"));
      }
    }catch(e){
      alert("⚠️ Erro de rede: " + e.message);
    }
  }
  panel.querySelectorAll('.reply-form').forEach(form=>{
    const t = form.getAttribute('data-reply-t');
    const input = form.querySelector('.reply-input');
    const sendBtn = form.querySelector('.reply-send-btn');
    sendBtn.onclick = ()=>{
      const reply = input.value.trim();
      if(!reply) return;
      sendFeedbackReply(t, reply);
    };
    input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') sendBtn.click(); });
  });
  panel.querySelectorAll('.reply-edit-btn').forEach(btn=>{
    btn.onclick = ()=>{
      const t = btn.getAttribute('data-reply-t');
      const entry = FEEDBACK_LOG.find(e=>e.t === t);
      const novo = prompt("Editar resposta:", entry ? entry.reply : "");
      if(novo === null) return;
      sendFeedbackReply(t, novo.trim());
    };
  });
  panel.querySelectorAll('[data-delete-feedback]').forEach(btn=>{
    btn.onclick = async ()=>{
      if(!confirm("Eliminar este reporte?")) return;
      const t = btn.getAttribute('data-delete-feedback');
      try{
        const r = await fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ deleteFeedback: { t: t }, adminPassword: getAdminPassword() })
        });
        const result = await r.json().catch(()=>null);
        if(result && result.ok === true){
          FEEDBACK_LOG = FEEDBACK_LOG.filter(e=>e.t !== t);
          renderFeedbackAdminPanel();
        }else{
          alert("⚠️ Não foi possível eliminar: " + (result && result.error ? result.error : "erro desconhecido"));
        }
      }catch(e){
        alert("⚠️ Erro de rede: " + e.message);
      }
    };
  });
  document.getElementById("loadFullFeedbackBtn").onclick = async ()=>{
    if(feedbackShowingFull) return;
    document.getElementById("loadFullFeedbackBtn").textContent = "A carregar...";
    try{
      const r = await fetch(STORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ getFullFeedback: true, adminPassword: getAdminPassword() })
      });
      const result = await r.json();
      if(result && result.ok && Array.isArray(result.fullFeedback)){
        feedbackShowingFull = true;
        renderFeedbackAdminPanel(result.fullFeedback);
      }
    }catch(e){
      alert("⚠️ Erro de rede ao ir buscar o histórico: " + e.message);
    }
  };
  document.getElementById("closeFeedbackAdminBtn").onclick = ()=>{ panel.style.display = "none"; };
}

document.getElementById("feedbackAdminBtn").onclick = ()=>{
  const panel = document.getElementById("feedbackAdminPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening){
    feedbackShowingFull = false;
    renderFeedbackAdminPanel();
    try{ localStorage.setItem("dia22-feedback-last-seen", String(Date.now())); }catch(e){}
    const badge = document.getElementById("feedbackBadge");
    if(badge) badge.style.display = "none";
  }
};

let visitsShowingFull = false; // false = só a página atual (rápido), true = histórico completo
let visitsViewMode = "lista"; // "lista", "ranking" ou "grafico"
let visitsFullLogCache = null; // histórico completo já pedido ao servidor (reutilizado pelas 3 vistas, para não pedir duas vezes)

// Agrupa o registo de acessos por nome, separando visitas de instalações —
// serve para perceber quem entra mais vezes (não é 100% fiável se houver
// nomes repetidos entre pessoas diferentes, mas dá uma ideia de assiduidade)
function computeVisitsRanking(entries){
  const stats = {};
  // exclui pelo tipo (gate_shown, versão correta) e também pelo nome literal
  // "(sem nome)" — porque testes feitos antes de publicares o apps-script-v41
  // ficaram gravados como "visita" normal, sem o tipo correto, e essas entradas
  // antigas não têm como ser corrigidas com o tipo sozinho
  entries.filter(e=>e.type!=="gate_shown" && CLICK_LOG_TYPES.indexOf(e.type) === -1 && e.name!=="(sem nome)").forEach(entry=>{
    const name = entry.name || "?";
    if(!stats[name]) stats[name] = { visitas: 0, instalacoes: 0 };
    if(entry.type === "install") stats[name].instalacoes++;
    else stats[name].visitas++;
  });
  return Object.entries(stats)
    .map(([name, s])=>({ name, ...s, total: s.visitas + s.instalacoes }))
    .sort((a,b)=> b.total - a.total || a.name.localeCompare(b.name, "pt"));
}

// Agrupa o registo de acessos por DIA (AAAA-MM-DD) — só cria uma entrada para
// dias que tenham mesmo acessos, não preenche dias vazios com zero
function computeDailyVisits(entries){
  const counts = {};
  entries.filter(e=>e.type!=="gate_shown" && CLICK_LOG_TYPES.indexOf(e.type) === -1 && e.name!=="(sem nome)").forEach(entry=>{
    const d = new Date(entry.t);
    const key = isNaN(d) ? String(entry.t || "").slice(0,10) : d.toISOString().slice(0,10);
    if(!key) return;
    if(!counts[key]) counts[key] = { visitas: 0, instalacoes: 0 };
    if(entry.type === "install") counts[key].instalacoes++;
    else counts[key].visitas++;
  });
  return Object.keys(counts).sort().map(date=>({ date, ...counts[date], total: counts[date].visitas + counts[date].instalacoes }));
}

async function fetchFullVisitLogIfNeeded(forceRefresh){
  if(visitsFullLogCache && !forceRefresh) return visitsFullLogCache;
  const r = await fetch(STORE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ getFullVisitLog: true, adminPassword: getAdminPassword() })
  });
  const result = await r.json();
  if(result && result.ok && Array.isArray(result.fullVisitLog)){
    visitsFullLogCache = result.fullVisitLog;
    return visitsFullLogCache;
  }
  throw new Error("Resposta inválida do servidor");
}

function visitsTabsHtml(){
  return `
    <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
      <button class="chip${visitsViewMode==='lista'?' active':''}" id="visitsTabLista">📋 Lista</button>
      <button class="chip${visitsViewMode==='ranking'?' active':''}" id="visitsTabRanking">🏆 Ranking</button>
      <button class="chip${visitsViewMode==='grafico'?' active':''}" id="visitsTabChart">📈 Gráfico</button>
    </div>
  `;
}

function attachVisitsTabHandlers(){
  const listaBtn = document.getElementById("visitsTabLista");
  const rankingBtn = document.getElementById("visitsTabRanking");
  const chartBtn = document.getElementById("visitsTabChart");
  if(listaBtn) listaBtn.onclick = ()=>{ visitsViewMode = "lista"; renderVisitsLogPanel(visitsShowingFull ? visitsFullLogCache : null); };
  if(rankingBtn) rankingBtn.onclick = ()=>{ visitsViewMode = "ranking"; renderVisitsLogPanel(); };
  if(chartBtn) chartBtn.onclick = ()=>{ visitsViewMode = "grafico"; renderVisitsLogPanel(); };
}

function renderVisitsRankingBody(fullLog){
  const panel = document.getElementById("visitsLogPanel");
  const ranking = computeVisitsRanking(fullLog);
  const realAccessCount = fullLog.filter(e=>e.type!=="gate_shown" && e.name!=="(sem nome)").length;
  const rows = ranking.map((r, i)=>`
    <div class="compact-line" style="cursor:default;">
      <div style="font-weight:600; font-size:14px; color:var(--text);">${i+1}º · ${r.name}</div>
      <div style="font-size:12.5px; color:var(--text-dim); margin-top:2px;">👁️ ${r.visitas} visita${r.visitas===1?'':'s'} · 📲 ${r.instalacoes} instalaç${r.instalacoes===1?'ão':'ões'} · <b style="color:var(--text);">${r.total} no total</b></div>
    </div>
  `).join("");

  panel.innerHTML = visitsTabsHtml() + `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">
      Ranking de assiduidade (${ranking.length} pessoas, ${realAccessCount} acessos no total). Baseado no nome escrito — pode não ser 100% fiável se houver nomes repetidos.
    </div>
    ${rows || '<div class="medal-empty">Ainda sem acessos registados.</div>'}
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-cancel" id="closeVisitsBtn">Fechar</button>
    </div>
  `;
  attachVisitsTabHandlers();
  document.getElementById("closeVisitsBtn").onclick = ()=>{ panel.style.display = "none"; };
}

function renderVisitsChartBody(fullLog){
  const panel = document.getElementById("visitsLogPanel");
  const daily = computeDailyVisits(fullLog);
  const todayKey = new Date().toISOString().slice(0,10);
  const last14 = daily.slice(-14);
  const maxInWindow = Math.max(1, ...last14.map(d=>d.total));
  const allTimeMax = Math.max(0, ...daily.map(d=>d.total));
  const recordDay = daily.find(d=>d.total === allTimeMax);
  const todayEntry = daily.find(d=>d.date === todayKey) || { date: todayKey, visitas:0, instalacoes:0, total:0 };
  const previousMax = Math.max(0, ...daily.filter(d=>d.date !== todayKey).map(d=>d.total));
  const isNewRecord = todayEntry.total > 0 && todayEntry.total > previousMax;

  const bars = last14.map(d=>{
    const h = Math.round((d.total / maxInWindow) * 80) + 4; // entre 4 e 84px
    const dt = new Date(d.date + "T00:00:00");
    const label = isNaN(dt) ? d.date.slice(5) : dt.toLocaleDateString("pt-PT",{ day:"2-digit", month:"2-digit" });
    const isToday = d.date === todayKey;
    return `
      <div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; min-width:0;">
        <div title="${label}: ${d.total} acesso${d.total===1?'':'s'}" style="width:100%; max-width:18px; height:${h}px; border-radius:3px 3px 0 0; background:${isToday ? 'var(--gold)' : 'var(--gold-dim)'};"></div>
        <div style="font-size:9px; color:var(--text-dim); white-space:nowrap;">${label}</div>
      </div>`;
  }).join("");

  panel.innerHTML = visitsTabsHtml() + `
    ${isNewRecord ? `<div style="background:rgba(227,178,60,0.15); border:1px solid var(--gold-dim); border-radius:8px; padding:8px 12px; font-size:13px; color:var(--gold); margin-bottom:10px;">🔥 Novo recorde: ${todayEntry.total} acesso${todayEntry.total===1?'':'s'} hoje!</div>` : ''}
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">
      Hoje: <b style="color:var(--text);">${todayEntry.total}</b> acesso${todayEntry.total===1?'':'s'} · Recorde: <b style="color:var(--text);">${allTimeMax}</b>${recordDay ? ` (${new Date(recordDay.date+"T00:00:00").toLocaleDateString("pt-PT")})` : ''}
    </div>
    <div style="display:flex; align-items:flex-end; gap:4px; height:100px; padding:0 2px 4px; border-bottom:1px solid var(--line); margin-bottom:6px;">
      ${bars || '<div class="medal-empty">Ainda sem dados suficientes.</div>'}
    </div>
    <div style="font-size:11px; color:var(--text-dim); opacity:0.75; margin-bottom:10px;">Últimos ${last14.length} dias com acessos registados (visitas + instalações somadas).</div>
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-cancel" id="closeVisitsBtn">Fechar</button>
    </div>
  `;
  attachVisitsTabHandlers();
  document.getElementById("closeVisitsBtn").onclick = ()=>{ panel.style.display = "none"; };
}

function renderVisitsLogPanel(list){
  const panel = document.getElementById("visitsLogPanel");
  const tabsHtml = visitsTabsHtml();

  if(visitsViewMode === "ranking" || visitsViewMode === "grafico"){
    panel.innerHTML = tabsHtml + `<div class="medal-empty">A carregar histórico completo...</div>`;
    attachVisitsTabHandlers();
    const modeAtRequest = visitsViewMode;
    // tanto o Ranking como o Gráfico vão sempre buscar os dados atuais — são as
    // duas vistas que servem de "verdade" sobre a atividade real, não faz sentido
    // ficarem presas a uma versão antiga pedida mais cedo na mesma sessão
    fetchFullVisitLogIfNeeded(true).then(fullLog=>{
      if(visitsViewMode !== modeAtRequest) return; // utilizador já mudou de separador entretanto
      if(modeAtRequest === "ranking") renderVisitsRankingBody(fullLog);
      else renderVisitsChartBody(fullLog);
    }).catch(e=>{
      if(visitsViewMode !== modeAtRequest) return;
      panel.innerHTML = tabsHtml + `<div class="medal-empty">⚠️ Erro de rede ao ir buscar o histórico: ${e.message}</div>
        <div class="add-btn-row" style="margin-top:14px;"><button class="add-cancel" id="closeVisitsBtn">Fechar</button></div>`;
      attachVisitsTabHandlers();
      document.getElementById("closeVisitsBtn").onclick = ()=>{ panel.style.display = "none"; };
    });
    return;
  }

  const entries = [...(list || VISIT_LOG)].reverse(); // mais recente primeiro
  const gateShownCount = entries.filter(e=>e.type==="gate_shown" || e.name==="(sem nome)").length;
  const namedEntries = entries.filter(e=>e.type!=="gate_shown" && CLICK_LOG_TYPES.indexOf(e.type) === -1 && e.name!=="(sem nome)");
  const installCount = namedEntries.filter(e=>e.type==="install").length;
  const notifyCount = namedEntries.filter(e=>e.notify).length;
  const supportClickCount = entries.filter(e=>e.type==="support_click").length;
  const facebookClickCount = entries.filter(e=>e.type==="facebook_click").length;
  const instagramClickCount = entries.filter(e=>e.type==="instagram_click").length;
  const installClickCount = entries.filter(e=>e.type==="install_click").length;
  const socialClicksText = (facebookClickCount ? `, ${facebookClickCount} cliques no Facebook` : '') + (instagramClickCount ? `, ${instagramClickCount} no Instagram` : '') + (installClickCount ? `, ${installClickCount} em instalar app` : '');
  const rows = entries.map(entry=>{
    const d = new Date(entry.t);
    const when = isNaN(d) ? entry.t : d.toLocaleString("pt-PT");
    const icon = entry.type === "install" ? "📲" : entry.type === "support_click" ? "☕" : entry.type === "facebook_click" ? "📘" : entry.type === "instagram_click" ? "📸" : entry.type === "install_click" ? "⬇️" : ((entry.type === "gate_shown" || entry.name === "(sem nome)") ? "🚪" : "👁️");
    return `<div class="compact-line" style="cursor:default;">
      <span class="c-athlete">${icon} ${entry.name}${entry.notify ? ' 🔔' : ''}</span>
      <span class="c-phase c-phase-datetime">${when}</span>
    </div>`;
  }).join("");

  panel.innerHTML = tabsHtml + `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">
      ${visitsShowingFull ? `Histórico completo (${entries.length} registos, ${installCount} instalações, ${notifyCount} com avisos ligados${supportClickCount ? `, ${supportClickCount} cliques em apoiar` : ''}${socialClicksText}).` : `Página atual (${entries.length} registos mais recentes, ${installCount} instalações, ${notifyCount} com avisos ligados${supportClickCount ? `, ${supportClickCount} cliques em apoiar` : ''}${socialClicksText}).`}
      <br><span style="font-size:11px; opacity:0.75;">📲 = instalou a app · 👁️ = só visitou (o iPhone não avisa instalações, só Android/PC) · 🚪 = viu o pedido do nome e (até agora) não escreveu nada · 🔔 = tem os avisos ligados neste aparelho · ☕ = carregou em "Apoiar o projeto" (não confirma se chegou a doar, isso só o Ko-fi sabe) · 📘 / 📸 = carregou no logo do Facebook / Instagram · ⬇️ = carregou em "Instalar app"</span>
      ${gateShownCount > 0 ? `<br><span style="font-size:11px; opacity:0.85; color:var(--gold-dim);">📋 O aviso a pedir o nome apareceu ${gateShownCount} vez${gateShownCount===1?'':'es'} a quem ainda não tinha nome guardado neste aparelho.</span>` : ''}
    </div>
    ${rows || '<div class="medal-empty">Ainda sem acessos registados.</div>'}
    <div class="add-btn-row" style="margin-top:14px;">
      <button class="add-save" id="loadFullVisitsBtn">${visitsShowingFull ? 'A ver tudo ✓' : '📜 Ver histórico completo'}</button>
      <button class="add-cancel" id="closeVisitsBtn">Fechar</button>
    </div>
  `;
  attachVisitsTabHandlers();
  document.getElementById("loadFullVisitsBtn").onclick = async ()=>{
    if(visitsShowingFull) return;
    document.getElementById("loadFullVisitsBtn").textContent = "A carregar...";
    try{
      const fullLog = await fetchFullVisitLogIfNeeded();
      visitsShowingFull = true;
      renderVisitsLogPanel(fullLog);
    }catch(e){
      alert("⚠️ Erro de rede ao ir buscar o histórico: " + e.message);
    }
  };
  document.getElementById("closeVisitsBtn").onclick = ()=>{ panel.style.display = "none"; };
}

document.getElementById("visitsLogBtn").onclick = ()=>{
  const panel = document.getElementById("visitsLogPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening){ visitsShowingFull = false; visitsViewMode = "lista"; renderVisitsLogPanel(); }
};

