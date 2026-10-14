// ===================== VER SUBSCRITORES DA NEWSLETTER (só modo edição) =====================
let newsletterSubsCache = null; // pedido uma vez por abertura do painel, para não sobrecarregar o servidor
async function renderNewsletterSubsPanel(){
  const panel = document.getElementById("newsletterSubsPanel");
  panel.innerHTML = `<div class="medal-empty">A carregar...</div>`;
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ getNewsletterSubscribers: true, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      panel.innerHTML = `<div class="medal-empty">⚠️ Não foi possível ir buscar a lista: ${result && result.error ? result.error : "erro desconhecido"}</div>
        <div class="add-btn-row" style="margin-top:14px;"><button class="add-cancel" id="closeNewsletterSubsBtn">Fechar</button></div>`;
      document.getElementById("closeNewsletterSubsBtn").onclick = ()=>{ panel.style.display = "none"; };
      return;
    }
    newsletterSubsCache = result.newsletterSubscribers || [];
    const confirmedCount = newsletterSubsCache.filter(s=>s.confirmed).length;
    const pendingCount = newsletterSubsCache.length - confirmedCount;
    const rows = newsletterSubsCache.map(s=>{
      const d = new Date(s.t);
      const when = isNaN(d) ? s.t : d.toLocaleString("pt-PT");
      return `<div class="compact-line" style="cursor:default;">
        <span class="c-athlete">📧 ${s.email}${s.confirmed ? '' : ' <span style="color:var(--pending);">(por confirmar)</span> <button class="resend-confirm-btn" data-email="${s.email}" style="margin-left:6px; padding:2px 8px; font-size:10.5px; background:none; border:1px solid var(--line); border-radius:6px; color:var(--text-dim); cursor:pointer;">Reenviar</button>'}</span>
        <span class="c-phase c-phase-datetime">${when}</span>
      </div>`;
    }).join("");
    panel.innerHTML = `
      <div style="margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid var(--line);">
        <div style="font-size:12px; color:var(--text-dim); margin-bottom:6px;">Envia-te um teste do email desta semana (com o conteúdo real, mas só para ti — não conta como envio a sério nem mexe na lista de subscritores).</div>
        <div style="display:flex; gap:8px;">
          <input type="email" id="newsletterTestEmailInput" placeholder="o-teu-email@exemplo.com" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--line); border-radius:8px; padding:8px; font-size:13px; color:var(--text);">
          <button class="add-save" id="newsletterTestSendBtn" style="white-space:nowrap; padding:8px 14px;">Enviar teste</button>
        </div>
      </div>
      <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">${confirmedCount} confirmada${confirmedCount===1?'':'s'}${pendingCount ? `, ${pendingCount} por confirmar` : ''} no resumo semanal.</div>
      ${rows || '<div class="medal-empty">Ainda ninguém inscrito.</div>'}
      <div class="add-btn-row" style="margin-top:14px;">
        <button class="add-cancel" id="closeNewsletterSubsBtn">Fechar</button>
      </div>
    `;
    document.getElementById("closeNewsletterSubsBtn").onclick = ()=>{ panel.style.display = "none"; };
    panel.querySelectorAll(".resend-confirm-btn").forEach(btn=>{
      btn.onclick = async ()=>{
        btn.disabled = true; btn.textContent = "...";
        try{
          const r = await fetch(STORE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ resendNewsletterConfirmation: { email: btn.dataset.email }, adminPassword: getAdminPassword() })
          });
          const result = await r.json().catch(()=>null);
          if(result && result.ok === true){
            btn.textContent = "Enviado ✓";
          }else{
            btn.textContent = "Reenviar";
            alert("⚠️ Não foi possível reenviar.");
            btn.disabled = false;
          }
        }catch(e){
          btn.textContent = "Reenviar";
          alert("⚠️ Erro de rede: " + e.message);
          btn.disabled = false;
        }
      };
    });
    document.getElementById("newsletterTestSendBtn").onclick = async ()=>{
      const email = document.getElementById("newsletterTestEmailInput").value.trim();
      if(!email){ alert("Escreve o teu email primeiro."); return; }
      const btn = document.getElementById("newsletterTestSendBtn");
      btn.disabled = true; btn.textContent = "A enviar...";
      try{
        const r = await fetch(STORE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ sendNewsletterTest: { email: email }, adminPassword: getAdminPassword() })
        });
        const result = await r.json().catch(()=>null);
        if(result && result.ok === true){
          alert(result.hadContent ? "Teste enviado! Confere a caixa de entrada (e o spam, por via das dúvidas)." : "Não há nada para mostrar esta semana (sem resultados nem jogos agendados), por isso não foi enviado nada.");
        }else{
          alert("⚠️ Não foi possível enviar: " + (result && result.error ? result.error : "erro desconhecido"));
        }
      }catch(e){
        alert("⚠️ Erro de rede: " + e.message);
      }
      btn.disabled = false; btn.textContent = "Enviar teste";
    };
  }catch(e){
    panel.innerHTML = `<div class="medal-empty">⚠️ Erro de rede: ${e.message}</div>
      <div class="add-btn-row" style="margin-top:14px;"><button class="add-cancel" id="closeNewsletterSubsBtn">Fechar</button></div>`;
    document.getElementById("closeNewsletterSubsBtn").onclick = ()=>{ panel.style.display = "none"; };
  }
}
document.getElementById("newsletterSubsBtn").onclick = ()=>{
  const panel = document.getElementById("newsletterSubsPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening) renderNewsletterSubsPanel();
};

function renderPollAdminPanel(){
  const panel = document.getElementById("pollAdminPanel");
  const isActive = POLL && POLL.question;
  const optionsHtml = Array.from({length: pollOptionCount}, (_, i) => i).map(i=>`<input type="text" class="poll-option-input" placeholder="Opção ${i+1}${i<2?'':' (opcional)'}" value="${isActive && POLL.options && POLL.options[i] ? POLL.options[i] : ''}" style="width:100%; margin-bottom:6px; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:6px; padding:6px 8px; font-size:12.5px; color:var(--text);">`).join("");
  panel.innerHTML = `
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:10px;">${isActive ? `Sondagem ativa: "${POLL.question}" — "Publicar sondagem" substitui esta e reinicia os votos; "Corrigir título" só muda o texto da pergunta e mantém os votos.` : 'Ainda sem sondagem ativa.'}</div>
    <input type="text" id="pollQuestionInput" placeholder="Pergunta (ex: Achas que ganhamos sábado?)" value="${isActive ? POLL.question : ''}" style="width:100%; margin-bottom:8px; background:rgba(255,255,255,0.04); border:1px solid var(--line); border-radius:6px; padding:7px 9px; font-size:13px; color:var(--text);">
    ${optionsHtml}
    <button class="add-cancel" id="pollAddOptionBtn" style="width:100%; margin-bottom:10px; padding:8px; font-size:12.5px;">+ Adicionar opção</button>
    <div class="add-btn-row" style="margin-top:10px;">
      <button class="add-save" id="pollPublishBtn">Publicar sondagem</button>
      ${isActive ? `<button class="add-cancel" id="pollFixTitleBtn" style="padding:8px 14px;">Corrigir título</button>` : ''}
      ${isActive ? `<button class="del-btn" id="pollEndBtn" style="padding:8px 14px;">Terminar sondagem</button>` : ''}
      <button class="add-cancel" id="closePollAdminBtn">Fechar</button>
    </div>
    <div style="margin-top:14px; border-top:1px solid var(--line); padding-top:12px;">
      <button class="add-cancel" id="togglePollArchiveBtn" style="font-size:11.5px; padding:5px 10px;">📜 Ver sondagens antigas</button>
      <div id="pollArchiveList" style="display:none; margin-top:10px;"></div>
    </div>
  `;
  document.getElementById("pollAddOptionBtn").onclick = ()=>{
    // guarda o que já estava escrito, antes de voltar a desenhar o painel com mais um campo
    const currentQuestion = document.getElementById("pollQuestionInput").value;
    const currentValues = [...panel.querySelectorAll('.poll-option-input')].map(i=>i.value);
    pollOptionCount++;
    renderPollAdminPanel();
    document.getElementById("pollQuestionInput").value = currentQuestion;
    const inputs = panel.querySelectorAll('.poll-option-input');
    currentValues.forEach((v,i)=>{ if(inputs[i]) inputs[i].value = v; });
  };
  document.getElementById("pollPublishBtn").onclick = async ()=>{
    const question = document.getElementById("pollQuestionInput").value.trim();
    const options = [...panel.querySelectorAll('.poll-option-input')].map(i=>i.value.trim()).filter(Boolean);
    if(!question || options.length < 2){
      alert("Precisas de uma pergunta e pelo menos 2 opções.");
      return;
    }
    await setPollRemote({ question: question, options: options, votes: {}, updatedAt: new Date().toISOString() });
  };
  const fixTitleBtn = document.getElementById("pollFixTitleBtn");
  if(fixTitleBtn) fixTitleBtn.onclick = async ()=>{
    const question = document.getElementById("pollQuestionInput").value.trim();
    if(!question){
      alert("A pergunta não pode ficar vazia.");
      return;
    }
    await updatePollQuestionRemote(question);
  };
  const endBtn = document.getElementById("pollEndBtn");
  if(endBtn) endBtn.onclick = async ()=>{
    if(!confirm("Terminar a sondagem atual?")) return;
    await setPollRemote(null);
  };
  document.getElementById("closePollAdminBtn").onclick = ()=>{ panel.style.display = "none"; };
  document.getElementById("togglePollArchiveBtn").onclick = ()=>{
    const box = document.getElementById("pollArchiveList");
    const opening = box.style.display === "none";
    box.style.display = opening ? "block" : "none";
    if(opening) loadPollArchive();
  };
}

async function loadPollArchive(){
  const box = document.getElementById("pollArchiveList");
  if(!box) return;
  box.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">A ir buscar sondagens antigas...</div>`;
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ getPollArchive: true, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(!result || result.ok !== true){
      box.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">⚠️ Não foi possível ir buscar as sondagens antigas.</div>`;
      return;
    }
    const archive = (result.pollArchive || []).slice().reverse(); // mais recente primeiro
    if(!archive.length){
      box.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">Ainda não há sondagens arquivadas.</div>`;
      return;
    }
    box.innerHTML = archive.map(p=>{
      const votes = p.votes || {};
      const total = Object.values(votes).reduce((a,b)=>a+b, 0);
      const d = new Date(p.updatedAt);
      const when = isNaN(d) ? "" : d.toLocaleDateString("pt-PT");
      const rowsHtml = (p.options || []).map(opt=>{
        const count = votes[opt] || 0;
        const pct = total ? Math.round(count/total*100) : 0;
        return `<div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-dim); padding:2px 0;">
          <span>${opt}</span><span>${count} (${pct}%)</span>
        </div>`;
      }).join("");
      return `<div style="padding:8px 0; border-bottom:1px solid var(--line);">
        <div style="font-size:13px; color:var(--text); font-weight:600;">${p.question}</div>
        <div style="font-size:11px; color:var(--gold-dim); margin-bottom:4px;">${total} voto${total===1?'':'s'} · ${when}</div>
        ${rowsHtml}
      </div>`;
    }).join("");
  }catch(e){
    box.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">⚠️ Erro de rede ao ir buscar as sondagens antigas.</div>`;
  }
}
// Corrige só o texto da pergunta de uma sondagem já ativa, sem tocar nas opções,
// nos votos ou no updatedAt — ao contrário de "Publicar sondagem", que reinicia tudo.
async function updatePollQuestionRemote(newQuestion){
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ updatePollQuestion: { pollId: POLL.updatedAt, question: newQuestion }, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(result && result.ok === true){
      POLL.question = newQuestion; // só este campo muda, tudo o resto fica igual
      renderPollWidget();
      renderPollAdminPanel();
    }else{
      alert("⚠️ Não foi possível gravar: " + (result && result.error ? result.error : "erro desconhecido"));
    }
  }catch(e){
    alert("⚠️ Erro de rede: " + e.message);
  }
}
async function setPollRemote(value){
  try{
    const r = await fetch(STORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ setPoll: value, adminPassword: getAdminPassword() })
    });
    const result = await r.json().catch(()=>null);
    if(result && result.ok === true){
      POLL = value;
      renderPollWidget();
      renderPollAdminPanel();
    }else{
      alert("⚠️ Não foi possível gravar: " + (result && result.error ? result.error : "erro desconhecido"));
    }
  }catch(e){
    alert("⚠️ Erro de rede: " + e.message);
  }
}
document.getElementById("pollAdminBtn").onclick = ()=>{
  const panel = document.getElementById("pollAdminPanel");
  const opening = panel.style.display === "none";
  panel.style.display = opening ? "block" : "none";
  if(opening){
    // sempre que abre de novo, começa só com os campos precisos (4, ou mais se
    // a sondagem ativa já tiver mais opções do que isso)
    pollOptionCount = Math.max(4, (POLL && Array.isArray(POLL.options)) ? POLL.options.length : 0);
    renderPollAdminPanel();
  }
};

// Estatísticas de utilização (Cloudflare Web Analytics) — anónimas, sem cookies.
// Cola aqui o token do Cloudflare (Web Analytics → o teu site → instalação manual).
// Enquanto estiver vazio, fica tudo desligado. Não conta visitas de administração
// (/edicao ou ?view=edit) nem de localhost.
(function loadCloudflareAnalytics(){
  const CF_ANALYTICS_TOKEN = "7710edc192a54400a948f18a00096612";
  if(!CF_ANALYTICS_TOKEN) return;
  try{
    if(ON_EDIT_PATH) return;
    if(location.hostname === "localhost" || location.hostname === "127.0.0.1") return;
    const beacon = document.createElement("script");
    beacon.type = "module"; // igual ao snippet gerado pelo Cloudflare
    beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    beacon.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_ANALYTICS_TOKEN }));
    document.head.appendChild(beacon);
  }catch(e){}
})();

// PWA: regista o service worker (permite instalar a app e abrir mesmo sem rede)
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
